import { Trade } from '@/types/trading';

export interface PortfolioMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  avgRiskReward: number;
}

export const calculatePortfolioMetrics = (trades: Trade[]): PortfolioMetrics => {
  if (trades.length === 0) {
    return {
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      avgRiskReward: 0
    };
  }

  const closedTrades = trades.filter(trade => trade.trade_status === 'closed' && trade.pnl !== null);
  
  if (closedTrades.length === 0) {
    return {
      totalReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      avgRiskReward: 0
    };
  }

  // Calculate basic metrics
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
  
  const winRate = winningTrades.length / closedTrades.length;
  
  const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Calculate average risk-reward ratio
  const riskRewardRatios = closedTrades
    .filter(trade => trade.risk_reward_ratio && trade.risk_reward_ratio > 0)
    .map(trade => trade.risk_reward_ratio!);
  const avgRiskReward = riskRewardRatios.length > 0 
    ? riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length 
    : 0;

  // Calculate drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;

  closedTrades
    .sort((a, b) => new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime())
    .forEach(trade => {
      runningPnL += trade.pnl || 0;
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

  // Calculate Sharpe ratio (simplified)
  const returns = closedTrades.map(trade => trade.pnl || 0);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  return {
    totalReturn: totalPnL,
    sharpeRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    avgRiskReward
  };
};

export const calculateCorrelation = (trades1: Trade[], trades2: Trade[]): number => {
  // Simple correlation based on trading patterns
  if (trades1.length === 0 || trades2.length === 0) return 0;

  // Get daily returns for both symbols
  const getDailyReturns = (trades: Trade[]) => {
    const dailyReturns = new Map<string, number>();
    trades
      .filter(trade => trade.trade_status === 'closed' && trade.pnl !== null)
      .forEach(trade => {
        const date = new Date(trade.closed_at || trade.opened_at).toISOString().split('T')[0];
        dailyReturns.set(date, (dailyReturns.get(date) || 0) + (trade.pnl || 0));
      });
    return dailyReturns;
  };

  const returns1 = getDailyReturns(trades1);
  const returns2 = getDailyReturns(trades2);

  // Find common dates
  const commonDates = Array.from(returns1.keys()).filter(date => returns2.has(date));
  
  if (commonDates.length < 2) return 0;

  // Calculate correlation coefficient
  const values1 = commonDates.map(date => returns1.get(date)!);
  const values2 = commonDates.map(date => returns2.get(date)!);

  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < values1.length; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator > 0 ? numerator / denominator : 0;
};

export const calculatePositionRisk = (
  trade: Trade, 
  accountEquity: number,
  currentPrice?: number
): number => {
  if (!trade.stop_loss || !trade.entry_price || !accountEquity) return 0;

  const stopDistance = Math.abs(trade.entry_price - trade.stop_loss);
  const positionValue = trade.volume * (currentPrice || trade.entry_price);
  const riskAmount = stopDistance * trade.volume;
  
  return riskAmount / accountEquity;
};

export const calculateExposure = (
  trades: Trade[],
  accountEquity: number,
  currentPrices: Record<string, number> = {}
): number => {
  if (!accountEquity) return 0;

  const openTrades = trades.filter(trade => trade.trade_status === 'open');
  const totalExposure = openTrades.reduce((sum, trade) => {
    const currentPrice = currentPrices[trade.symbol] || trade.entry_price || 1;
    const positionValue = trade.volume * currentPrice;
    return sum + positionValue;
  }, 0);

  return totalExposure / accountEquity;
};