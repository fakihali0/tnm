import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { secureLog } from '../_shared/encryption.ts';

interface TradingAccount {
  id: string;
  user_id: string;
  mt5_service_account_id: string;
  login_number: string;
  broker_name: string;
  server: string;
  last_sync_at: string | null;
}

interface MT5AccountInfo {
  login: number;
  name: string;
  server: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  margin_level: number;
  leverage: number;
  trade_mode: string;
}

interface MT5Position {
  ticket: number;
  time: number;
  type: number;
  symbol: string;
  volume: number;
  price_open: number;
  sl: number;
  tp: number;
  price_current: number;
  swap: number;
  profit: number;
  comment: string;
}

interface MT5HistoryDeal {
  ticket: number;
  order: number;
  time: number;
  type: number;
  entry: number;
  position_id: number;
  symbol: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  comment: string;
}

interface SyncResult {
  account_id: string;
  status: 'success' | 'failed' | 'partial';
  started_at: string;
  completed_at: string;
  duration_ms: number;
  trades_synced: number;
  error_message?: string;
}

const BATCH_SIZE = 10;
const REQUEST_TIMEOUT = 30000; // 30 seconds

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const executionId = crypto.randomUUID();
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    secureLog('Starting sync-trading-data execution', { executionId });

    // Get MT5 service configuration
    const mt5ServiceUrl = Deno.env.get('MT5_SERVICE_URL');
    const mt5ServiceApiKey = Deno.env.get('MT5_SERVICE_API_KEY');
    
    if (!mt5ServiceUrl || !mt5ServiceApiKey) {
      throw new Error('MT5 service configuration not found');
    }

    // Create Supabase admin client
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseServiceRoleKey) {
      throw new Error('Supabase service role key not configured');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceRoleKey
    );

    // Parse request body to check for specific account_id
    let specificAccountId: string | null = null;
    let fetchPositionsOnly = false;
    try {
      const body = await req.json();
      specificAccountId = body.account_id || null;
      fetchPositionsOnly = Boolean(body.fetch_positions);
      secureLog('Request body parsed', { specificAccountId });
    } catch {
      // No body or invalid JSON - sync all accounts
      secureLog('No valid request body - will sync all accounts');
    }

    // Fast-path: fetch positions only for a specific account
    if (fetchPositionsOnly) {
      if (!specificAccountId) {
        throw new Error('fetch_positions requires account_id');
      }

      const { data: accountRecords, error: accountLookupError } = await supabaseAdmin
        .from('trading_accounts')
        .select('id, user_id, mt5_service_account_id, is_active')
        .eq('id', specificAccountId)
        .limit(1)
        .maybeSingle();

      if (accountLookupError) {
        throw new Error(`Failed to load account: ${accountLookupError.message}`);
      }

      if (!accountRecords || !accountRecords.is_active) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Account not found or inactive',
          positions: []
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!accountRecords.mt5_service_account_id) {
        throw new Error('Account missing MT5 service account reference');
      }

      const positions = await fetchPositions(
        accountRecords.mt5_service_account_id,
        mt5ServiceUrl,
        mt5ServiceApiKey,
        supabaseServiceRoleKey,
        accountRecords.user_id
      );

      return new Response(JSON.stringify({
        success: true,
        positions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load trading accounts (specific account or all active)
    let accountsQuery = supabaseAdmin
      .from('trading_accounts')
      .select('id, user_id, mt5_service_account_id, login_number, broker_name, server, last_sync_at')
      .eq('is_active', true)
      .not('mt5_service_account_id', 'is', null);

    // Filter by specific account if provided
    if (specificAccountId) {
      accountsQuery = accountsQuery.eq('id', specificAccountId);
      secureLog('Filtering for specific account', { account_id: specificAccountId });
    }

    const { data: accounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      throw new Error(`Failed to load accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      const message = specificAccountId 
        ? `Account ${specificAccountId} not found or inactive`
        : 'No active accounts to sync';
      secureLog(message, { executionId });
      return new Response(JSON.stringify({
        success: false,
        message,
        totalAccounts: 0,
        syncResults: [],
        executionId,
        duration_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    secureLog(`Found ${accounts.length} active accounts to sync`, { executionId });

    // Process accounts in batches
    const syncResults: SyncResult[] = [];
    const batchCount = Math.ceil(accounts.length / BATCH_SIZE);

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, accounts.length);
      const batch = accounts.slice(batchStart, batchEnd);

      secureLog(`Processing batch ${i + 1}/${batchCount} (${batch.length} accounts)`, { executionId });

      const batchResults = await Promise.allSettled(
        batch.map(account => syncAccount(
          account,
          mt5ServiceUrl,
          mt5ServiceApiKey,
          supabaseAdmin,
          supabaseServiceRoleKey
        ))
      );

      // Collect results
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          syncResults.push(result.value);
        } else {
          // Handle rejected promise
          const account = batch[idx];
          const errorResult: SyncResult = {
            account_id: account.id,
            status: 'failed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: 0,
            trades_synced: 0,
            error_message: result.reason?.message || 'Unknown error'
          };
          syncResults.push(errorResult);
        }
      });

      // Small delay between batches to avoid overwhelming the service
      if (i < batchCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log all sync results to sync_logs table
    if (syncResults.length > 0) {
      await supabaseAdmin
        .from('sync_logs')
        .insert(
          syncResults.map(result => ({
            account_id: result.account_id,
            sync_type: 'scheduled',
            started_at: result.started_at,
            completed_at: result.completed_at,
            status: result.status,
            trades_synced: result.trades_synced,
            error_message: result.error_message,
            duration_ms: result.duration_ms
          }))
        );
    }

    const successCount = syncResults.filter(r => r.status === 'success').length;
    const failureCount = syncResults.filter(r => r.status === 'failed').length;
    const partialCount = syncResults.filter(r => r.status === 'partial').length;

    secureLog('Sync execution completed', {
      executionId,
      totalAccounts: accounts.length,
      successCount,
      failureCount,
      partialCount,
      duration_ms: Date.now() - startTime
    });

    return new Response(JSON.stringify({
      success: true,
      executionId,
      totalAccounts: accounts.length,
      successCount,
      failureCount,
      partialCount,
      syncResults,
      duration_ms: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-trading-data:', { executionId, error });
    return new Response(JSON.stringify({ 
      success: false,
      executionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncAccount(
  account: TradingAccount,
  mt5ServiceUrl: string,
  mt5ServiceApiKey: string,
  supabaseAdmin: any,
  supabaseServiceRoleKey: string
): Promise<SyncResult> {
  const started_at = new Date().toISOString();
  const startTime = Date.now();
  let trades_synced = 0;
  let status: 'success' | 'failed' | 'partial' = 'success';
  let error_message: string | undefined;

  try {
    secureLog(`Syncing account ${account.id}`, { 
      login: account.login_number,
      broker: account.broker_name 
    });

    // Fetch account info
    let accountInfo: MT5AccountInfo | null = null;
    try {
      accountInfo = await fetchAccountInfo(
        account.mt5_service_account_id,
        mt5ServiceUrl,
        mt5ServiceApiKey,
        supabaseServiceRoleKey,
        account.user_id
      );
    } catch (error) {
      error_message = `Failed to fetch account info: ${error instanceof Error ? error.message : 'Unknown error'}`;
      status = 'partial';
    }

    // Fetch positions
    let positions: MT5Position[] = [];
    try {
      positions = await fetchPositions(
        account.mt5_service_account_id,
        mt5ServiceUrl,
        mt5ServiceApiKey,
        supabaseServiceRoleKey,
        account.user_id
      );
    } catch (error) {
      error_message = error_message 
        ? `${error_message}; Failed to fetch positions` 
        : `Failed to fetch positions: ${error instanceof Error ? error.message : 'Unknown error'}`;
      status = 'partial';
    }

    // Fetch history since last sync
    let historyDeals: MT5HistoryDeal[] = [];
    try {
      const fromDate = account.last_sync_at 
        ? new Date(account.last_sync_at).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days
      
      historyDeals = await fetchHistory(
        account.mt5_service_account_id,
        fromDate,
        mt5ServiceUrl,
        mt5ServiceApiKey,
        supabaseServiceRoleKey,
        account.user_id
      );
    } catch (error) {
      error_message = error_message 
        ? `${error_message}; Failed to fetch history` 
        : `Failed to fetch history: ${error instanceof Error ? error.message : 'Unknown error'}`;
      status = 'partial';
    }

    // Update trading_accounts if we have account info
    if (accountInfo) {
      await supabaseAdmin
        .from('trading_accounts')
        .update({
          balance: accountInfo.balance,
          equity: accountInfo.equity,
          margin: accountInfo.margin,
          free_margin: accountInfo.margin_free,
          margin_level: accountInfo.margin_level,
          last_sync_at: new Date().toISOString(),
          last_successful_sync_at: new Date().toISOString(),
          sync_failure_count: 0,
          last_connection_error: null
        })
        .eq('id', account.id);
    }

    // Upsert positions into trades table
    if (positions.length > 0) {
      const positionTrades = positions.map(pos => ({
        account_id: account.id,
        ticket: pos.ticket.toString(),
        symbol: pos.symbol,
        direction: pos.type === 0 ? 'BUY' : 'SELL',
        volume: pos.volume,
        entry_price: pos.price_open,
        opened_at: new Date(pos.time * 1000).toISOString(),
        stop_loss: pos.sl || null,
        take_profit: pos.tp || null,
        exit_price: pos.price_current,
        pnl: pos.profit,
        swap: pos.swap,
        commission: 0, // Not available in positions
        trade_status: 'open',
        notes: pos.comment || null
      }));

      await supabaseAdmin
        .from('trades')
        .upsert(positionTrades, { onConflict: 'ticket' });

      trades_synced += positions.length;
    }

    // Insert new history deals
    if (historyDeals.length > 0) {
      const historyTrades = historyDeals
        .filter(deal => deal.entry === 1) // Only entry deals (closed positions)
        .map(deal => ({
          account_id: account.id,
          ticket: deal.ticket.toString(),
          symbol: deal.symbol,
          direction: deal.type === 0 ? 'BUY' : 'SELL',
          volume: deal.volume,
          entry_price: deal.price,
          opened_at: new Date(deal.time * 1000).toISOString(),
          exit_price: deal.price,
          closed_at: new Date(deal.time * 1000).toISOString(),
          pnl: deal.profit,
          swap: deal.swap,
          commission: deal.commission,
          trade_status: 'closed',
          notes: deal.comment || null
        }));

      if (historyTrades.length > 0) {
        await supabaseAdmin
          .from('trades')
          .upsert(historyTrades, { onConflict: 'ticket' });

        trades_synced += historyTrades.length;
      }
    }

    // If nothing succeeded, mark as failed
    if (!accountInfo && positions.length === 0 && historyDeals.length === 0) {
      status = 'failed';
      if (!error_message) {
        error_message = 'All sync operations failed';
      }
    }

    // Update failure count on error
    if (status !== 'success') {
      await supabaseAdmin
        .from('trading_accounts')
        .update({
          sync_failure_count: supabaseAdmin.raw('sync_failure_count + 1'),
          last_connection_error: error_message
        })
        .eq('id', account.id);
    }

    return {
      account_id: account.id,
      status,
      started_at,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      trades_synced,
      error_message
    };

  } catch (error) {
    // Complete failure
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Update failure count
    await supabaseAdmin
      .from('trading_accounts')
      .update({
        sync_failure_count: supabaseAdmin.raw('sync_failure_count + 1'),
        last_connection_error: errorMsg
      })
      .eq('id', account.id);

    return {
      account_id: account.id,
      status: 'failed',
      started_at,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      trades_synced: 0,
      error_message: errorMsg
    };
  }
}

async function fetchAccountInfo(
  accountId: string,
  mt5ServiceUrl: string,
  mt5ServiceApiKey: string,
  supabaseServiceRoleKey: string,
  userId: string
): Promise<MT5AccountInfo> {
  const response = await fetch(`${mt5ServiceUrl}/api/mt5/account/${accountId}/info`, {
    method: 'GET',
    headers: {
      'X-API-Key': mt5ServiceApiKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      'X-Service-User-Id': userId,
      'ngrok-skip-browser-warning': 'true',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch account info');
  }

  const data = await response.json();
  return data.account_info;
}

async function fetchPositions(
  accountId: string,
  mt5ServiceUrl: string,
  mt5ServiceApiKey: string,
  supabaseServiceRoleKey: string,
  userId: string
): Promise<MT5Position[]> {
  const response = await fetch(`${mt5ServiceUrl}/api/mt5/account/${accountId}/positions`, {
    method: 'GET',
    headers: {
      'X-API-Key': mt5ServiceApiKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      'X-Service-User-Id': userId,
      'ngrok-skip-browser-warning': 'true',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch positions');
  }

  const data = await response.json();
  return data.positions || [];
}

async function fetchHistory(
  accountId: string,
  fromDate: string,
  mt5ServiceUrl: string,
  mt5ServiceApiKey: string,
  supabaseServiceRoleKey: string,
  userId: string
): Promise<MT5HistoryDeal[]> {
  const response = await fetch(
    `${mt5ServiceUrl}/api/mt5/account/${accountId}/history?from_date=${fromDate}`,
    {
      method: 'GET',
      headers: {
        'X-API-Key': mt5ServiceApiKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'X-Service-User-Id': userId,
        'ngrok-skip-browser-warning': 'true',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch history');
  }

  const data = await response.json();
  return data.deals || [];
}