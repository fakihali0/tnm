import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candles, indicators = ['EMA20', 'EMA50', 'EMA200', 'RSI14', 'MACD', 'ATR', 'BB', 'PIVOT', 'SR', 'FIB'] } = await req.json();

    if (!candles || !Array.isArray(candles) || candles.length < 50) {
      return new Response(
        JSON.stringify({ error: 'At least 50 candles required for accurate indicators' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any = {};

    // Calculate EMA (Exponential Moving Average)
    if (indicators.includes('EMA20')) results.ema20 = calculateEMA(candles, 20);
    if (indicators.includes('EMA50')) results.ema50 = calculateEMA(candles, 50);
    if (indicators.includes('EMA200')) results.ema200 = calculateEMA(candles, 200);

    // Calculate RSI (Relative Strength Index)
    if (indicators.includes('RSI14')) results.rsi = calculateRSI(candles, 14);

    // Calculate MACD (Moving Average Convergence Divergence)
    if (indicators.includes('MACD')) results.macd = calculateMACD(candles);

    // Calculate ATR (Average True Range)
    if (indicators.includes('ATR')) results.atr = calculateATR(candles, 14);

    // Calculate Bollinger Bands
    if (indicators.includes('BB')) results.bollingerBands = calculateBollingerBands(candles, 20, 2);

    // Calculate Pivot Points
    if (indicators.includes('PIVOT')) results.pivotPoints = calculatePivotPoints(candles);

    // Calculate Support/Resistance
    if (indicators.includes('SR')) results.supportResistance = calculateSupportResistance(candles, 20);

    // Calculate Fibonacci Retracement
    if (indicators.includes('FIB')) results.fibonacci = calculateFibonacci(candles, 50);

    return new Response(
      JSON.stringify({ success: true, indicators: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Technical indicators error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateEMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;

  const closes = candles.map(c => c.close);
  const multiplier = 2 / (period + 1);

  // Start with SMA as initial EMA
  let ema = closes.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // Calculate EMA for remaining values
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return parseFloat(ema.toFixed(5));
}

function calculateRSI(candles: Candle[], period: number = 14): number | null {
  if (candles.length < period + 1) return null;

  const closes = candles.map(c => c.close);
  const changes = [];

  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }

  avgGain /= period;
  avgLoss /= period;

  // Smooth subsequent values
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}

function calculateMACD(candles: Candle[]): { macd: number, signal: number, histogram: number } | null {
  if (candles.length < 26) return null;

  const closes = candles.map(c => c.close);

  // Calculate EMAs
  const ema12 = calculateEMAFromArray(closes, 12);
  const ema26 = calculateEMAFromArray(closes, 26);

  if (!ema12 || !ema26) return null;

  const macdLine = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdValues = [];
  for (let i = 26; i < closes.length; i++) {
    const e12 = calculateEMAFromArray(closes.slice(0, i + 1), 12);
    const e26 = calculateEMAFromArray(closes.slice(0, i + 1), 26);
    if (e12 && e26) macdValues.push(e12 - e26);
  }

  const signalLine = calculateEMAFromArray(macdValues, 9) || 0;
  const histogram = macdLine - signalLine;

  return {
    macd: parseFloat(macdLine.toFixed(5)),
    signal: parseFloat(signalLine.toFixed(5)),
    histogram: parseFloat(histogram.toFixed(5))
  };
}

function calculateEMAFromArray(values: number[], period: number): number | null {
  if (values.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateATR(candles: Candle[], period: number = 14): number | null {
  if (candles.length < period + 1) return null;

  const trueRanges = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate initial ATR as simple average
  let atr = trueRanges.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // Smooth subsequent values
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  return parseFloat(atr.toFixed(5));
}

function calculateBollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): { upper: number, middle: number, lower: number } | null {
  if (candles.length < period) return null;

  const closes = candles.map(c => c.close);
  const recentCloses = closes.slice(-period);

  // Calculate SMA (middle band)
  const sma = recentCloses.reduce((sum, val) => sum + val, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = recentCloses.map(close => Math.pow(close - sma, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const sd = Math.sqrt(variance);

  return {
    upper: parseFloat((sma + (stdDev * sd)).toFixed(5)),
    middle: parseFloat(sma.toFixed(5)),
    lower: parseFloat((sma - (stdDev * sd)).toFixed(5))
  };
}

function calculatePivotPoints(candles: Candle[]): { pivot: number, r1: number, r2: number, r3: number, s1: number, s2: number, s3: number } | null {
  if (candles.length < 1) return null;

  const latest = candles[candles.length - 1];
  const pivot = (latest.high + latest.low + latest.close) / 3;
  
  return {
    pivot: parseFloat(pivot.toFixed(2)),
    r1: parseFloat(((2 * pivot) - latest.low).toFixed(2)),
    r2: parseFloat((pivot + (latest.high - latest.low)).toFixed(2)),
    r3: parseFloat((latest.high + 2 * (pivot - latest.low)).toFixed(2)),
    s1: parseFloat(((2 * pivot) - latest.high).toFixed(2)),
    s2: parseFloat((pivot - (latest.high - latest.low)).toFixed(2)),
    s3: parseFloat((latest.low - 2 * (latest.high - pivot)).toFixed(2))
  };
}

function calculateSupportResistance(candles: Candle[], lookback: number = 20): { resistance: number[], support: number[] } | null {
  if (candles.length < lookback + 4) return null;

  const recentCandles = candles.slice(-lookback);
  
  // Find swing highs (local maxima) and swing lows (local minima)
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const curr = recentCandles[i];
    const prev1 = recentCandles[i - 1];
    const prev2 = recentCandles[i - 2];
    const next1 = recentCandles[i + 1];
    const next2 = recentCandles[i + 2];
    
    // Swing high: higher than 2 candles before and after
    if (curr.high > prev1.high && curr.high > prev2.high && 
        curr.high > next1.high && curr.high > next2.high) {
      swingHighs.push(curr.high);
    }
    
    // Swing low: lower than 2 candles before and after
    if (curr.low < prev1.low && curr.low < prev2.low && 
        curr.low < next1.low && curr.low < next2.low) {
      swingLows.push(curr.low);
    }
  }
  
  // Cluster nearby levels (within 0.1% of each other)
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: number[] = [];
    let currentCluster = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const pctDiff = Math.abs(sorted[i] - currentCluster[0]) / currentCluster[0];
      if (pctDiff < 0.001) { // Within 0.1%
        currentCluster.push(sorted[i]);
      } else {
        clusters.push(currentCluster.reduce((a, b) => a + b) / currentCluster.length);
        currentCluster = [sorted[i]];
      }
    }
    clusters.push(currentCluster.reduce((a, b) => a + b) / currentCluster.length);
    return clusters;
  };
  
  const resistanceLevels = clusterLevels(swingHighs).slice(-3).reverse(); // Top 3
  const supportLevels = clusterLevels(swingLows).slice(-3); // Bottom 3
  
  return {
    resistance: resistanceLevels.map(l => parseFloat(l.toFixed(2))),
    support: supportLevels.map(l => parseFloat(l.toFixed(2)))
  };
}

function calculateFibonacci(candles: Candle[], lookback: number = 50): { high: number, fib_786: number, fib_618: number, fib_50: number, fib_382: number, fib_236: number, low: number } | null {
  if (candles.length < lookback) return null;

  const recentCandles = candles.slice(-lookback);
  const high = Math.max(...recentCandles.map(c => c.high));
  const low = Math.min(...recentCandles.map(c => c.low));
  const range = high - low;
  
  return {
    high: parseFloat(high.toFixed(2)),
    fib_786: parseFloat((high - range * 0.786).toFixed(2)),
    fib_618: parseFloat((high - range * 0.618).toFixed(2)),
    fib_50: parseFloat((high - range * 0.5).toFixed(2)),
    fib_382: parseFloat((high - range * 0.382).toFixed(2)),
    fib_236: parseFloat((high - range * 0.236).toFixed(2)),
    low: parseFloat(low.toFixed(2))
  };
}
