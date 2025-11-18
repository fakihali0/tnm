/**
 * SyncStatusWidget Component
 * 
 * Displays sync status with countdown timer for AIHub.
 * Matches the LinkedAccountsList badge conventions.
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Clock,
  RefreshCw 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SyncStatus } from '@/hooks/useAccountInsights';

interface SyncStatusWidgetProps {
  syncStatus: SyncStatus;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const SyncStatusWidget: React.FC<SyncStatusWidgetProps> = ({
  syncStatus,
  onSync,
  isSyncing = false,
}) => {
  const [countdown, setCountdown] = useState<string>('');

  // Countdown timer effect
  useEffect(() => {
    if (!syncStatus.nextSyncTime || syncStatus.status === 'syncing') {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const next = syncStatus.nextSyncTime!;
      const diff = next.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Ready to sync');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [syncStatus.nextSyncTime, syncStatus.status]);

  const getStatusBadge = () => {
    if (syncStatus.status === 'syncing' || isSyncing) {
      return (
        <Badge 
          variant="outline" 
          className="border-yellow-500 text-yellow-700 dark:text-yellow-400"
          role="status"
          aria-label="Account status: Syncing"
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      );
    }

    if (syncStatus.status === 'error') {
      return (
        <Badge 
          variant="outline" 
          className="border-red-500 text-red-700 dark:text-red-400"
          role="status"
          aria-label="Account status: Error"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }

    if (syncStatus.status === 'inactive') {
      return (
        <Badge 
          variant="outline" 
          className="border-gray-400 text-gray-600 dark:text-gray-400"
          role="status"
          aria-label="Account status: Inactive"
        >
          <Clock className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }

    // Connected status (green if recent sync)
    if (syncStatus.lastSyncTime) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const isRecent = syncStatus.lastSyncTime >= tenMinutesAgo;

      return (
        <Badge 
          variant="outline" 
          className={
            isRecent
              ? "border-green-500 text-green-700 dark:text-green-400"
              : "border-gray-400 text-gray-600 dark:text-gray-400"
          }
          role="status"
          aria-label={`Account status: ${isRecent ? 'Connected' : 'Stale'}`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {isRecent ? 'Connected' : 'Stale'}
        </Badge>
      );
    }

    return (
      <Badge 
        variant="outline" 
        className="border-gray-400 text-gray-600 dark:text-gray-400"
        role="status"
        aria-label="Account status: No data"
      >
        <Clock className="h-3 w-3 mr-1" />
        No data
      </Badge>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {getStatusBadge()}
      
      {syncStatus.lastSyncTime && !isSyncing && (
        <Badge variant="secondary" className="text-xs">
          Last: {formatDistanceToNow(syncStatus.lastSyncTime, { addSuffix: true })}
        </Badge>
      )}

      {countdown && syncStatus.status === 'connected' && (
        <Badge variant="secondary" className="text-xs">
          Next: {countdown}
        </Badge>
      )}

      {syncStatus.error && (
        <Badge variant="destructive" className="text-xs max-w-xs truncate">
          {syncStatus.error}
        </Badge>
      )}

      {onSync && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSync}
          disabled={isSyncing}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      )}
    </div>
  );
};
