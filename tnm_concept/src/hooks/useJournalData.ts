import { useEffect, useRef } from 'react';
import { useAccountStore, useJournalStore } from '@/store/auth';

/**
 * Hook to manage journal data loading lifecycle
 * Prevents duplicate loads and manages async state properly
 */
export const useJournalData = () => {
  const selectedAccount = useAccountStore(state => state.selectedAccount);
  const loadTrades = useJournalStore(state => state.loadTrades);
  const loadSummary = useJournalStore(state => state.loadSummary);
  
  const loadStateRef = useRef<{ accountId: string | null; inFlight: boolean }>({
    accountId: null,
    inFlight: false,
  });

  useEffect(() => {
    const accountId = selectedAccount?.id ?? null;

    if (!accountId) {
      loadStateRef.current = { accountId: null, inFlight: false };
      return;
    }

    if (
      loadStateRef.current.inFlight &&
      loadStateRef.current.accountId === accountId
    ) {
      return;
    }

    loadStateRef.current = { accountId, inFlight: true };
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        await Promise.all([
          loadTrades(accountId),
          loadSummary(accountId),
        ]);
      } catch (error) {
        console.error('Failed to load journal data:', error);
      } finally {
        if (isSubscribed) {
          loadStateRef.current = { accountId, inFlight: false };
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedAccount?.id, loadTrades, loadSummary]);
};
