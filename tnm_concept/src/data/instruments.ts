// Real-time financial instrument data with live market integration
export interface InstrumentData {
  symbol: string;
  name: string;
  assetClass: "forex" | "indices" | "commodities" | "crypto";
  spread: {
    zero: number;
    raw: number;
    live?: number; // Real-time spread from live quotes
  };
  leverage: number;
  tradingHours: string;
  swapLong: number;
  swapShort: number;
  contractSize: string;
  minTrade: string;
  isFavorite?: boolean;
  isMarketOpen?: boolean;
  volatility?: "low" | "medium" | "high";
  tickSize?: string;
  tickValue?: string;
  marginCurrency?: string;
  holidaySchedule?: string;
  // Real-time data fields
  currentPrice?: {
    bid: number;
    ask: number;
    timestamp: number;
  };
  priceChange?: {
    absolute: number;
    percentage: number;
  };
}

export const mockInstruments: InstrumentData[] = [
  // Forex
  {
    symbol: "EURUSD",
    name: "Euro vs US Dollar",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.5,
    swapShort: -1.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    tickSize: "0.00001",
    tickValue: "1 USD",
    isMarketOpen: true,
    currentPrice: {
      bid: 1.05420,
      ask: 1.05435,
      timestamp: Date.now()
    },
    priceChange: {
      absolute: 0.00125,
      percentage: 0.12
    }
  },
  {
    symbol: "GBPUSD",
    name: "British Pound vs US Dollar",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -3.1,
    swapShort: -0.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true,
    currentPrice: {
      bid: 1.27180,
      ask: 1.27195,
      timestamp: Date.now()
    },
    priceChange: {
      absolute: -0.00245,
      percentage: -0.19
    }
  },
  {
    symbol: "USDJPY",
    name: "US Dollar vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: 1.5,
    swapShort: -4.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AUDUSD",
    name: "Australian Dollar vs US Dollar",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -1.8,
    swapShort: -0.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "USDCHF",
    name: "US Dollar vs Swiss Franc",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: 0.8,
    swapShort: -3.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "USDCAD",
    name: "US Dollar vs Canadian Dollar",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -0.5,
    swapShort: -2.1,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "NZDUSD",
    name: "New Zealand Dollar vs US Dollar",
    assetClass: "forex",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.2,
    swapShort: -0.3,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURGBP",
    name: "Euro vs British Pound",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -1.8,
    swapShort: -1.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURJPY",
    name: "Euro vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -0.8,
    swapShort: -2.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURCHF",
    name: "Euro vs Swiss Franc",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.1,
    swapShort: -1.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "low",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURCAD",
    name: "Euro vs Canadian Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.8,
    swapShort: -0.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURAUD",
    name: "Euro vs Australian Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -3.2,
    swapShort: -0.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "EURNZD",
    name: "Euro vs New Zealand Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -3.5,
    swapShort: -0.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "GBPJPY",
    name: "British Pound vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -1.2,
    swapShort: -3.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "GBPCHF",
    name: "British Pound vs Swiss Franc",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.5,
    swapShort: -2.1,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "GBPCAD",
    name: "British Pound vs Canadian Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -3.1,
    swapShort: -1.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "GBPAUD",
    name: "British Pound vs Australian Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -3.8,
    swapShort: -0.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "GBPNZD",
    name: "British Pound vs New Zealand Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -4.2,
    swapShort: -0.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AUDJPY",
    name: "Australian Dollar vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: 0.5,
    swapShort: -3.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AUDCAD",
    name: "Australian Dollar vs Canadian Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.1,
    swapShort: -1.2,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AUDCHF",
    name: "Australian Dollar vs Swiss Franc",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -1.8,
    swapShort: -1.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AUDNZD",
    name: "Australian Dollar vs New Zealand Dollar",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -2.5,
    swapShort: -0.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "NZDJPY",
    name: "New Zealand Dollar vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: 0.2,
    swapShort: -3.5,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "CADJPY",
    name: "Canadian Dollar vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: 0.8,
    swapShort: -3.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "CHFJPY",
    name: "Swiss Franc vs Japanese Yen",
    assetClass: "forex",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 200,
    tradingHours: "Mon 00:05 - Fri 23:55",
    swapLong: -1.5,
    swapShort: -2.8,
    contractSize: "100,000",
    minTrade: "0.01",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  
  // Indices
  {
    symbol: "US30",
    name: "Dow Jones Industrial Average",
    assetClass: "indices",
    spread: { zero: 1.9, raw: 1.3 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 22:55",
    swapLong: -0.75,
    swapShort: -0.75,
    contractSize: "10",
    minTrade: "0.1",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: false
  },
  {
    symbol: "NAS100",
    name: "NASDAQ 100",
    assetClass: "indices",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 22:55",
    swapLong: -0.85,
    swapShort: -0.85,
    contractSize: "20",
    minTrade: "0.1",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: false
  },
  {
    symbol: "SPX500",
    name: "S&P 500",
    assetClass: "indices",
    spread: { zero: 0.6, raw: 0.4 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 22:55",
    swapLong: -0.65,
    swapShort: -0.65,
    contractSize: "50",
    minTrade: "0.1",
    volatility: "medium",
    marginCurrency: "USD",
    isMarketOpen: false,
    currentPrice: {
      bid: 4582.25,
      ask: 4582.85,
      timestamp: Date.now()
    },
    priceChange: {
      absolute: 12.45,
      percentage: 0.27
    }
  },
  {
    symbol: "GER40",
    name: "Germany 40",
    assetClass: "indices",
    spread: { zero: 1.5, raw: 1.0 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 22:55",
    swapLong: -0.70,
    swapShort: -0.70,
    contractSize: "25",
    minTrade: "0.1",
    volatility: "medium",
    marginCurrency: "EUR",
    isMarketOpen: false
  },
  
  // Commodities
  {
    symbol: "XAUUSD",
    name: "Gold vs US Dollar",
    assetClass: "commodities",
    spread: { zero: 2.0, raw: 1.5 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 23:55",
    swapLong: -8.5,
    swapShort: -2.1,
    contractSize: "100",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true,
    currentPrice: {
      bid: 2658.45,
      ask: 2660.95,
      timestamp: Date.now()
    },
    priceChange: {
      absolute: 8.75,
      percentage: 0.33
    }
  },
  {
    symbol: "XAGUSD",
    name: "Silver vs US Dollar",
    assetClass: "commodities",
    spread: { zero: 3.0, raw: 2.0 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 23:55",
    swapLong: -3.2,
    swapShort: -1.8,
    contractSize: "5000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "USOIL",
    name: "US Crude Oil",
    assetClass: "commodities",
    spread: { zero: 25, raw: 25 },
    leverage: 100,
    tradingHours: "Mon 01:05 - Fri 23:55",
    swapLong: -1.5,
    swapShort: -1.5,
    contractSize: "1000",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  
  // Crypto
  {
    symbol: "BTCUSD",
    name: "Bitcoin vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 28, raw: 15 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -15.2,
    swapShort: -8.5,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true,
    currentPrice: {
      bid: 97245.50,
      ask: 97273.50,
      timestamp: Date.now()
    },
    priceChange: {
      absolute: -1250.75,
      percentage: -1.27
    }
  },
  {
    symbol: "ETHUSD",
    name: "Ethereum vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.8, raw: 0.9 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -8.5,
    swapShort: -4.2,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "ADAUSD",
    name: "Cardano vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 0.8, raw: 0.4 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -5.2,
    swapShort: -2.8,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "DOTUSD",
    name: "Polkadot vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.2, raw: 0.6 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -6.8,
    swapShort: -3.5,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "SOLUSD",
    name: "Solana vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.5, raw: 0.8 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -7.2,
    swapShort: -3.8,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "LINKUSD",
    name: "Chainlink vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.1, raw: 0.5 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -6.5,
    swapShort: -3.2,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "AVAXUSD",
    name: "Avalanche vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.3, raw: 0.7 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -6.8,
    swapShort: -3.5,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "MATICUSD",
    name: "Polygon vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 0.9, raw: 0.4 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -5.8,
    swapShort: -3.1,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "LTCUSD",
    name: "Litecoin vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 1.4, raw: 0.7 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -7.1,
    swapShort: -3.8,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  },
  {
    symbol: "XRPUSD",
    name: "Ripple vs US Dollar",
    assetClass: "crypto",
    spread: { zero: 0.7, raw: 0.3 },
    leverage: 50,
    tradingHours: "24/7 except maintenance",
    swapLong: -5.5,
    swapShort: -2.9,
    contractSize: "1",
    minTrade: "0.01",
    volatility: "high",
    marginCurrency: "USD",
    isMarketOpen: true
  }
];

export const getInstrumentsByCategory = (category: string): InstrumentData[] => {
  if (category === "all") return mockInstruments;
  return mockInstruments.filter(instrument => instrument.assetClass === category);
};

export const searchInstruments = (query: string): InstrumentData[] => {
  if (!query.trim()) return mockInstruments;
  
  const lowercaseQuery = query.toLowerCase();
  return mockInstruments.filter(instrument =>
    instrument.symbol.toLowerCase().includes(lowercaseQuery) ||
    instrument.name.toLowerCase().includes(lowercaseQuery)
  );
};

export const getCategoryCounts = (): { [key: string]: number } => {
  const counts = { all: mockInstruments.length };
  
  mockInstruments.forEach(instrument => {
    counts[instrument.assetClass] = (counts[instrument.assetClass] || 0) + 1;
  });
  
  return counts;
};