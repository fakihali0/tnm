/**
 * useAccountInsights Hook
 * 
 * Provides aggregated metrics and insights across trading accounts.
 * Used by AIHub to display live MT5 data, P&L statistics, and sync status.
 */

import { useMemo } from 'react';
import type { LinkedAccount } from '@/store/auth';
import type { Trade } from '@/types/trading';

export interface AccountMetrics {
  totalBalance: number;
  totalEquity: number;
  totalMargin: number;
  totalFreeMargin: number;
  openPositionCount: number;
  avgMarginLevel: number;
  currency: string;
}

export interface PnLMetrics {
  daily: { profit: number; trades: number; winRate: number };
  weekly: { profit: number; trades: number; winRate: number };
  monthly: { profit: number; trades: number; winRate: number };
  total: { profit: number; trades: number; winRate: number };
}

export interface SyncStatus {
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  status: 'connected' | 'syncing' | 'error' | 'inactive';
  error?: string;
}

/**
 * Calculate aggregate metrics across accounts
 */
export function calculateAggregateMetrics(
  accounts: LinkedAccount[],
  selectedAccount?: LinkedAccount | null
): AccountMetrics {
  const accountsToAggregate = selectedAccount ? [selectedAccount] : accounts.filter(acc => acc.is_active);

  if (accountsToAggregate.length === 0) {
    return {
      totalBalance: 0,
      totalEquity: 0,
      totalMargin: 0,
      totalFreeMargin: 0,
      openPositionCount: 0,
      avgMarginLevel: 0,
      currency: 'USD',
    };
  }

  // Aggregate metrics
  const totalBalance = accountsToAggregate.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalEquity = accountsToAggregate.reduce((sum, acc) => sum + (acc.equity || 0), 0);
  const totalMargin = accountsToAggregate.reduce((sum, acc) => sum + (acc.margin || 0), 0);
  const totalFreeMargin = accountsToAggregate.reduce((sum, acc) => sum + (acc.free_margin || 0), 0);

  // Count accounts with margin usage as having open positions
  const openPositionCount = accountsToAggregate.filter(acc => (acc.margin || 0) > 0).length;

  // Calculate average margin level
  const marginLevels = accountsToAggregate
    .filter(acc => acc.margin_level !== undefined && acc.margin_level !== null)
    .map(acc => acc.margin_level!);
  const avgMarginLevel = marginLevels.length > 0
    ? marginLevels.reduce((sum, level) => sum + level, 0) / marginLevels.length
    : 0;

  // Use currency from first account or default to USD
  const currency = accountsToAggregate[0]?.currency || 'USD';

  return {
    totalBalance,
    totalEquity,
    totalMargin,
    totalFreeMargin,
    openPositionCount,
    avgMarginLevel,
    currency,
  };
}

/**
 * Calculate P&L metrics from trades
 */
export function calculatePnLMetrics(trades: Trade[]): PnLMetrics {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const closedTrades = trades.filter(t => t.closed_at && t.pnl !== undefined);

  const calculatePeriodMetrics = (filterDate: Date) => {
    const periodTrades = closedTrades.filter(t => {
      const closeDate = new Date(t.closed_at!);
      return closeDate >= filterDate;
    });

    const profit = periodTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = periodTrades.filter(t => (t.pnl || 0) > 0);
    const winRate = periodTrades.length > 0 ? (winningTrades.length / periodTrades.length) * 100 : 0;

    return {
      profit,
      trades: periodTrades.length,
      winRate,
    };
  };

  return {
    daily: calculatePeriodMetrics(oneDayAgo),
    weekly: calculatePeriodMetrics(oneWeekAgo),
    monthly: calculatePeriodMetrics(oneMonthAgo),
    total: {
      profit: closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      trades: closedTrades.length,
      winRate: closedTrades.length > 0
        ? (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100
        : 0,
    },
  };
}

/**
 * Determine sync status for account(s)
 */
export function calculateSyncStatus(
  accounts: LinkedAccount[],
  selectedAccount: LinkedAccount | null,
  syncingAccountId: string | null,
  syncErrors: Record<string, string>
): SyncStatus {
  const account = selectedAccount;

  if (!account) {
    // Multi-account view: show worst status
    const hasError = Object.keys(syncErrors).length > 0;
    const isSyncing = syncingAccountId !== null;
    const activeAccounts = accounts.filter(acc => acc.is_active);

    if (activeAccounts.length === 0) {
      return {
        lastSyncTime: null,
        nextSyncTime: null,
        status: 'inactive',
      };
    }

    if (hasError) {
      return {
        lastSyncTime: null,
        nextSyncTime: null,
        status: 'error',
        error: Object.values(syncErrors)[0],
      };
    }

    if (isSyncing) {
      return {
        lastSyncTime: null,
        nextSyncTime: null,
        status: 'syncing',
      };
    }

    // Find most recent sync
    const lastSyncTimes = activeAccounts
      .filter(acc => acc.last_sync_at)
      .map(acc => new Date(acc.last_sync_at!));

    if (lastSyncTimes.length === 0) {
      return {
        lastSyncTime: null,
        nextSyncTime: null,
        status: 'inactive',
      };
    }

    const lastSyncTime = new Date(Math.max(...lastSyncTimes.map(d => d.getTime())));
    const nextSyncTime = new Date(lastSyncTime.getTime() + 5 * 60 * 1000); // 5 min intervals

    return {
      lastSyncTime,
      nextSyncTime,
      status: 'connected',
    };
  }

  // Single account view
  const error = syncErrors[account.id];
  const isSyncing = syncingAccountId === account.id;

  if (!account.is_active) {
    return {
      lastSyncTime: null,
      nextSyncTime: null,
      status: 'inactive',
    };
  }

  if (error) {
    return {
      lastSyncTime: null,
      nextSyncTime: null,
      status: 'error',
      error,
    };
  }

  if (isSyncing) {
    return {
      lastSyncTime: account.last_sync_at ? new Date(account.last_sync_at) : null,
      nextSyncTime: null,
      status: 'syncing',
    };
  }

  const lastSyncTime = account.last_sync_at ? new Date(account.last_sync_at) : null;
  const nextSyncTime = lastSyncTime ? new Date(lastSyncTime.getTime() + 5 * 60 * 1000) : null;

  return {
    lastSyncTime,
    nextSyncTime,
    status: 'connected',
  };
}

/**
 * Hook: useAccountInsights
 * 
 * Aggregates account metrics, P&L statistics, and sync status for AIHub display.
 */
export function useAccountInsights(
  accounts: LinkedAccount[],
  selectedAccount: LinkedAccount | null,
  trades: Trade[],
  syncingAccountId: string | null,
  syncErrors: Record<string, string>
) {
  const metrics = useMemo(
    () => calculateAggregateMetrics(accounts, selectedAccount),
    [accounts, selectedAccount]
  );

  const pnl = useMemo(
    () => calculatePnLMetrics(trades),
    [trades]
  );

  const syncStatus = useMemo(
    () => calculateSyncStatus(accounts, selectedAccount, syncingAccountId, syncErrors),
    [accounts, selectedAccount, syncingAccountId, syncErrors]
  );

  return {
    metrics,
    pnl,
    syncStatus,
  };
}
