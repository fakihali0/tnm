-- Phase 1: Complete Backend Integration - Database Schema

-- Extend profiles table with trading-specific fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trading_experience TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create trading_accounts table for linked MT4/MT5 accounts
CREATE TABLE public.trading_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('MT4', 'MT5')),
  broker_name TEXT NOT NULL,
  server TEXT NOT NULL,
  login_number TEXT NOT NULL,
  account_name TEXT,
  currency TEXT DEFAULT 'USD',
  leverage INTEGER,
  balance DECIMAL(15,2),
  equity DECIMAL(15,2),
  margin DECIMAL(15,2),
  free_margin DECIMAL(15,2),
  margin_level DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, server, login_number)
);

-- Create trades table for complete trade history
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  volume DECIMAL(10,4) NOT NULL,
  entry_price DECIMAL(15,5) NOT NULL,
  exit_price DECIMAL(15,5),
  stop_loss DECIMAL(15,5),
  take_profit DECIMAL(15,5),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  pnl DECIMAL(15,2),
  commission DECIMAL(15,2) DEFAULT 0,
  swap DECIMAL(15,2) DEFAULT 0,
  risk_reward_ratio DECIMAL(5,2),
  trade_status TEXT DEFAULT 'open' CHECK (trade_status IN ('open', 'closed', 'pending')),
  notes TEXT,
  tags TEXT[],
  session TEXT CHECK (session IN ('Asia', 'London', 'NewYork', 'Overlap')),
  strategy TEXT,
  screenshot_url TEXT,
  external_trade_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading_strategies table
CREATE TABLE public.trading_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB,
  win_rate DECIMAL(5,2),
  profit_factor DECIMAL(5,2),
  avg_risk_reward DECIMAL(5,2),
  total_trades INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create journal_summaries table for cached analytics
CREATE TABLE public.journal_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  profit_factor DECIMAL(10,4) DEFAULT 0,
  avg_win DECIMAL(15,2) DEFAULT 0,
  avg_loss DECIMAL(15,2) DEFAULT 0,
  largest_win DECIMAL(15,2) DEFAULT 0,
  largest_loss DECIMAL(15,2) DEFAULT 0,
  net_pnl DECIMAL(15,2) DEFAULT 0,
  gross_profit DECIMAL(15,2) DEFAULT 0,
  gross_loss DECIMAL(15,2) DEFAULT 0,
  avg_risk_reward DECIMAL(5,2) DEFAULT 0,
  max_consecutive_wins INTEGER DEFAULT 0,
  max_consecutive_losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, period_start, period_end)
);

-- Create saved_views table for custom filter combinations
CREATE TABLE public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trading_accounts
CREATE POLICY "Users can view their own trading accounts"
ON public.trading_accounts FOR SELECT
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own trading accounts"
ON public.trading_accounts FOR INSERT
WITH CHECK (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own trading accounts"
ON public.trading_accounts FOR UPDATE
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own trading accounts"
ON public.trading_accounts FOR DELETE
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for trades
CREATE POLICY "Users can view trades from their accounts"
ON public.trades FOR SELECT
USING (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can insert trades to their accounts"
ON public.trades FOR INSERT
WITH CHECK (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can update trades in their accounts"
ON public.trades FOR UPDATE
USING (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can delete trades from their accounts"
ON public.trades FOR DELETE
USING (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
));

-- Create RLS policies for trading_strategies
CREATE POLICY "Users can manage their own strategies"
ON public.trading_strategies FOR ALL
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for journal_summaries
CREATE POLICY "Users can view summaries from their accounts"
ON public.journal_summaries FOR SELECT
USING (account_id IN (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "System can manage journal summaries"
ON public.journal_summaries FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update journal summaries"
ON public.journal_summaries FOR UPDATE
USING (true);

-- Create RLS policies for saved_views
CREATE POLICY "Users can manage their own saved views"
ON public.saved_views FOR ALL
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_trading_accounts_updated_at
  BEFORE UPDATE ON public.trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
  BEFORE UPDATE ON public.trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_summaries_updated_at
  BEFORE UPDATE ON public.journal_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_status ON public.trading_accounts(connection_status);
CREATE INDEX idx_trades_account_id ON public.trades(account_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_trades_opened_at ON public.trades(opened_at);
CREATE INDEX idx_trades_status ON public.trades(trade_status);
CREATE INDEX idx_journal_summaries_account_id ON public.journal_summaries(account_id);
CREATE INDEX idx_journal_summaries_period ON public.journal_summaries(period_start, period_end);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read_at);

-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, mobile_number, country, country_code)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'country_code', '')
  );
  RETURN NEW;
END;
$function$;