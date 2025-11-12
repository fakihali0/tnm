/**
 * Offline Storage using IndexedDB
 * Provides persistent offline storage for trading data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TNMOfflineDB extends DBSchema {
  trades: {
    key: string;
    value: any;
    indexes: { 'by-account': string };
  };
  market_insights: {
    key: string;
    value: any;
    indexes: { 'by-symbol': string };
  };
  chat_messages: {
    key: string;
    value: any;
    indexes: { 'by-conversation': string };
  };
  accounts: {
    key: string;
    value: any;
  };
}

class OfflineStorage {
  private db: IDBPDatabase<TNMOfflineDB> | null = null;
  private readonly dbName = 'tnm-offline-v1';
  private readonly version = 1;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<TNMOfflineDB>(this.dbName, this.version, {
      upgrade(db) {
        // Trades store
        if (!db.objectStoreNames.contains('trades')) {
          const tradesStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradesStore.createIndex('by-account', 'account_id');
        }

        // Market insights store
        if (!db.objectStoreNames.contains('market_insights')) {
          const insightsStore = db.createObjectStore('market_insights', { keyPath: 'id' });
          insightsStore.createIndex('by-symbol', 'symbol');
        }

        // Chat messages store
        if (!db.objectStoreNames.contains('chat_messages')) {
          const chatStore = db.createObjectStore('chat_messages', { keyPath: 'id' });
          chatStore.createIndex('by-conversation', 'conversation_id');
        }

        // Accounts store
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
      }
    });

    return this.db;
  }

  // Trades management
  async cacheTrades(accountId: string, trades: any[]) {
    const db = await this.init();
    const tx = db.transaction('trades', 'readwrite');
    await Promise.all(trades.map(trade => tx.store.put({ ...trade, account_id: accountId })));
    await tx.done;
  }

  async getOfflineTrades(accountId: string): Promise<any[]> {
    const db = await this.init();
    return db.getAllFromIndex('trades', 'by-account', accountId);
  }

  async addTrade(trade: any) {
    const db = await this.init();
    await db.put('trades', trade);
  }

  async deleteTrade(tradeId: string) {
    const db = await this.init();
    await db.delete('trades', tradeId);
  }

  // Market insights management
  async cacheMarketInsights(insights: any[]) {
    const db = await this.init();
    const tx = db.transaction('market_insights', 'readwrite');
    await Promise.all(insights.map(insight => tx.store.put(insight)));
    await tx.done;
  }

  async getMarketInsights(symbol: string): Promise<any[]> {
    const db = await this.init();
    return db.getAllFromIndex('market_insights', 'by-symbol', symbol);
  }

  // Chat messages management
  async cacheChatMessages(conversationId: string, messages: any[]) {
    const db = await this.init();
    const tx = db.transaction('chat_messages', 'readwrite');
    await Promise.all(
      messages.map(msg => 
        tx.store.put({ ...msg, conversation_id: conversationId, id: `${conversationId}-${msg.timestamp}` })
      )
    );
    await tx.done;
  }

  async getChatMessages(conversationId: string): Promise<any[]> {
    const db = await this.init();
    return db.getAllFromIndex('chat_messages', 'by-conversation', conversationId);
  }

  // Accounts management
  async cacheAccounts(accounts: any[]) {
    const db = await this.init();
    const tx = db.transaction('accounts', 'readwrite');
    await Promise.all(accounts.map(account => tx.store.put(account)));
    await tx.done;
  }

  async getOfflineAccounts(): Promise<any[]> {
    const db = await this.init();
    return db.getAll('accounts');
  }

  // Cleanup
  async clearAll() {
    const db = await this.init();
    await Promise.all([
      db.clear('trades'),
      db.clear('market_insights'),
      db.clear('chat_messages'),
      db.clear('accounts')
    ]);
  }

  async clearOldData(daysToKeep: number = 30) {
    const db = await this.init();
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    // Clear old trades
    const trades = await db.getAll('trades');
    const tx = db.transaction('trades', 'readwrite');
    await Promise.all(
      trades
        .filter(trade => new Date(trade.created_at).getTime() < cutoffDate)
        .map(trade => tx.store.delete(trade.id))
    );
    await tx.done;
  }
}

export const offlineStorage = new OfflineStorage();
