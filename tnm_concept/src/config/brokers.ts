/**
 * MT5 Broker Configuration
 * Defines available brokers and their server endpoints for account linking
 */

export interface BrokerServer {
  name: string;
  displayName: string;
  description?: string;
}

export interface BrokerConfig {
  id: string;
  name: string;
  displayName: string;
  platform: 'MT4' | 'MT5' | 'both';
  servers: BrokerServer[];
  demoAvailable: boolean;
  icon?: string;
}

export const BROKERS: BrokerConfig[] = [
  {
    id: 'metaquotes',
    name: 'MetaQuotes',
    displayName: 'MetaQuotes Software Corp.',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'MetaQuotes-Demo', displayName: 'MetaQuotes Demo Server', description: 'Official MT4 demo server' },
      { name: 'MetaQuotes-MT5', displayName: 'MetaQuotes MT5 Demo', description: 'Official MT5 demo server' },
    ],
  },
  {
    id: 'icmarkets',
    name: 'IC Markets',
    displayName: 'IC Markets',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'ICMarkets-Live01', displayName: 'IC Markets Live 01', description: 'MT4 live server' },
      { name: 'ICMarkets-Live02', displayName: 'IC Markets Live 02', description: 'MT4 live server' },
      { name: 'ICMarkets-Demo01', displayName: 'IC Markets Demo 01', description: 'MT4 demo server' },
      { name: 'ICMarkets-MT5-Live', displayName: 'IC Markets MT5 Live', description: 'MT5 live server' },
      { name: 'ICMarkets-MT5-Demo', displayName: 'IC Markets MT5 Demo', description: 'MT5 demo server' },
    ],
  },
  {
    id: 'fxpro',
    name: 'FxPro',
    displayName: 'FxPro',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'FXPRO-Real', displayName: 'FxPro MT4 Real', description: 'MT4 live trading server' },
      { name: 'FXPRO-Demo', displayName: 'FxPro MT4 Demo', description: 'MT4 demo server' },
      { name: 'FXPRO-MT5-Real', displayName: 'FxPro MT5 Real', description: 'MT5 live trading server' },
      { name: 'FXPRO-MT5-Demo', displayName: 'FxPro MT5 Demo', description: 'MT5 demo server' },
    ],
  },
  {
    id: 'xm',
    name: 'XM',
    displayName: 'XM Global',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'XM-Real', displayName: 'XM MT4 Real', description: 'MT4 live server' },
      { name: 'XM-Demo', displayName: 'XM MT4 Demo', description: 'MT4 demo server' },
      { name: 'XM-MT5-Real', displayName: 'XM MT5 Real', description: 'MT5 live server' },
      { name: 'XM-MT5-Demo', displayName: 'XM MT5 Demo', description: 'MT5 demo server' },
    ],
  },
  {
    id: 'pepperstone',
    name: 'Pepperstone',
    displayName: 'Pepperstone',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'Pepperstone-Live01', displayName: 'Pepperstone MT4 Live 01', description: 'MT4 live server' },
      { name: 'Pepperstone-Live02', displayName: 'Pepperstone MT4 Live 02', description: 'MT4 live server' },
      { name: 'Pepperstone-Demo', displayName: 'Pepperstone MT4 Demo', description: 'MT4 demo server' },
      { name: 'Pepperstone-MT5-Live', displayName: 'Pepperstone MT5 Live', description: 'MT5 live server' },
      { name: 'Pepperstone-MT5-Demo', displayName: 'Pepperstone MT5 Demo', description: 'MT5 demo server' },
    ],
  },
  {
    id: 'exness',
    name: 'Exness',
    displayName: 'Exness',
    platform: 'both',
    demoAvailable: true,
    servers: [
      { name: 'Exness-Real', displayName: 'Exness MT4 Real', description: 'MT4 live server' },
      { name: 'Exness-Demo', displayName: 'Exness MT4 Demo', description: 'MT4 demo server' },
      { name: 'Exness-MT5-Real', displayName: 'Exness MT5 Real', description: 'MT5 live server' },
      { name: 'Exness-MT5-Demo', displayName: 'Exness MT5 Demo', description: 'MT5 demo server' },
    ],
  },
  {
    id: 'oanda',
    name: 'OANDA',
    displayName: 'OANDA',
    platform: 'MT4',
    demoAvailable: true,
    servers: [
      { name: 'OANDA-Live', displayName: 'OANDA MT4 Live', description: 'MT4 live server' },
      { name: 'OANDA-Demo', displayName: 'OANDA MT4 Demo', description: 'MT4 demo server' },
    ],
  },
];

/**
 * Get all brokers that support a specific platform
 */
export function getBrokersByPlatform(platform: 'MT4' | 'MT5'): BrokerConfig[] {
  return BROKERS.filter(
    broker => broker.platform === platform || broker.platform === 'both'
  );
}

/**
 * Get servers for a specific broker
 */
export function getServersByBroker(brokerId: string): BrokerServer[] {
  const broker = BROKERS.find(b => b.id === brokerId);
  return broker?.servers || [];
}

/**
 * Get broker by ID
 */
export function getBrokerById(brokerId: string): BrokerConfig | undefined {
  return BROKERS.find(b => b.id === brokerId);
}

/**
 * Extract broker name from server string
 * e.g., "ICMarkets-Live01" -> "IC Markets"
 */
export function extractBrokerName(serverString: string): string {
  const broker = BROKERS.find(b =>
    b.servers.some(s => s.name === serverString)
  );
  return broker?.displayName || serverString.split('-')[0] || 'Unknown Broker';
}
