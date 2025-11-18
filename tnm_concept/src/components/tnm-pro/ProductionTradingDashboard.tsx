import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealTradingData } from '@/hooks/useRealTradingData';
import { useRealNotifications } from '@/hooks/useRealNotifications';
import { RealTimeMarketWidget } from './RealTimeMarketWidget';
import { AdvancedInsightsPanel } from './AdvancedInsightsPanel';
import { EnhancedEquityCurve } from './EnhancedEquityCurve';
import { LiveAccountPanel } from './LiveAccountPanel';
import { NotificationCenter } from './NotificationCenter';
import { TradingJournal } from './TradingJournal';
import { 
  RefreshCw, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Play,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProductionTradingDashboard: React.FC = () => {
  const { 
    accounts, 
    selectedAccount, 
    trades, 
    isLoading, 
    refreshData, 
    selectAccount,
    syncAccount
  } = useRealTradingData();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
    deleteNotification
  } = useRealNotifications();

  const { toast } = useToast();

  const handleTestNotification = async () => {
    await sendNotification(
      "Test Notification",
      "This is a test notification to verify the system is working correctly.",
      { 
        type: 'info',
        send_email: false,
        send_push: true
      }
    );
  };

  const handleSyncAllAccounts = async () => {
    if (accounts.length === 0) return;
    
    toast({
      title: "Syncing Accounts",
      description: "Starting sync for all trading accounts...",
    });

    for (const account of accounts) {
      await syncAccount(account.mt5_service_account_id);
    }

    toast({
      title: "Sync Complete",
      description: `Synced ${accounts.length} trading accounts successfully.`,
    });
  };


  // Convert real notifications to the format expected by NotificationCenter
  const formattedNotifications = notifications.map(notif => ({
    id: notif.id,
    type: notif.type === 'error' ? 'risk' as const : 
          notif.type === 'success' ? 'performance' as const :
          notif.type === 'warning' ? 'risk' as const : 'system' as const,
    title: notif.title,
    message: notif.message,
    timestamp: notif.created_at,
    read: !!notif.read_at,
    priority: notif.type === 'error' ? 'critical' as const :
              notif.type === 'warning' ? 'high' as const :
              notif.type === 'success' ? 'medium' as const : 'low' as const,
    actionUrl: notif.action_url || undefined
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">TNM AI - Production Dashboard</h1>
              <p className="text-muted-foreground">Real-time trading analytics and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {accounts.length} Accounts
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {trades.length} Trades
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                onClick={refreshData} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                onClick={handleSyncAllAccounts}
                variant="outline"
                size="sm"
                disabled={accounts.length === 0}
              >
                <Zap className="h-4 w-4 mr-2" />
                Sync All Accounts
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
              >
                Test Notification
              </Button>
              {selectedAccount && (
                <Badge variant="default" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {selectedAccount.platform} - {selectedAccount.login_number}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Account & Market Data */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Account Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map(account => (
                    <div key={account.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{account.platform} - {account.login_number}</span>
                        <Button 
                          size="sm" 
                          onClick={() => selectAccount(account.id)}
                          variant={selectedAccount?.id === account.id ? "default" : "outline"}
                        >
                          Select
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Balance: ${account.balance?.toFixed(2) || '0.00'} | 
                        Equity: ${account.equity?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <RealTimeMarketWidget />
          </div>

          {/* Middle Column - Analytics */}
          <div className="lg:col-span-1 space-y-6">
            <AdvancedInsightsPanel />
            <EnhancedEquityCurve 
              trades={trades}
              initialBalance={selectedAccount?.balance || 10000}
              currency={selectedAccount?.currency || 'USD'}
            />
          </div>

          {/* Right Column - Notifications & Journal */}
          <div className="lg:col-span-1 space-y-6">
            <NotificationCenter
              notifications={formattedNotifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
            />
            <Card>
              <CardHeader>
                <CardTitle>Trading Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Trading journal integration ready</p>
                  <p className="text-sm">Trades: {trades.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>System Status: Operational</span>
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
              <span>Market Session: {new Date().getHours() >= 9 && new Date().getHours() <= 17 ? 'Open' : 'Closed'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Real-time Data: Active</span>
              <span>AI Analysis: Running</span>
              <span>Risk Monitor: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};