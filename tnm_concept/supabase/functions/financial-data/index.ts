import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { XMLParser } from "npm:fast-xml-parser@4.3.4";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

// In-memory cache for quotes (TTL: 20 seconds)
const cache = new Map();
const CACHE_TTL = 20000; // 20 seconds
const COMMODITY_CACHE_TTL = 5000; // 5 seconds for commodities (oil)
const METALS_CACHE_TTL = 15000; // 15 seconds for precious metals (gold, silver)

// Symbol mappings - Finnhub format first, Yahoo Finance fallback
const FINNHUB_MAPPINGS: { [key: string]: string } = {
  'EURUSD': 'OANDA:EUR_USD',
  'GBPUSD': 'OANDA:GBP_USD', 
  'USDJPY': 'OANDA:USD_JPY',
  'AUDUSD': 'OANDA:AUD_USD',
  'USDCHF': 'OANDA:USD_CHF',
  'USDCAD': 'OANDA:USD_CAD',
  'NZDUSD': 'OANDA:NZD_USD',
  'EURGBP': 'OANDA:EUR_GBP',
  'EURJPY': 'OANDA:EUR_JPY',
  'EURCHF': 'OANDA:EUR_CHF',
  'EURCAD': 'OANDA:EUR_CAD',
  'EURAUD': 'OANDA:EUR_AUD',
  'EURNZD': 'OANDA:EUR_NZD',
  'GBPJPY': 'OANDA:GBP_JPY',
  'GBPCHF': 'OANDA:GBP_CHF',
  'GBPCAD': 'OANDA:GBP_CAD',
  'GBPAUD': 'OANDA:GBP_AUD',
  'GBPNZD': 'OANDA:GBP_NZD',
  'AUDJPY': 'OANDA:AUD_JPY',
  'AUDCAD': 'OANDA:AUD_CAD',
  'AUDCHF': 'OANDA:AUD_CHF',
  'AUDNZD': 'OANDA:AUD_NZD',
  'NZDJPY': 'OANDA:NZD_JPY',
  'CADJPY': 'OANDA:CAD_JPY',
  'CHFJPY': 'OANDA:CHF_JPY',
  'US30': 'PEPPERSTONE:US30',
  'NAS100': 'PEPPERSTONE:NAS100',
  'SPX500': 'PEPPERSTONE:SPX500',
  'GER40': 'PEPPERSTONE:GER40',
  'XAUUSD': 'OANDA:XAU_USD',
  'XAGUSD': 'OANDA:XAG_USD',
  'USOIL': 'OANDA:BCO_USD',
  'BTCUSD': 'BINANCE:BTCUSDT',
  'ETHUSD': 'BINANCE:ETHUSDT',
  'ADAUSD': 'BINANCE:ADAUSDT',
  'DOTUSD': 'BINANCE:DOTUSDT',
  'SOLUSD': 'BINANCE:SOLUSDT',
  'LINKUSD': 'BINANCE:LINKUSDT',
  'AVAXUSD': 'BINANCE:AVAXUSDT',
  'MATICUSD': 'BINANCE:MATICUSDT',
  'LTCUSD': 'BINANCE:LTCUSDT',
  'XRPUSD': 'BINANCE:XRPUSDT'
};

const YAHOO_MAPPINGS: { [key: string]: string } = {
  'EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'USDJPY=X',
  'AUDUSD': 'AUDUSD=X',
  'USDCHF': 'USDCHF=X',
  'USDCAD': 'USDCAD=X',
  'NZDUSD': 'NZDUSD=X',
  'EURGBP': 'EURGBP=X',
  'EURJPY': 'EURJPY=X',
  'EURCHF': 'EURCHF=X',
  'EURCAD': 'EURCAD=X',
  'EURAUD': 'EURAUD=X',
  'EURNZD': 'EURNZD=X',
  'GBPJPY': 'GBPJPY=X',
  'GBPCHF': 'GBPCHF=X',
  'GBPCAD': 'GBPCAD=X',
  'GBPAUD': 'GBPAUD=X',
  'GBPNZD': 'GBPNZD=X',
  'AUDJPY': 'AUDJPY=X',
  'AUDCAD': 'AUDCAD=X',
  'AUDCHF': 'AUDCHF=X',
  'AUDNZD': 'AUDNZD=X',
  'NZDJPY': 'NZDJPY=X',
  'CADJPY': 'CADJPY=X',
  'CHFJPY': 'CHFJPY=X',
  'US30': 'YM=F',
  'NAS100': 'NQ=F',
  'SPX500': 'ES=F',
  'GER40': '^GDAXI',
  'XAUUSD': 'GC=F',
  'XAGUSD': 'SI=F',
  'USOIL': 'CL=F',
  'BTCUSD': 'BTC-USD',
  'ETHUSD': 'ETH-USD',
  'ADAUSD': 'ADA-USD',
  'DOTUSD': 'DOT-USD',
  'SOLUSD': 'SOL-USD',
  'LINKUSD': 'LINK-USD',
  'AVAXUSD': 'AVAX-USD',
  'MATICUSD': 'MATIC-USD',
  'LTCUSD': 'LTC-USD',
  'XRPUSD': 'XRP-USD'
};

interface InstrumentQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
  isMarketOpen: boolean;
  dataSource?: string;
}

async function fetchQuote(symbol: string): Promise<InstrumentQuote | null> {
  try {
    console.log(`[FETCH] Starting quote fetch for ${symbol}`);
    
    // Check cache first with dynamic TTL based on asset type
    const isMetal = ['XAUUSD', 'XAGUSD'].includes(symbol);
    const isCommodity = isMetal || symbol === 'USOIL';
    const cacheTTL = isMetal ? METALS_CACHE_TTL : (isCommodity ? COMMODITY_CACHE_TTL : CACHE_TTL);
    
    const cacheKey = symbol;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      console.log(`[CACHE] ✓ Cache hit for ${symbol} (TTL: ${cacheTTL}ms)`);
      return cached.data;
    }
    console.log(`[CACHE] Cache miss for ${symbol}, fetching fresh data`);

    // For precious metals, try Yahoo first, then Finnhub, then spot metals API
    if (['XAUUSD', 'XAGUSD'].includes(symbol)) {
      console.log(`[METALS] Fetching precious metal ${symbol}`);
      
      console.log(`[METALS] Trying Yahoo Finance...`);
      const yahooQuote = await fetchFromYahoo(symbol);
      if (yahooQuote) {
        console.log(`[METALS] ✓ Yahoo Finance succeeded for ${symbol}`);
        cache.set(cacheKey, { data: yahooQuote, timestamp: Date.now() });
        return yahooQuote;
      }
      console.log(`[METALS] ✗ Yahoo Finance failed for ${symbol}`);
      
      console.log(`[METALS] Trying Finnhub...`);
      const finnhubQuote = await fetchFromFinnhub(symbol);
      if (finnhubQuote) {
        console.log(`[METALS] ✓ Finnhub succeeded for ${symbol}`);
        cache.set(cacheKey, { data: finnhubQuote, timestamp: Date.now() });
        return finnhubQuote;
      }
      console.log(`[METALS] ✗ Finnhub failed for ${symbol}`);
      
      console.log(`[METALS] Trying Spot Metals API...`);
      const spotQuote = await fetchFromSpotMetals(symbol);
      if (spotQuote) {
        console.log(`[METALS] ✓ Spot Metals API succeeded for ${symbol}`);
        cache.set(cacheKey, { data: spotQuote, timestamp: Date.now() });
        return spotQuote;
      }
      console.log(`[METALS] ✗ Spot Metals API failed for ${symbol}`);
      console.log(`[METALS] ⚠️ All data sources failed for ${symbol}`);
      
      return null;
    }

    // For other symbols, try Yahoo first, then Finnhub
    console.log(`[FETCH] Trying Yahoo Finance...`);
    const yahooQuote = await fetchFromYahoo(symbol);
    if (yahooQuote) {
      console.log(`[FETCH] ✓ Yahoo Finance succeeded for ${symbol}`);
      cache.set(cacheKey, { data: yahooQuote, timestamp: Date.now() });
      return yahooQuote;
    }
    console.log(`[FETCH] ✗ Yahoo Finance failed for ${symbol}`);
    
    console.log(`[FETCH] Trying Finnhub...`);
    const finnhubQuote = await fetchFromFinnhub(symbol);
    if (finnhubQuote) {
      console.log(`[FETCH] ✓ Finnhub succeeded for ${symbol}`);
      cache.set(cacheKey, { data: finnhubQuote, timestamp: Date.now() });
      return finnhubQuote;
    }
    console.log(`[FETCH] ✗ Finnhub failed for ${symbol}`);
    console.log(`[FETCH] ⚠️ All data sources failed for ${symbol}`);
    
    return null;
  } catch (error) {
    console.error(`[ERROR] ❌ Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

async function fetchFromFinnhub(symbol: string): Promise<InstrumentQuote | null> {
  try {
    const finnhubSymbol = FINNHUB_MAPPINGS[symbol];
    if (!finnhubSymbol) {
      console.log(`[FINNHUB] ✗ No mapping found for ${symbol}`);
      return null;
    }
    
    if (!FINNHUB_API_KEY) {
      console.log(`[FINNHUB] ✗ API key not configured`);
      return null;
    }

    console.log(`[FINNHUB] Fetching ${symbol} (mapped to ${finnhubSymbol})`);
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[FINNHUB] ✗ API error for ${symbol}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`[FINNHUB] Response for ${symbol}:`, JSON.stringify(data));
    
    if (!data.c || data.c === 0) {
      console.log(`[FINNHUB] ✗ Invalid price data for ${symbol}: c=${data.c}`);
      return null;
    }

    console.log(`[FINNHUB] ✓ Success for ${symbol}: $${data.c}`);
    return createQuoteFromPrice(symbol, data.c, 'Finnhub');
  } catch (error) {
    console.error(`[FINNHUB] ✗ Exception for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchFromYahoo(symbol: string): Promise<InstrumentQuote | null> {
  try {
    const yahooSymbol = YAHOO_MAPPINGS[symbol];
    if (!yahooSymbol) {
      console.log(`[YAHOO] ✗ No mapping found for ${symbol}`);
      return null;
    }

    console.log(`[YAHOO] Fetching ${symbol} (mapped to ${yahooSymbol})`);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[YAHOO] ✗ API error for ${symbol}: ${response.status} - ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    
    console.log(`[YAHOO] Response for ${symbol}: price=${price}`);
    
    if (!price || price === 0) {
      console.log(`[YAHOO] ✗ Invalid price data for ${symbol}: ${JSON.stringify(data?.chart?.result?.[0]?.meta)}`);
      return null;
    }
    
    // Sanity check for XAUUSD (gold should be between $1000-$5000)
    if (symbol === 'XAUUSD') {
      if (price < 1000 || price > 5000) {
        console.warn(`[YAHOO] ✗ Out-of-range price for XAUUSD: ${price} (expected 1000-5000)`);
        return null;
      }
    }

    console.log(`[YAHOO] ✓ Success for ${symbol}: $${price}`);
    return createQuoteFromPrice(symbol, price, 'Yahoo Finance');
  } catch (error) {
    console.error(`[YAHOO] ✗ Exception for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchFromSpotMetals(symbol: string): Promise<InstrumentQuote | null> {
  try {
    // Map to currency symbols for exchangerate.host
    const metalMappings: { [key: string]: string } = {
      'XAUUSD': 'XAU',
      'XAGUSD': 'XAG'
    };

    const metal = metalMappings[symbol];
    if (!metal) {
      console.log(`[SPOT_METALS] ✗ No mapping found for ${symbol}`);
      return null;
    }

    console.log(`[SPOT_METALS] Fetching ${symbol} (metal: ${metal})`);
    const url = `https://api.exchangerate.host/latest?base=${metal}&symbols=USD`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[SPOT_METALS] ✗ API error for ${symbol}: ${response.status} - ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const rate = data?.rates?.USD;

    console.log(`[SPOT_METALS] Response for ${symbol}:`, JSON.stringify({ rate, success: data?.success }));

    if (!rate || rate === 0) {
      console.warn(`[SPOT_METALS] ✗ Invalid rate for ${symbol}: ${rate}`);
      return null;
    }

    // exchangerate.host returns USD per 1 unit of base when using base=XAU&symbols=USD
    const pricePerOunce = rate;

    // Sanity checks to filter out bad data
    if (symbol === 'XAUUSD') {
      if (pricePerOunce < 1000 || pricePerOunce > 5000) {
        console.warn(`[SPOT_METALS] ✗ Out-of-range price for XAUUSD: ${pricePerOunce} (expected 1000-5000)`);
        return null;
      }
    } else if (symbol === 'XAGUSD') {
      if (pricePerOunce < 10 || pricePerOunce > 100) {
        console.warn(`[SPOT_METALS] ✗ Out-of-range price for XAGUSD: ${pricePerOunce} (expected 10-100)`);
        return null;
      }
    }

    console.log(`[SPOT_METALS] ✓ Success for ${symbol}: $${pricePerOunce.toFixed(2)}`);
    return createQuoteFromPrice(symbol, pricePerOunce, 'Spot Metals API');
  } catch (error) {
    console.error(`[SPOT_METALS] ✗ Exception for ${symbol}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

function createQuoteFromPrice(symbol: string, currentPrice: number, dataSource = 'Generated'): InstrumentQuote {
  const spreadPips = getTypicalSpread(symbol);
  const pipValue = getPipValue(symbol);
  const spreadPrice = spreadPips * pipValue;
  
  const bid = currentPrice - (spreadPrice / 2);
  const ask = currentPrice + (spreadPrice / 2);
  
  return {
    symbol,
    bid,
    ask,
    spread: spreadPips,
    timestamp: Date.now(),
    isMarketOpen: isMarketOpenNow(symbol),
    dataSource: dataSource
  };
}

function getTypicalSpread(symbol: string): number {
  // Typical spreads in pips/points
  const spreads: { [key: string]: number } = {
    // Major Forex pairs
    'EURUSD': 0.8, 'GBPUSD': 1.2, 'USDJPY': 0.9, 'AUDUSD': 1.1,
    'USDCHF': 1.0, 'USDCAD': 1.3, 'NZDUSD': 1.4,
    // Cross pairs
    'EURGBP': 1.1, 'EURJPY': 1.2, 'EURCHF': 1.5, 'EURCAD': 1.8, 'EURAUD': 1.9, 'EURNZD': 2.2,
    'GBPJPY': 1.8, 'GBPCHF': 2.1, 'GBPCAD': 2.3, 'GBPAUD': 2.5, 'GBPNZD': 2.8,
    'AUDJPY': 1.6, 'AUDCAD': 1.9, 'AUDCHF': 1.8, 'AUDNZD': 2.1,
    'NZDJPY': 1.9, 'CADJPY': 1.7, 'CHFJPY': 1.5,
    // Indices
    'US30': 2.5, 'NAS100': 1.8, 'SPX500': 0.8, 'GER40': 1.2,
    // Commodities
    'XAUUSD': 35, 'XAGUSD': 2.8, 'USOIL': 4.5,
    // Crypto
    'BTCUSD': 28, 'ETHUSD': 1.8, 'ADAUSD': 0.8, 'DOTUSD': 1.2, 'SOLUSD': 1.5,
    'LINKUSD': 1.1, 'AVAXUSD': 1.3, 'MATICUSD': 0.9, 'LTCUSD': 1.4, 'XRPUSD': 0.7
  };
  return spreads[symbol] || 1.0;
}

function getPipValue(symbol: string): number {
  // Pip values for different instrument types
  if (symbol.includes('JPY')) return 0.01;
  if (['XAUUSD', 'XAGUSD', 'USOIL', 'BTCUSD', 'ETHUSD'].includes(symbol)) return 0.01;
  if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(symbol)) return 1;
  return 0.0001; // Standard forex
}

function isMarketOpenNow(symbol: string): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay();
  
  // Weekend check (Saturday = 6, Sunday = 0)
  if (utcDay === 6 || utcDay === 0) {
    // Crypto markets are always open
    return ['BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'SOLUSD', 'LINKUSD', 'AVAXUSD', 'MATICUSD', 'LTCUSD', 'XRPUSD'].includes(symbol);
  }
  
  // Forex markets: Sunday 22:00 UTC - Friday 22:00 UTC (all forex pairs)
  const forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
    'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
    'AUDJPY', 'AUDCAD', 'AUDCHF', 'AUDNZD', 'NZDJPY', 'CADJPY', 'CHFJPY',
    'XAUUSD', 'XAGUSD', 'USOIL'];
  
  if (forexSymbols.includes(symbol)) {
    if (utcDay === 0 && utcHour >= 22) return true; // Sunday evening
    if (utcDay >= 1 && utcDay <= 4) return true; // Monday-Thursday
    if (utcDay === 5 && utcHour < 22) return true; // Friday before 22:00
    return false;
  }
  
  // Stock indices: Generally 01:05 - 22:55 UTC on weekdays
  if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(symbol)) {
    if (utcDay >= 1 && utcDay <= 5) {
      return utcHour >= 1 && utcHour < 23;
    }
    return false;
  }
  
  // Crypto: Always open (24/7)
  if (['BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'SOLUSD', 'LINKUSD', 'AVAXUSD', 'MATICUSD', 'LTCUSD', 'XRPUSD'].includes(symbol)) {
    return true;
  }
  
  return false;
}

function getTimeframeSeconds(timeframe: string): number {
  const map: { [key: string]: number } = {
    'M5': 300,      // 5 minutes
    'M15': 900,     // 15 minutes
    'H1': 3600,     // 1 hour
    'H4': 14400,    // 4 hours
    'D1': 86400     // 1 day
  };
  return map[timeframe] || 3600;
}

async function fetchCandlesFromYahoo(symbol: string, timeframe: string, limit: number): Promise<any[]> {
  try {
    const yahooSymbol = YAHOO_MAPPINGS[symbol];
    if (!yahooSymbol) return [];

    // Map timeframes to Yahoo intervals
    const intervalMap: { [key: string]: string } = {
      'M5': '5m', 'M15': '15m', 'H1': '1h', 'H4': '1h', 'D1': '1d'
    };
    const interval = intervalMap[timeframe] || '1h';

    // Calculate range based on limit
    const rangeMap: { [key: string]: string } = {
      '5m': '1d', '15m': '5d', '1h': '1mo', '1d': '1y'
    };
    const range = rangeMap[interval] || '1mo';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Yahoo candles API error for ${symbol}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      console.warn(`Yahoo returned no candle data for ${symbol}`);
      return [];
    }

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    // Convert to standard OHLCV format
    const candles = timestamps.slice(-limit).map((t: number, i: number) => ({
      time: t,
      open: quote.open[i] || 0,
      high: quote.high[i] || 0,
      low: quote.low[i] || 0,
      close: quote.close[i] || 0,
      volume: quote.volume[i] || 0
    })).filter((c: any) => c.close > 0); // Remove invalid candles

    console.log(`Yahoo Finance candles success for ${symbol}: ${candles.length} candles`);
    return candles;
  } catch (error) {
    console.warn(`Yahoo candles error for ${symbol}:`, error);
    return [];
  }
}

async function fetchHistoricalData(symbol: string, days: number = 30) {
  try {
    const finnhubSymbol = FINNHUB_MAPPINGS[symbol];
    if (!finnhubSymbol || !FINNHUB_API_KEY) return null;

    const toTimestamp = Math.floor(Date.now() / 1000);
    const fromTimestamp = toTimestamp - (days * 24 * 60 * 60);

    const response = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=D&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.s !== 'ok' || !data.c) return null;

    return {
      symbol,
      prices: data.c,
      timestamps: data.t,
      volumes: data.v
    };
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

async function fetchEconomicCalendar(from: string, to: string, importance?: string | null, country?: string | null): Promise<any[]> {
  if (!FINNHUB_API_KEY) {
    console.log('Finnhub API key not configured');
    return [];
  }

  try {
    let url = `https://finnhub.io/api/v1/calendar/economic?from=${from.split('T')[0]}&to=${to.split('T')[0]}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.economicCalendar) return [];

    let events = data.economicCalendar.map((event: any) => ({
      time: event.time,
      title: event.event,
      country: event.country,
      importance: event.impact === 'high' ? 'high' : event.impact === 'medium' ? 'medium' : 'low',
      actual: event.actual,
      forecast: event.estimate,
      previous: event.prev
    }));

    // Filter by importance
    if (importance) {
      events = events.filter((e: any) => e.importance === importance);
    }

    // Filter by country
    if (country) {
      events = events.filter((e: any) => e.country === country);
    }

    return events;
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    return [];
  }
}

// Map common query terms to multiple search terms for better matching
function getSearchTerms(query?: string | null): string[] {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  const mappings: Record<string, string[]> = {
    'gold': ['gold', 'xau', 'xauusd', 'bullion', 'comex', 'lbma', 'gold price', 'GC=F', 'spot gold', 'precious metal'],
    'silver': ['silver', 'xag', 'xagusd', 'silver price', 'SI=F'],
    'oil': ['oil', 'crude', 'wti', 'brent', 'CL=F', 'BRN', 'petroleum'],
    'bitcoin': ['bitcoin', 'btc', 'btcusd', 'crypto', 'cryptocurrency'],
    'ethereum': ['ethereum', 'eth', 'ethusd', 'crypto'],
    'euro': ['euro', 'eur', 'eurusd', 'european'],
    'pound': ['pound', 'gbp', 'gbpusd', 'sterling', 'british'],
    'yen': ['yen', 'jpy', 'usdjpy', 'japanese'],
  };
  
  // Check if query matches any known mappings
  for (const [key, terms] of Object.entries(mappings)) {
    if (lowerQuery.includes(key)) {
      console.log(`Query "${query}" mapped to search terms:`, terms);
      return terms;
    }
  }
  
  // Return original query if no mapping found
  return [lowerQuery];
}

// Normalize news item structure
function normalizeNewsItem(item: any, source: string): any {
  return {
    headline: item.headline || item.title || '',
    source: item.source || source,
    published_at: item.published_at || item.pubDate || new Date().toISOString(),
    summary: item.summary || item.description || '',
    url: item.url || item.link || ''
  };
}

// Deduplicate news items by URL and headline
function dedupeNews(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.url}|${item.headline}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fetch news from Yahoo Finance RSS
async function fetchFromYahooRSS(symbol: string, limit: number = 10): Promise<any[]> {
  try {
    // Map symbols to Yahoo RSS feeds
    const rssMap: Record<string, string> = {
      'XAUUSD': 'GC=F',
      'XAGUSD': 'SI=F',
      'USOIL': 'CL=F',
      'GC=F': 'GC=F',
      'SI=F': 'SI=F',
      'CL=F': 'CL=F'
    };
    
    const rssSymbol = rssMap[symbol] || symbol;
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${rssSymbol}&region=US&lang=en-US`;
    
    console.log(`[YAHOO_RSS] Fetching: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[YAHOO_RSS] HTTP ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xmlText);
    
    const items = parsed?.rss?.channel?.item || [];
    const newsArray = Array.isArray(items) ? items : [items];
    
    const news = newsArray.slice(0, limit).map((item: any) => ({
      headline: item.title || '',
      source: 'Yahoo Finance',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      summary: item.description || '',
      url: item.link || ''
    }));
    
    console.log(`[YAHOO_RSS] Returned ${news.length} items`);
    return news;
  } catch (error) {
    console.error('[YAHOO_RSS] Error:', error);
    return [];
  }
}

// Fetch news from Google News RSS
async function fetchFromGoogleNewsRSS(queryTerms: string[], limit: number = 10): Promise<any[]> {
  try {
    const searchQuery = queryTerms.join(' OR ');
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}+when:2d&hl=en-US&gl=US&ceid=US:en`;
    
    console.log(`[GOOGLE_RSS] Fetching: ${url.substring(0, 150)}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[GOOGLE_RSS] HTTP ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xmlText);
    
    const items = parsed?.rss?.channel?.item || [];
    const newsArray = Array.isArray(items) ? items : [items];
    
    const news = newsArray.slice(0, limit).map((item: any) => ({
      headline: item.title || '',
      source: item.source?.['#text'] || 'Google News',
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      summary: item.description || '',
      url: item.link || ''
    }));
    
    console.log(`[GOOGLE_RSS] Returned ${news.length} items`);
    return news;
  } catch (error) {
    console.error('[GOOGLE_RSS] Error:', error);
    return [];
  }
}

async function fetchNews(query?: string | null, symbols?: string[], since?: string | null, limit: number = 20): Promise<any[]> {
  console.log(`[NEWS] Starting multi-source fetch - query: "${query}", symbols: ${symbols?.join(',') || 'none'}, limit: ${limit}`);
  
  const searchTerms = query ? getSearchTerms(query) : [];
  const allNews: any[] = [];
  
  // Fetch from multiple sources concurrently
  const providers = await Promise.allSettled([
    // Finnhub general news
    (async () => {
      if (!FINNHUB_API_KEY) {
        console.log('[FINNHUB] API key not configured');
        return [];
      }
      try {
        const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
        console.log(`[FINNHUB] Fetching from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
          console.log(`[FINNHUB] HTTP ${response.status}`);
          return [];
        }
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        
        const news = data.map((item: any) => normalizeNewsItem({
          headline: item.headline,
          source: item.source,
          published_at: new Date(item.datetime * 1000).toISOString(),
          summary: item.summary,
          url: item.url
        }, item.source));
        
        console.log(`[FINNHUB] Retrieved ${news.length} items`);
        return news;
      } catch (error) {
        console.error('[FINNHUB] Error:', error);
        return [];
      }
    })(),
    
    // Yahoo Finance RSS (for commodities)
    (async () => {
      if (symbols && symbols.length > 0) {
        const yahooNews = await Promise.all(
          symbols.map(sym => fetchFromYahooRSS(sym, Math.ceil(limit / symbols.length)))
        );
        const flattened = yahooNews.flat();
        console.log(`[YAHOO_RSS] Retrieved ${flattened.length} total items from ${symbols.length} symbols`);
        return flattened;
      }
      return [];
    })(),
    
    // Google News RSS (broad fallback)
    (async () => {
      if (searchTerms.length > 0) {
        return await fetchFromGoogleNewsRSS(searchTerms.slice(0, 5), limit);
      }
      return [];
    })(),
    
    // Finnhub forex fallback
    (async () => {
      if (!FINNHUB_API_KEY || !query) return [];
      try {
        const url = `https://finnhub.io/api/v1/news?category=forex&token=${FINNHUB_API_KEY}`;
        console.log(`[FINNHUB_FOREX] Fetching fallback`);
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        
        const news = data.map((item: any) => normalizeNewsItem({
          headline: item.headline,
          source: item.source,
          published_at: new Date(item.datetime * 1000).toISOString(),
          summary: item.summary,
          url: item.url
        }, item.source));
        
        console.log(`[FINNHUB_FOREX] Retrieved ${news.length} items`);
        return news;
      } catch (error) {
        console.error('[FINNHUB_FOREX] Error:', error);
        return [];
      }
    })()
  ]);
  
  // Collect results from all providers
  providers.forEach((result, index) => {
    const providerNames = ['Finnhub', 'Yahoo RSS', 'Google RSS', 'Finnhub Forex'];
    if (result.status === 'fulfilled') {
      const count = result.value.length;
      console.log(`[PROVIDER] ${providerNames[index]}: ${count} items`);
      allNews.push(...result.value);
    } else {
      console.error(`[PROVIDER] ${providerNames[index]} failed:`, result.reason);
    }
  });
  
  console.log(`[AGGREGATION] Total items before filtering: ${allNews.length}`);
  
  // Filter by query terms
  let filteredNews = allNews;
  if (searchTerms.length > 0) {
    const originalCount = filteredNews.length;
    filteredNews = filteredNews.filter((n: any) => {
      const headline = n.headline.toLowerCase();
      const summary = (n.summary || '').toLowerCase();
      return searchTerms.some(term => headline.includes(term.toLowerCase()) || summary.includes(term.toLowerCase()));
    });
    console.log(`[FILTER] By query: ${originalCount} → ${filteredNews.length}`);
  }
  
  // Filter by symbols
  if (symbols && symbols.length > 0) {
    const originalCount = filteredNews.length;
    filteredNews = filteredNews.filter((n: any) => 
      symbols.some(sym => 
        n.headline.toLowerCase().includes(sym.toLowerCase()) ||
        (n.summary || '').toLowerCase().includes(sym.toLowerCase())
      )
    );
    console.log(`[FILTER] By symbols: ${originalCount} → ${filteredNews.length}`);
  }
  
  // Filter by time - default to last 30 days if no 'since' provided
  const defaultDaysAgo = 30;
  const sinceTime = since 
    ? new Date(since).getTime() 
    : Date.now() - (defaultDaysAgo * 24 * 60 * 60 * 1000);
  
  const originalCount = filteredNews.length;
  filteredNews = filteredNews.filter((n: any) => new Date(n.published_at).getTime() >= sinceTime);
  console.log(`[FILTER] By time (${since ? 'custom' : `last ${defaultDaysAgo} days`}): ${originalCount} → ${filteredNews.length}`);
  
  // Deduplicate
  const beforeDedup = filteredNews.length;
  filteredNews = dedupeNews(filteredNews);
  console.log(`[DEDUP] ${beforeDedup} → ${filteredNews.length}`);
  
  // Sort by date descending
  filteredNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  
  // Limit results
  const result = filteredNews.slice(0, limit);
  console.log(`[FINAL] Returning ${result.length} news items`);
  
  return result;
}

async function fetchCandles(symbol: string, timeframe: string, limit: number): Promise<any[]> {
  // Try Yahoo Finance first (no API key needed!)
  const yahooCandles = await fetchCandlesFromYahoo(symbol, timeframe, limit);
  if (yahooCandles.length > 0) {
    return yahooCandles;
  }

  // Fallback to Finnhub if Yahoo fails and API key is available
  if (!FINNHUB_API_KEY) {
    console.log('No data sources available for candles - Yahoo failed and Finnhub key not configured');
    return [];
  }

  try {
    // Map timeframes to Finnhub resolutions
    const resolutionMap: { [key: string]: string } = {
      'M5': '5',
      'M15': '15',
      'H1': '60',
      'H4': '240',
      'D1': 'D',
      'W1': 'W'
    };

    const resolution = resolutionMap[timeframe] || '60';
    const finnhubSymbol = FINNHUB_MAPPINGS[symbol];
    if (!finnhubSymbol) return [];

    const toTimestamp = Math.floor(Date.now() / 1000);
    const fromTimestamp = toTimestamp - (limit * getTimeframeSeconds(timeframe));

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=${resolution}&from=${fromTimestamp}&to=${toTimestamp}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Finnhub candles API error for ${symbol}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (data.s !== 'ok' || !data.t || data.t.length === 0) {
      console.warn(`Finnhub returned no candle data for ${symbol}`);
      return [];
    }

    const candles = data.t.map((t: number, i: number) => ({
      time: t,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i]
    }));

    console.log(`Finnhub candles success for ${symbol}: ${candles.length} candles`);
    return candles;
  } catch (error) {
    console.error(`Finnhub candles error for ${symbol}:`, error);
    return [];
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    // Economic Calendar endpoint
    if (endpoint === 'calendar') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const importance = url.searchParams.get('importance');
      const country = url.searchParams.get('country');

      if (!from || !to) {
        return new Response(
          JSON.stringify({ error: 'from and to parameters required (ISO8601 format)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const calendar = await fetchEconomicCalendar(from, to, importance, country);
      
      return new Response(
        JSON.stringify({ success: true, events: calendar }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // News endpoint
    if (endpoint === 'news') {
      const query = url.searchParams.get('query');
      const symbols = url.searchParams.get('symbols')?.split(',');
      const since = url.searchParams.get('since');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!query && !symbols) {
        return new Response(
          JSON.stringify({ error: 'query or symbols parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const news = await fetchNews(query, symbols, since, limit);
      
      return new Response(
        JSON.stringify({ success: true, news }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Candles/OHLCV endpoint
    if (endpoint === 'candles') {
      const symbol = url.searchParams.get('symbol');
      const timeframe = url.searchParams.get('timeframe') || 'H1';
      const limit = parseInt(url.searchParams.get('limit') || '500');

      if (!symbol) {
        return new Response(
          JSON.stringify({ error: 'symbol parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const candles = await fetchCandles(symbol, timeframe, limit);
      
      // Return error if no candles available (triggers demo data fallback in AI chat)
      if (!candles || candles.length === 0) {
        console.warn(`⚠️ No candle data available for ${symbol} ${timeframe}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            candles: [],
            error: 'No candle data available from data providers',
            details: 'Yahoo Finance returned no data. Finnhub API key may be missing or symbol not supported.'
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, candles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle both GET (with URL params) and POST (with JSON body) requests
    if (endpoint === 'quotes' || req.method === 'POST') {
      let symbols: string[] = [];
      
      if (req.method === 'POST') {
        // Handle POST request with JSON body
        const body = await req.json();
        symbols = body.symbols || [];
        console.log(`[QUOTES] POST request - Fetching ${symbols.length} symbols:`, symbols);
      } else {
        // Handle GET request with URL parameters
        symbols = url.searchParams.get('symbols')?.split(',') || [];
        console.log(`[QUOTES] GET request - Fetching ${symbols.length} symbols:`, symbols);
      }
      
      if (symbols.length === 0) {
        return new Response(JSON.stringify({ error: 'No symbols provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const startTime = Date.now();
      const quotes = await Promise.all(
        symbols.map(symbol => fetchQuote(symbol.trim()))
      );
      const fetchDuration = Date.now() - startTime;
      
      const validQuotes = quotes.filter(quote => quote !== null);
      const failedCount = quotes.length - validQuotes.length;
      
      console.log(`[QUOTES] ✓ Successfully fetched ${validQuotes.length}/${symbols.length} quotes in ${fetchDuration}ms`);
      if (failedCount > 0) {
        const failedSymbols = symbols.filter((_, i) => quotes[i] === null);
        console.log(`[QUOTES] ✗ Failed to fetch ${failedCount} quotes:`, failedSymbols);
      }
      
      return new Response(JSON.stringify(validQuotes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (endpoint === 'historical') {
      const symbol = url.searchParams.get('symbol');
      const days = parseInt(url.searchParams.get('days') || '30');
      
      if (!symbol) {
        return new Response(JSON.stringify({ error: 'Symbol parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching historical data for ${symbol}, ${days} days`);
      const historicalData = await fetchHistoricalData(symbol, days);
      
      return new Response(JSON.stringify(historicalData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});