// Database adapter utilities to convert between database schema and UI interfaces

import type { LinkedAccount, JournalSummary } from '@/store/auth';
import type { Trade } from '@/types/trading';

// Convert database trading_accounts to LinkedAccount interface
export const adaptLinkedAccount = (dbAccount: any): LinkedAccount => ({
  id: dbAccount.id,
  user_id: dbAccount.user_id,
  mt5_service_account_id: dbAccount.mt5_service_account_id,
  platform: dbAccount.platform as 'MT4' | 'MT5',
  broker_name: dbAccount.broker_name,
  server: dbAccount.server,
  login_number: dbAccount.login_number,
  account_name: dbAccount.account_name,
  balance: dbAccount.balance ?? 0,
  equity: dbAccount.equity ?? 0,
  margin: dbAccount.margin ?? 0,
  free_margin: dbAccount.free_margin ?? 0,
  margin_level: dbAccount.margin_level ?? 0,
  currency: dbAccount.currency,
  leverage: dbAccount.leverage ?? 1,
  is_active: dbAccount.is_active,
  is_default: dbAccount.is_default ?? false,
  connection_status: dbAccount.connection_status as 'connected' | 'disconnected' | 'error',
  last_sync_at: dbAccount.last_sync_at,
  created_at: dbAccount.created_at,
  updated_at: dbAccount.updated_at,
  
  // Legacy compatibility properties
  login: dbAccount.login_number,
  freeMargin: dbAccount.free_margin,
  createdAt: dbAccount.created_at,
});

// Convert database trades to Trade interface
export const adaptTrade = (dbTrade: any): Trade => ({
  id: dbTrade.id,
  account_id: dbTrade.account_id,
  symbol: dbTrade.symbol,
  direction: dbTrade.direction,
  volume: dbTrade.volume,
  entry_price: dbTrade.entry_price,
  exit_price: dbTrade.exit_price,
  stop_loss: dbTrade.stop_loss,
  take_profit: dbTrade.take_profit,
  opened_at: dbTrade.opened_at,
  closed_at: dbTrade.closed_at,
  pnl: dbTrade.pnl,
  commission: dbTrade.commission,
  swap: dbTrade.swap,
  risk_reward_ratio: dbTrade.risk_reward_ratio,
  trade_status: dbTrade.trade_status,
  notes: dbTrade.notes,
  tags: dbTrade.tags,
  session: dbTrade.session,
  strategy: dbTrade.strategy,
  screenshot_url: dbTrade.screenshot_url,
  external_trade_id: dbTrade.external_trade_id,
  created_at: dbTrade.created_at,
  updated_at: dbTrade.updated_at,
});

// Convert database journal_summaries to JournalSummary interface
export const adaptJournalSummary = (dbSummary: any): JournalSummary => ({
  winRate: dbSummary.win_rate || 0,
  profitFactor: dbSummary.profit_factor || 0,
  avgRR: dbSummary.avg_risk_reward || 0,
  avgWin: dbSummary.avg_win || 0,
  avgLoss: dbSummary.avg_loss || 0,
  netPL: dbSummary.net_pnl || 0,
  bestDay: dbSummary.largest_win ? {
    date: new Date().toISOString(), // This would come from a different query
    pnl: dbSummary.largest_win
  } : null,
  worstDay: dbSummary.largest_loss ? {
    date: new Date().toISOString(), // This would come from a different query
    pnl: dbSummary.largest_loss
  } : null,
  streak: {
    wins: dbSummary.max_consecutive_wins || 0,
    losses: dbSummary.max_consecutive_losses || 0
  }
});