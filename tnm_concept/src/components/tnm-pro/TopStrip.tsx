import React, { useState, useEffect } from 'react';
import { useAccountStore } from '@/store/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { SPACING } from '@/styles/spacing';

interface ConnectionHealth {
  status: 'Connected' | 'Degraded' | 'Disconnected';
  latency: number;
  lastSync: Date;
  server: string;
}

interface ComplianceStatus {
  status: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  details?: string;
}

export const TopStrip: React.FC = () => {
  const { accounts, selectedAccount, setSelectedAccount } = useAccountStore();
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    status: 'Connected',
    latency: 45,
    lastSync: new Date(),
    server: 'EU-West-1'
  });
  const [compliance, setCompliance] = useState<ComplianceStatus>({
    status: 'PASS',
    reason: 'All risk limits within parameters'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionHealth(prev => ({
        ...prev,
        lastSync: new Date(),
        latency: Math.max(20, Math.min(100, prev.latency + (Math.random() - 0.5) * 10))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate compliance based on selected account
  useEffect(() => {
    if (selectedAccount) {
      const marginLevel = (selectedAccount.equity / selectedAccount.margin) * 100;
      const dailyDD = Math.abs(((selectedAccount.balance - selectedAccount.equity) / selectedAccount.balance) * 100);
      
      if (marginLevel < 100 || dailyDD > 5) {
        setCompliance({
          status: 'FAIL',
          reason: marginLevel < 100 ? 'Margin call risk' : 'Daily DD exceeds 5%',
          details: `Margin: ${marginLevel.toFixed(1)}%, DD: ${dailyDD.toFixed(1)}%`
        });
      } else if (marginLevel < 200 || dailyDD > 2) {
        setCompliance({
          status: 'WARN',
          reason: marginLevel < 200 ? 'Low margin level' : 'Daily DD approaching limit',
          details: `Margin: ${marginLevel.toFixed(1)}%, DD: ${dailyDD.toFixed(1)}%`
        });
      } else {
        setCompliance({
          status: 'PASS',
          reason: 'All risk limits within parameters',
          details: `Margin: ${marginLevel.toFixed(1)}%, DD: ${dailyDD.toFixed(1)}%`
        });
      }
    }
  }, [selectedAccount]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getConnectionIcon = () => {
    switch (connectionHealth.status) {
      case 'Connected': return <Wifi className="h-4 w-4 text-green-600" />;
      case 'Degraded': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'Disconnected': return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  const getComplianceIcon = () => {
    switch (compliance.status) {
      case 'PASS': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'FAIL': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getComplianceBadgeVariant = () => {
    switch (compliance.status) {
      case 'PASS': return 'secondary';
      case 'WARN': return 'outline';
      case 'FAIL': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setConnectionHealth(prev => ({ ...prev, lastSync: new Date() }));
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`flex items-center justify-between ${SPACING.section.px} py-3`}>
        {/* Left Side - Account Selection & Data Freshness */}
        <div className={`flex items-center ${SPACING.gap.large}`}>
          {/* Account Selector */}
          {accounts.length > 1 && (
            <div className={`flex items-center ${SPACING.gap.small}`}>
              <span className="text-sm text-muted-foreground">Account:</span>
              <Select
                value={selectedAccount?.id || ''}
                onValueChange={(value) => {
                  const account = accounts.find(acc => acc.id === value);
                  setSelectedAccount(account || null);
                }}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.platform} • {account.login} • {account.server}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Freshness */}
          <div className={`flex items-center ${SPACING.gap.small}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <Clock className={`${SPACING.icon.xs} mr-1`} />
                    <span className="text-xs">
                      {isRefreshing ? 'Syncing...' : `Synced ${formatTimeAgo(connectionHealth.lastSync)}`}
                    </span>
                    <RefreshCw className={`${SPACING.icon.xs} ml-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last synchronized: {connectionHealth.lastSync.toLocaleTimeString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right Side - Connection Health & Compliance */}
        <div className={`flex items-center ${SPACING.gap.medium}`}>
          {/* Connection Health */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center ${SPACING.gap.small} px-3 py-1 rounded-md bg-muted/50`}>
                  {getConnectionIcon()}
                  <span className="text-xs font-medium">{connectionHealth.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {connectionHealth.latency}ms
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p>Connection: {connectionHealth.status}</p>
                  <p>Latency: {connectionHealth.latency}ms</p>
                  <p>Server: {connectionHealth.server}</p>
                  <p>Last sync: {connectionHealth.lastSync.toLocaleTimeString()}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Compliance Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getComplianceBadgeVariant()} className="gap-1.5">
                  {getComplianceIcon()}
                  <span className="font-medium">{compliance.status}</span>
                  <Shield className={SPACING.icon.xs} />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{compliance.reason}</p>
                  {compliance.details && (
                    <p className="text-xs text-muted-foreground">{compliance.details}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};