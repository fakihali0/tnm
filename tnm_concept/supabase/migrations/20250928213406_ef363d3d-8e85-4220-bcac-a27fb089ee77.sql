-- Create account integrations table to store external API connections
CREATE TABLE IF NOT EXISTS public.account_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'metaapi', 'fxcm', etc.
  external_account_id TEXT NOT NULL,
  credentials JSONB, -- Encrypted credentials storage
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, provider)
);

-- Enable RLS
ALTER TABLE public.account_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own account integrations"
ON public.account_integrations
FOR ALL
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create AI insights table for caching AI-generated insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('performance', 'risk', 'strategy', 'market')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_level TEXT NOT NULL CHECK (impact_level IN ('high', 'medium', 'low')),
  actionable BOOLEAN DEFAULT false,
  recommendation TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view insights for their accounts"
ON public.ai_insights
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "System can insert AI insights"
ON public.ai_insights
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.trading_accounts 
    WHERE user_id = (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create risk alerts table for real-time risk monitoring
CREATE TABLE IF NOT EXISTS public.risk_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('margin_call', 'drawdown', 'exposure', 'correlation')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  current_value NUMERIC,
  threshold_value NUMERIC,
  action_required BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own risk alerts"
ON public.risk_alerts
FOR SELECT
USING (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert risk alerts"
ON public.risk_alerts
FOR INSERT
WITH CHECK (user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_account_integrations_updated_at
  BEFORE UPDATE ON public.account_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_alerts_updated_at
  BEFORE UPDATE ON public.risk_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_account_integrations_account_id ON public.account_integrations(account_id);
CREATE INDEX idx_ai_insights_account_id ON public.ai_insights(account_id);
CREATE INDEX idx_ai_insights_expires_at ON public.ai_insights(expires_at);
CREATE INDEX idx_risk_alerts_user_id ON public.risk_alerts(user_id);
CREATE INDEX idx_risk_alerts_account_id ON public.risk_alerts(account_id);
CREATE INDEX idx_risk_alerts_severity ON public.risk_alerts(severity);
CREATE INDEX idx_risk_alerts_triggered_at ON public.risk_alerts(triggered_at);