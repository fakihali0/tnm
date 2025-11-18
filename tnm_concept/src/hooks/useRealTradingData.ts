import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trade, TradingAccount } from '@/types/trading';

export interface Position {
  ticket: number;
  time: string;
  type: number;
  type_str: 'buy' | 'sell';
  volume: number;
  symbol: string;
  price_open: number;
  price_current: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
  commission: number;
}

interface UseRealTradingDataReturn {
  accounts: TradingAccount[];
  selectedAccount: TradingAccount | null;
  trades: Trade[];
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  selectAccount: (accountId: string) => void;
  syncAccount: (accountId: string) => Promise<void>;
  refreshPositions: () => Promise<void>;
}

export const useRealTradingData = (): UseRealTradingDataReturn => {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccounts = async (): Promise<TradingAccount[]> => {
    try {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const realAccounts = data || [];
      setAccounts(realAccounts);
      
      return realAccounts;
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to fetch trading accounts');
      return [];
    }
  };

  const fetchTrades = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .order('opened_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setTrades(data || []);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to fetch trades');
    }
  };

  const fetchPositions = async (accountId: string) => {
    try {
      console.log('🔄 Fetching open positions for account:', accountId);
      
      // Fetch open trades (positions) from database
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .is('closed_at', null)
        .order('opened_at', { ascending: false });

      if (error) throw error;

      console.log('📩 fetchPositions response:', data);
      if (data) {
        console.log('✅ Positions fetched successfully:', data.length);
        // Map trades to position format
        const mappedPositions = data.map(trade => ({
          ticket: parseInt(trade.external_trade_id || '0'),
          time: trade.opened_at,
          type: trade.direction === 'BUY' ? 0 : 1,
          type_str: trade.direction.toLowerCase() as 'buy' | 'sell',
          volume: trade.volume,
          symbol: trade.symbol,
          price_open: trade.entry_price,
          price_current: trade.entry_price, // Will be updated with live data if needed
          sl: trade.stop_loss || 0,
          tp: trade.take_profit || 0,
          profit: trade.pnl || 0,
          swap: trade.swap || 0,
          commission: trade.commission || 0
        }));
        setPositions(mappedPositions);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.error('❌ Error fetching positions:', err);
      setPositions([]);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const freshAccounts = await fetchAccounts();
      
      if (freshAccounts.length > 0) {
        let accountToSelect: TradingAccount | null = null;
        
        // Prioritize default account for positions display
        const defaultAccount = freshAccounts.find(acc => acc.is_default);
        if (defaultAccount) {
          accountToSelect = defaultAccount;
        } else if (selectedAccount) {
          // Try to keep current selection if still valid and no default set
          accountToSelect = freshAccounts.find(acc => acc.id === selectedAccount.id) || null;
        }
        
        // If no valid selection, pick the first account
        if (!accountToSelect) {
          accountToSelect = freshAccounts[0];
        }
        
        setSelectedAccount(accountToSelect);
        await Promise.all([
          fetchTrades(accountToSelect.id),
          fetchPositions(accountToSelect.id)
        ]);
      } else {
        setSelectedAccount(null);
        setTrades([]);
        setPositions([]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPositions = async () => {
    if (selectedAccount) {
      await fetchPositions(selectedAccount.id);
    }
  };

  const selectAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      Promise.all([
        fetchTrades(accountId),
        fetchPositions(accountId)
      ]);
    }
  };

  const syncAccount = async (accountId: string) => {
    // MetaAPI integration disabled
    toast({
      title: "Sync Disabled",
      description: "MetaAPI integration has been removed. Use the MT5 service instead.",
      variant: "default",
    });
  };

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  // Note: Real-time subscriptions and auto-refresh removed
  // Positions and trades only update on:
  // 1. Initial load
  // 2. Manual refresh (refreshData())
  // 3. Manual sync (sync button)
  // 4. Account selection change

  return {
    accounts,
    selectedAccount,
    trades,
    positions,
    isLoading,
    error,
    refreshData,
    selectAccount,
    syncAccount,
    refreshPositions
  };
};