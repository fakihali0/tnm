-- Create ai_risk_recommendations table
CREATE TABLE IF NOT EXISTS public.ai_risk_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  recommended_risk_percent NUMERIC,
  recommended_lot_size NUMERIC,
  risk_level TEXT CHECK (risk_level IN ('conservative', 'moderate', 'aggressive')),
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.ai_risk_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view recommendations for their accounts
CREATE POLICY "Users can view their risk recommendations"
ON public.ai_risk_recommendations
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.trading_accounts
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- System can insert recommendations
CREATE POLICY "System can insert risk recommendations"
ON public.ai_risk_recommendations
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.trading_accounts
    WHERE user_id = (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Create index for faster lookups
CREATE INDEX idx_ai_risk_recommendations_account_symbol 
ON public.ai_risk_recommendations(account_id, symbol, generated_at DESC);

-- Add cleanup for expired recommendations
CREATE OR REPLACE FUNCTION public.cleanup_old_risk_recommendations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.ai_risk_recommendations
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Keep only last 30 days of recommendations
  DELETE FROM public.ai_risk_recommendations
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;