import { useMemo } from 'react';
import { useAccountStore, useJournalStore } from '@/store/auth';
import { Trade } from '@/types/trading';

interface DashboardMetrics {
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgRiskReward: number;
  totalTrades: number;
  openTrades: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  grossProfit: number;
  grossLoss: number;
}

interface UseTradingDashboardReturn {
  selectedAccount: any;
  trades: Trade[];
  closedTrades: Trade[];
  openTrades: Trade[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
}

export const useTradingDashboard = (): UseTradingDashboardReturn => {
  const { selectedAccount } = useAccountStore();
  const { trades, isLoading } = useJournalStore();

  const closedTrades = useMemo(() => 
    trades.filter(trade => trade.closed_at && trade.pnl !== undefined),
    [trades]
  );

  const openTrades = useMemo(() => 
    trades.filter(trade => !trade.closed_at),
    [trades]
  );

  const metrics = useMemo((): DashboardMetrics => {
    if (closedTrades.length === 0) {
      return {
        netPnl: 0,
        winRate: 0,
        profitFactor: 0,
        avgRiskReward: 0,
        totalTrades: trades.length,
        openTrades: openTrades.length,
        bestDay: null,
        worstDay: null,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        largestWin: 0,
        largestLoss: 0,
        avgWin: 0,
        avgLoss: 0,
        grossProfit: 0,
        grossLoss: 0,
      };
    }

    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const netPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const avgRiskReward = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

    // Calculate consecutive streaks
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    closedTrades
      .sort((a, b) => new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime())
      .forEach(trade => {
        if ((trade.pnl || 0) > 0) {
          currentWinStreak++;
          currentLossStreak = 0;
          maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
        } else if ((trade.pnl || 0) < 0) {
          currentLossStreak++;
          currentWinStreak = 0;
          maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
        }
      });

    // Calculate best/worst days from actual trade data
    const dailyPnl = new Map<string, number>();
    closedTrades.forEach(trade => {
      if (trade.closed_at) {
        const date = new Date(trade.closed_at).toISOString().split('T')[0];
        dailyPnl.set(date, (dailyPnl.get(date) || 0) + (trade.pnl || 0));
      }
    });

    let bestDay: { date: string; pnl: number } | null = null;
    let worstDay: { date: string; pnl: number } | null = null;

    dailyPnl.forEach((pnl, date) => {
      if (!bestDay || pnl > bestDay.pnl) {
        bestDay = { date, pnl };
      }
      if (!worstDay || pnl < worstDay.pnl) {
        worstDay = { date, pnl };
      }
    });

    return {
      netPnl,
      winRate,
      profitFactor,
      avgRiskReward,
      totalTrades: trades.length,
      openTrades: openTrades.length,
      bestDay,
      worstDay,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      largestWin,
      largestLoss,
      avgWin,
      avgLoss,
      grossProfit,
      grossLoss,
    };
  }, [closedTrades, openTrades, trades]);

  const formatCurrency = (amount: number) => {
    if (!selectedAccount) return `$${amount.toFixed(2)}`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return {
    selectedAccount,
    trades,
    closedTrades,
    openTrades,
    metrics,
    isLoading,
    formatCurrency,
  };
};