-- Create market_insights table for persistent market intelligence data
CREATE TABLE public.market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('technical', 'sentiment', 'prediction', 'news')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  impact TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  timeframe TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries by symbol and timeframe
CREATE INDEX idx_market_insights_symbol_timeframe ON public.market_insights(symbol, timeframe, generated_at DESC);

-- Enable RLS
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

-- Anyone can view market insights (public market data)
CREATE POLICY "Anyone can view market insights"
ON public.market_insights
FOR SELECT
TO authenticated
USING (true);

-- System can manage market insights
CREATE POLICY "System can manage market insights"
ON public.market_insights
FOR ALL
TO authenticated
USING (auth.uid() IS NULL OR has_role(auth.uid(), 'admin'));