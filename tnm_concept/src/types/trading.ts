// Unified trading types for the application

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  direction: string;
  volume: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  opened_at: string;
  closed_at?: string;
  pnl?: number;
  commission?: number;
  swap?: number;
  risk_reward_ratio?: number;
  trade_status: string;
  notes?: string;
  tags?: string[];
  session?: string;
  strategy?: string;
  screenshot_url?: string;
  external_trade_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  platform: string;
  broker_name: string;
  server: string;
  login_number: string;
  account_name?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  free_margin?: number;
  margin_level?: number;
  currency: string;
  leverage?: number;
  is_active: boolean;
  is_default?: boolean;
  connection_status: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: string;
  spread: number;
  isMarketOpen: boolean;
}

export interface AIInsight {
  id: string;
  account_id: string;
  insight_type: string;
  title: string;
  description: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendation?: string;
  generated_at: string;
  expires_at?: string;
}

export interface RiskAlert {
  id: string;
  user_id: string;
  account_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  current_value?: number;
  threshold_value?: number;
  action_required: boolean;
  triggered_at: string;
  resolved_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_url?: string;
  read_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Helper function to adapt database Trade to unified interface
export function adaptTrade(dbTrade: any): Trade {
  return {
    ...dbTrade
  };
}