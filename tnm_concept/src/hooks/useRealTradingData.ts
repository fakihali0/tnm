import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trade, TradingAccount } from '@/types/trading';

interface UseRealTradingDataReturn {
  accounts: TradingAccount[];
  selectedAccount: TradingAccount | null;
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  selectAccount: (accountId: string) => void;
  syncAccount: (accountId: string) => Promise<void>;
}

// Helper to identify demo accounts
const isDemoAccount = (acc: TradingAccount) => {
  const name = (acc.account_name || '').toLowerCase();
  const server = (acc.server || '').toLowerCase();
  return name.includes('demo') || server.includes('demo');
};

export const useRealTradingData = (): UseRealTradingDataReturn => {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
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
      
      // Filter out demo accounts
      const allAccounts = data || [];
      const liveAccounts = allAccounts.filter(acc => !isDemoAccount(acc));
      setAccounts(liveAccounts);
      
      return liveAccounts;
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

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const freshAccounts = await fetchAccounts();
      
      if (freshAccounts.length > 0) {
        let accountToSelect: TradingAccount | null = null;
        
        // Try to keep current selection if still valid
        if (selectedAccount) {
          accountToSelect = freshAccounts.find(acc => acc.id === selectedAccount.id) || null;
        }
        
        // If no valid selection, pick the first account
        if (!accountToSelect) {
          accountToSelect = freshAccounts[0];
        }
        
        setSelectedAccount(accountToSelect);
        await fetchTrades(accountToSelect.id);
      } else {
        setSelectedAccount(null);
        setTrades([]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
      fetchTrades(accountId);
    }
  };

  const syncAccount = async (accountId: string) => {
    // MetaAPI integration disabled
    toast({
      title: "Sync Unavailable",
      description: "Live account synchronization is temporarily disabled. New integration coming soon!",
      variant: "default",
    });
  };


  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const accountsChannel = supabase
      .channel('trading-accounts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trading_accounts'
      }, () => {
        refreshData();
      })
      .subscribe();

    const tradesChannel = supabase
      .channel('trades-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades'
      }, () => {
        if (selectedAccount) {
          fetchTrades(selectedAccount.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(accountsChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [selectedAccount]);

  return {
    accounts,
    selectedAccount,
    trades,
    isLoading,
    error,
    refreshData,
    selectAccount,
    syncAccount
  };
};