import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RotateCcw, 
  Database,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface OfflineData {
  trades: any[];
  accounts: any[];
  analytics: any[];
  lastSync: Date;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingUploads: number;
  lastSyncTime: Date | null;
  cacheSize: string;
}

export function OfflineManager() {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingUploads: 0,
    lastSyncTime: null,
    cacheSize: '0 MB'
  });
  
  const [offlineData, setOfflineData] = useState<OfflineData>({
    trades: [],
    accounts: [],
    analytics: [],
    lastSync: new Date()
  });

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing data...",
      });
      syncData();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "Offline Mode",
        description: "Working offline. Data will sync when connection returns.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize cache data
    loadCacheInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCacheInfo = async () => {
    try {
      // Get cache size and pending uploads
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          // Estimate cache size (simplified)
          totalSize += requests.length * 50; // KB estimate per request
        }
        
        setSyncStatus(prev => ({
          ...prev,
          cacheSize: `${(totalSize / 1024).toFixed(1)} MB`,
          pendingUploads: Math.floor(Math.random() * 5) // Mock pending uploads
        }));
      }
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  };

  const syncData = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      // Simulate data sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingUploads: 0
      }));
      
      setOfflineData(prev => ({
        ...prev,
        lastSync: new Date()
      }));
      
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized successfully",
      });
      
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      toast({
        title: "Sync Failed",
        description: "Failed to sync data. Will retry automatically.",
        variant: "destructive"
      });
    }
  };

  const downloadForOffline = async () => {
    try {
      toast({
        title: "Downloading Data",
        description: "Preparing data for offline access...",
      });
      
      // Simulate offline data download
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOfflineData({
        trades: Array.from({ length: 50 }, (_, i) => ({ id: i, symbol: 'EURUSD', profit: Math.random() * 1000 })),
        accounts: [{ id: 1, balance: 50000, equity: 52000 }],
        analytics: [{ metric: 'winRate', value: 0.68 }],
        lastSync: new Date()
      });
      
      toast({
        title: "Download Complete",
        description: "Trading data is now available offline",
      });
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download offline data",
        variant: "destructive"
      });
    }
  };

  const clearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        
        setSyncStatus(prev => ({
          ...prev,
          cacheSize: '0 MB'
        }));
        
        toast({
          title: "Cache Cleared",
          description: "All cached data has been removed",
        });
      }
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Offline & Sync
          </div>
          <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Cache Size</span>
            </div>
            <p className="text-2xl font-bold mt-1">{syncStatus.cacheSize}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Last Sync</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatTime(syncStatus.lastSyncTime)}
            </p>
          </Card>
        </div>

        {/* Pending Uploads */}
        {syncStatus.pendingUploads > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm">
              {syncStatus.pendingUploads} items waiting to sync
            </span>
          </div>
        )}

        {/* Offline Data Status */}
        <div className="space-y-3">
          <h4 className="font-medium">Offline Data Availability</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Trade History</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {offlineData.trades.length} trades
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Account Data</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {offlineData.accounts.length} accounts
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Analytics</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {offlineData.analytics.length} metrics
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={syncData}
              disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              className="w-full"
            >
              {syncStatus.isSyncing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 mr-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </motion.div>
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={downloadForOffline}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button variant="outline" onClick={clearCache}>
              <Database className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </div>

        {/* Auto-sync Settings */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Auto-sync when online</span>
            <Badge variant="outline">Enabled</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Data will automatically sync when connection is restored
          </p>
        </div>
      </CardContent>
    </Card>
  );
}