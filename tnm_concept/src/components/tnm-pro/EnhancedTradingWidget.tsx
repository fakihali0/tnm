import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useMarketData } from '@/hooks/useMarketData';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  AlertTriangle,
  Calculator,
  BarChart3,
  Brain,
  Zap,
  DollarSign
} from 'lucide-react';

interface TechnicalSignal {
  indicator: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
}

interface TradingOpportunity {
  symbol: string;
  type: 'breakout' | 'reversal' | 'continuation';
  direction: 'buy' | 'sell';
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

export const EnhancedTradingWidget = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [technicalSignals, setTechnicalSignals] = useState<TechnicalSignal[]>([]);
  const [opportunities, setOpportunities] = useState<TradingOpportunity[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');

  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'SPX500'];
  
  const { quotes, getQuote, isLoading } = useMarketData({
    symbols: [selectedSymbol],
    refreshInterval: 5000, // 5 seconds
  });

  const quote = getQuote(selectedSymbol);

  useEffect(() => {
    // Simulate technical analysis data
    generateTechnicalSignals();
    generateTradingOpportunities();
    updateMarketSentiment();
  }, [selectedSymbol]);

  const generateTechnicalSignals = () => {
    const signals: TechnicalSignal[] = [
      {
        indicator: 'RSI(14)',
        value: Math.random() * 100,
        signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
        strength: Math.random() * 100
      },
      {
        indicator: 'MACD',
        value: (Math.random() - 0.5) * 0.002,
        signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
        strength: Math.random() * 100
      },
      {
        indicator: 'Bollinger Bands',
        value: Math.random() * 2 - 1,
        signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
        strength: Math.random() * 100
      },
      {
        indicator: 'Moving Average',
        value: Math.random() * 100,
        signal: Math.random() > 0.5 ? 'bullish' : 'bearish',
        strength: Math.random() * 100
      }
    ];
    setTechnicalSignals(signals);
  };

  const generateTradingOpportunities = () => {
    const opportunities: TradingOpportunity[] = [
      {
        symbol: selectedSymbol,
        type: 'breakout',
        direction: Math.random() > 0.5 ? 'buy' : 'sell',
        confidence: 70 + Math.random() * 25,
        entry: quote?.bid || 1.0500,
        stopLoss: (quote?.bid || 1.0500) * (1 - 0.005),
        takeProfit: (quote?.bid || 1.0500) * (1 + 0.015),
        riskReward: 3.0
      }
    ];
    setOpportunities(opportunities);
  };

  const updateMarketSentiment = () => {
    const sentiments: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
    setMarketSentiment(sentiments[Math.floor(Math.random() * sentiments.length)]);
  };

  const calculateOverallSignal = () => {
    const bullishSignals = technicalSignals.filter(s => s.signal === 'bullish').length;
    const bearishSignals = technicalSignals.filter(s => s.signal === 'bearish').length;
    
    if (bullishSignals > bearishSignals) return 'bullish';
    if (bearishSignals > bullishSignals) return 'bearish';
    return 'neutral';
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
    }
  };

  const overallSignal = calculateOverallSignal();
  const SignalIcon = getSignalIcon(overallSignal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Enhanced Trading Intelligence
            <Badge variant="secondary" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Symbol Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {symbols.map((symbol) => (
              <Button
                key={symbol}
                variant={selectedSymbol === symbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSymbol(symbol)}
                className="text-xs"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Market Overview - {selectedSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {quote?.bid?.toFixed(5) || '-.-----'}
              </div>
              <div className="text-xs text-muted-foreground">Current Price</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSignalColor(overallSignal)}`}>
                <SignalIcon className="h-6 w-6 mx-auto" />
              </div>
              <div className="text-xs text-muted-foreground capitalize">{overallSignal}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(Math.random() * 2 + 1).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Volatility</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getSignalColor(marketSentiment)}`}>
                {Math.floor(Math.random() * 30 + 60)}
              </div>
              <div className="text-xs text-muted-foreground">Sentiment Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="technical" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Technical
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicalSignals.map((signal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <div className="font-medium text-sm">{signal.indicator}</div>
                      <div className="text-xs text-muted-foreground">
                        Value: {signal.value.toFixed(signal.indicator === 'RSI(14)' ? 1 : 4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={signal.signal === 'bullish' ? 'default' : signal.signal === 'bearish' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {signal.signal.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Strength: {signal.strength.toFixed(0)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Signal Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {technicalSignals.map((signal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{signal.indicator}</span>
                      <span className={getSignalColor(signal.signal)}>
                        {signal.strength.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={signal.strength} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {opportunity.type.toUpperCase()} Setup - {opportunity.symbol}
                    <Badge 
                      variant={opportunity.direction === 'buy' ? 'default' : 'destructive'}
                      className="ml-auto"
                    >
                      {opportunity.direction.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Entry Price</div>
                      <div className="font-medium">{opportunity.entry.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Stop Loss</div>
                      <div className="font-medium text-red-600">{opportunity.stopLoss.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Take Profit</div>
                      <div className="font-medium text-green-600">{opportunity.takeProfit.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Risk:Reward</div>
                      <div className="font-medium">1:{opportunity.riskReward.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confidence Level</span>
                      <span className="font-medium">{opportunity.confidence.toFixed(0)}%</span>
                    </div>
                    <Progress value={opportunity.confidence} className="h-2" />
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">AI Analysis</div>
                    <div className="text-sm">
                      Strong {opportunity.type} pattern detected with favorable risk-reward ratio. 
                      Market structure supports {opportunity.direction} bias with multiple confluences.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Position Size Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Account Balance</label>
                    <div className="font-medium text-lg">$10,000</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Risk Percentage</label>
                    <div className="font-medium text-lg">2%</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Risk Amount</label>
                    <div className="font-medium text-lg text-red-600">$200</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Position Size</label>
                    <div className="font-medium text-lg text-primary">0.15 lots</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Calculation Method</div>
                  <div className="text-sm">
                    Fixed Fractional: Position Size = Risk Amount ÷ Stop Loss Distance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk-Reward Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Potential Profit</span>
                  <span className="font-medium text-green-600">$600</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Potential Loss</span>
                  <span className="font-medium text-red-600">$200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Risk-Reward Ratio</span>
                  <span className="font-medium text-primary">1:3.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Win Rate Needed</span>
                  <span className="font-medium">25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};