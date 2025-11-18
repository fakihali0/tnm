import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinkedAccount } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity, Info, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useRTL } from '@/hooks/useRTL';
import { formatDistanceToNow } from 'date-fns';

interface LinkedAccountCardProps {
  account: LinkedAccount;
  isSelected?: boolean;
  onSelect?: () => void;
  lastSync?: Date;
  syncError?: string;
  isSyncing?: boolean;
  onViewDetails?: () => void;
}

export const LinkedAccountCard: React.FC<LinkedAccountCardProps> = ({
  account,
  isSelected = false,
  onSelect,
  lastSync,
  syncError,
  isSyncing = false,
  onViewDetails,
}) => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Calculate next sync countdown (5 min from last sync)
  useEffect(() => {
    if (!lastSync) {
      setTimeLeft('');
      return;
    }
    
    const updateCountdown = () => {
      const now = Date.now();
      const lastSyncTime = new Date(lastSync).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const nextSyncTime = lastSyncTime + fiveMinutes;
      const remaining = nextSyncTime - now;
      
      if (remaining <= 0) {
        setTimeLeft('ready');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastSync]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const equityChange = (account.equity || 0) - (account.balance || 0);
  const equityPercentage = (account.balance || 0) > 0 ? (equityChange / (account.balance || 0)) * 100 : 0;
  
  // Determine status badge (AC3)
  const getStatusBadge = () => {
    if (isSyncing) {
      return {
        label: 'Syncing',
        variant: 'secondary' as const,
        icon: Loader2,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      };
    }
    
    if (syncError) {
      return {
        label: 'Error',
        variant: 'destructive' as const,
        icon: AlertCircle,
        className: 'bg-red-100 text-red-800 border-red-300',
      };
    }
    
    if (!account.is_active) {
      return {
        label: 'Inactive',
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-gray-100 text-gray-600 border-gray-300',
      };
    }
    
    // Check if last sync was within 10 minutes
    if (lastSync) {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      const lastSyncTime = new Date(lastSync).getTime();
      
      if (lastSyncTime > tenMinutesAgo) {
        return {
          label: 'Connected',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-800 border-green-300',
        };
      }
    }
    
    // Default: stale data
    return {
      label: 'Stale',
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-gray-100 text-gray-600 border-gray-300',
    };
  };
  
  const statusBadge = getStatusBadge();

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
      dir={rtl.dir}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
            <Wallet className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{t('accountCard.account', { platform: account.platform })}</span>
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            {account.is_default && (
              <Badge 
                variant="default" 
                className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1"
              >
                Default
              </Badge>
            )}
            <Badge 
              variant={statusBadge.variant} 
              className={`${statusBadge.className} flex items-center gap-1`}
              role="status"
              aria-label={`Account status: ${statusBadge.label}`}
            >
              <statusBadge.icon className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {statusBadge.label}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span className="truncate">{t('accountCard.labels.login')}: {account.login}</span>
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="h-6 px-2 text-xs"
              >
                <Info className="h-3 w-3 me-1" />
                Details
              </Button>
            )}
          </div>
          <div className="truncate" title={account.server}>
            {account.broker_name || 'Broker'} • {account.server}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {t('accountCard.labels.balance')}
            </div>
            <div className="text-lg sm:text-xl font-semibold break-words">
              {formatCurrency(account.balance)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              {t('accountCard.labels.equity')}
            </div>
            <div className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
              <span className="break-words">{formatCurrency(account.equity)}</span>
              {equityChange !== 0 && (
                <div className={`flex items-center text-sm whitespace-nowrap ${
                  equityChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {equityChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {equityPercentage.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('accountCard.labels.margin')}:</span>
            <div className="font-medium break-words">{formatCurrency(account.margin)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">{t('accountCard.labels.freeMargin')}:</span>
            <div className="font-medium break-words">{formatCurrency(account.freeMargin)}</div>
          </div>
        </div>
        
        {account.leverage && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">{t('accountCard.labels.leverage')}:</span>
            <span className="ms-2 font-medium">1:{account.leverage}</span>
          </div>
        )}
        
        <div className="mt-3 space-y-1">
          {lastSync && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Last sync: {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
              </span>
              {timeLeft && timeLeft !== 'ready' && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Next: {timeLeft}
                </span>
              )}
              {timeLeft === 'ready' && (
                <span className="text-green-600 text-xs font-medium">
                  Ready to sync
                </span>
              )}
            </div>
          )}
          {!lastSync && (
            <div className="text-xs text-muted-foreground">
              Never synced
            </div>
          )}
          {syncError && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {syncError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};