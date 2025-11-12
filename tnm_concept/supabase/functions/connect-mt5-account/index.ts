import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { encryptCredentials, secureLog, sanitizeForLogging } from '../_shared/encryption.ts';
import { sanitizeConnectionError } from '../_shared/error-sanitizer.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

interface MT5ConnectionRequest {
  server: string;
  login: string;
  password: string;
  broker_name: string;
}

interface MT5ServiceAccountInfo {
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

interface MT5ServiceResponse {
  status: string;
  account_id: string;
  account_info: MT5ServiceAccountInfo;
  message: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  let userId: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;

    const { server, login, password, broker_name }: MT5ConnectionRequest = await req.json();

    // SECURITY: Use secure logging that masks sensitive data (NEVER log passwords)
    secureLog('Attempting MT5 connection:', { 
      requestId, 
      userId: user.id, 
      server, 
      login, 
      broker_name 
    });

    // Enhanced input validation
    if (!server || !login || !password || !broker_name) {
      throw new Error('Missing required connection parameters');
    }

    // Validate input formats for security
    if (typeof login !== 'string' || login.length < 3 || login.length > 50) {
      throw new Error('Invalid login format');
    }
    
    if (typeof password !== 'string' || password.length < 4 || password.length > 100) {
      throw new Error('Invalid password format');
    }

    if (typeof server !== 'string' || server.length < 3 || server.length > 100) {
      throw new Error('Invalid server format');
    }

    if (typeof broker_name !== 'string' || broker_name.length < 2 || broker_name.length > 100) {
      throw new Error('Invalid broker name format');
    }

    // Log security event for credential handling
    try {
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_attempt',
        _details: {
          request_id: requestId,
          user_id: user.id,
          broker: broker_name,
          server: server,
          login_masked: login.substring(0, 3) + '***',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          ip_source: 'edge_function'
        },
        _user_id: user.id
      });
    } catch (logError) {
      console.warn('Failed to log security event:', logError);
    }

    // Get MT5 service configuration
    const mt5ServiceUrl = Deno.env.get('MT5_SERVICE_URL');
    const mt5ServiceApiKey = Deno.env.get('MT5_SERVICE_API_KEY');
    
    if (!mt5ServiceUrl || !mt5ServiceApiKey) {
      throw new Error('MT5 service configuration not found');
    }

    // Call Python MT5 service to test connection
    let mt5Response: MT5ServiceResponse;
    let lastError: Error | null = null;
    const maxRetries = 1; // Single retry on timeout as per AC

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        secureLog(`MT5 service connection attempt ${attempt + 1}/${maxRetries + 1}`, { requestId });
        
        const response = await fetch(`${mt5ServiceUrl}/api/mt5/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': mt5ServiceApiKey,
          },
          body: JSON.stringify({
            login: parseInt(login),
            password: password,
            server: server,
            broker_name: broker_name
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(errorData.detail || errorData.message || 'Connection test failed');
        }

        mt5Response = await response.json();
        secureLog('MT5 service connection successful', { 
          requestId, 
          account_id: mt5Response.account_id 
        });
        break; // Success, exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          // Only retry on timeout or network errors
          if (error instanceof Error && 
              (error.name === 'TimeoutError' || error.message.includes('timeout') || 
               error.message.includes('network'))) {
            secureLog(`Retrying after error: ${error.message}`, { requestId });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            continue;
          }
        }
        
        throw lastError;
      }
    }

    if (!mt5Response!) {
      throw lastError || new Error('Failed to connect to MT5 service');
    }

    const accountInfo = mt5Response.account_info;

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Encrypt credentials before storage
    const encryptedCreds = await encryptCredentials({
      login: login,
      password: password,
      server: server,
      broker_name: broker_name,
      encrypted_at: new Date().toISOString()
    });

    // Create service role client for inserting sensitive data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert account into database
    const { data: dbAccount, error: dbError } = await supabaseAdmin
      .from('trading_accounts')
      .insert({
        user_id: profile.user_id,
        platform: 'MT5',
        broker_name: accountInfo.company,
        server: accountInfo.server,
        login_number: accountInfo.login.toString(),
        account_name: accountInfo.name,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        free_margin: accountInfo.margin_free,
        margin_level: accountInfo.margin_level,
        currency: accountInfo.currency,
        leverage: accountInfo.leverage,
        is_active: true,
        connection_status: 'connected',
        mt5_service_account_id: mt5Response.account_id,
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save account to database');
    }

    // Store encrypted credentials in account_integrations
    const { error: integrationError } = await supabaseAdmin
      .from('account_integrations')
      .insert({
        account_id: dbAccount.id,
        provider: 'mt5_direct',
        external_account_id: mt5Response.account_id,
        encrypted_credentials: encryptedCreds.encrypted_data,
        encryption_key_id: encryptedCreds.encryption_key_id,
        credentials: {
          iv: encryptedCreds.iv // Store IV for decryption
        }
      });

    if (integrationError) {
      secureLog('Failed to store integration data:', integrationError);
      // Try to clean up the trading account
      await supabaseAdmin
        .from('trading_accounts')
        .delete()
        .eq('id', dbAccount.id);
      throw new Error('Failed to store encrypted credentials');
    }

    secureLog('Successfully connected MT5 account:', { 
      requestId, 
      account_id: dbAccount.id 
    });

    // Log successful connection for security monitoring
    try {
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_success',
        _details: {
          request_id: requestId,
          user_id: user.id,
          account_id: dbAccount.id,
          broker: accountInfo.company,
          timestamp: new Date().toISOString()
        },
        _user_id: user.id
      });
    } catch (logError) {
      console.warn('Failed to log success event:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      account: {
        id: dbAccount.id,
        platform: 'MT5',
        broker_name: accountInfo.company,
        server: accountInfo.server,
        login: accountInfo.login.toString(),
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        currency: accountInfo.currency,
        trade_mode: accountInfo.trade_mode
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error connecting MT5 account:', { requestId, error });
    
    // Log security event for failed connection
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_failed',
        _details: {
          request_id: requestId,
          user_id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent')
        },
        _user_id: userId
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    // SECURITY: Sanitize error message to prevent information disclosure
    return new Response(JSON.stringify({ 
      success: false, 
      error: sanitizeConnectionError(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});