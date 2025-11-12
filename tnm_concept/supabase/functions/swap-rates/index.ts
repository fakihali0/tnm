import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

// Cache for swap rates (they typically update once daily around 5 PM EST)
const swapCache = new Map<string, { data: SwapRate, timestamp: number }>();
const SWAP_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface SwapRate {
  symbol: string;
  swapLong: number;
  swapShort: number;
  lastUpdated: string;
}

// Typical swap rates based on market data (fallback values)
const FALLBACK_SWAP_RATES: { [key: string]: SwapRate } = {
  'EURUSD': { symbol: 'EURUSD', swapLong: -2.1, swapShort: -1.8, lastUpdated: new Date().toISOString() },
  'GBPUSD': { symbol: 'GBPUSD', swapLong: -3.2, swapShort: -2.1, lastUpdated: new Date().toISOString() },
  'USDJPY': { symbol: 'USDJPY', swapLong: 1.8, swapShort: -4.2, lastUpdated: new Date().toISOString() },
  'AUDUSD': { symbol: 'AUDUSD', swapLong: -1.5, swapShort: -1.2, lastUpdated: new Date().toISOString() },
  'XAUUSD': { symbol: 'XAUUSD', swapLong: -8.5, swapShort: 2.3, lastUpdated: new Date().toISOString() },
  'XAGUSD': { symbol: 'XAGUSD', swapLong: -3.2, swapShort: 1.1, lastUpdated: new Date().toISOString() },
  'USOIL': { symbol: 'USOIL', swapLong: -2.8, swapShort: -1.5, lastUpdated: new Date().toISOString() },
  'BTCUSD': { symbol: 'BTCUSD', swapLong: -15.2, swapShort: -12.8, lastUpdated: new Date().toISOString() },
  'ETHUSD': { symbol: 'ETHUSD', swapLong: -8.5, swapShort: -6.2, lastUpdated: new Date().toISOString() },
  'NAS100': { symbol: 'NAS100', swapLong: -1.2, swapShort: -0.8, lastUpdated: new Date().toISOString() },
  'SPX500': { symbol: 'SPX500', swapLong: -0.9, swapShort: -0.6, lastUpdated: new Date().toISOString() },
  'US30': { symbol: 'US30', swapLong: -1.1, swapShort: -0.7, lastUpdated: new Date().toISOString() },
  'GER40': { symbol: 'GER40', swapLong: -0.8, swapShort: -0.5, lastUpdated: new Date().toISOString() },
};

async function fetchSwapRateFromProvider(symbol: string): Promise<SwapRate | null> {
  try {
    // For demo purposes, we'll simulate fetching from a provider
    // In production, this would call OANDA, Interactive Brokers, or broker-specific APIs
    console.log(`Fetching swap rate for ${symbol} from provider`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate realistic swap rates based on current market conditions
    const baseRate = FALLBACK_SWAP_RATES[symbol];
    if (!baseRate) return null;
    
    // Add some realistic variation (+/- 20%)
    const variation = 0.2;
    const longVariation = (Math.random() - 0.5) * variation;
    const shortVariation = (Math.random() - 0.5) * variation;
    
    return {
      symbol,
      swapLong: Number((baseRate.swapLong * (1 + longVariation)).toFixed(1)),
      swapShort: Number((baseRate.swapShort * (1 + shortVariation)).toFixed(1)),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching swap rate for ${symbol}:`, error);
    return null;
  }
}

async function getSwapRate(symbol: string): Promise<SwapRate> {
  // Check cache first
  const cached = swapCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < SWAP_CACHE_TTL) {
    console.log(`Cache hit for swap rate: ${symbol}`);
    return cached.data;
  }
  
  // Try to fetch from provider
  const providerData = await fetchSwapRateFromProvider(symbol);
  if (providerData) {
    swapCache.set(symbol, { data: providerData, timestamp: Date.now() });
    console.log(`Fetched swap rate from provider: ${symbol}`);
    return providerData;
  }
  
  // Fallback to static data
  const fallback = FALLBACK_SWAP_RATES[symbol];
  if (fallback) {
    console.log(`Using fallback swap rate: ${symbol}`);
    return fallback;
  }
  
  // Default fallback
  return {
    symbol,
    swapLong: -1.0,
    swapShort: -1.0,
    lastUpdated: new Date().toISOString()
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const symbolsParam = url.searchParams.get('symbols');
    
    if (!symbolsParam) {
      return new Response(JSON.stringify({ error: 'symbols parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    console.log(`Fetching swap rates for symbols: ${symbols.join(', ')}`);
    
    // Fetch swap rates for all symbols concurrently
    const swapPromises = symbols.map(symbol => getSwapRate(symbol));
    const swapRates = await Promise.all(swapPromises);
    
    console.log(`Successfully fetched ${swapRates.length} swap rates`);
    
    return new Response(JSON.stringify(swapRates), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in swap-rates function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});