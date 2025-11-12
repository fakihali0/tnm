import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  Check,
  X,
  Clock,
  Star,
  Volume2
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  type: 'risk' | 'performance' | 'system' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDeleteNotification 
}: NotificationCenterProps) {
  const { t } = useTranslation('tnm-ai');
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const { settings, updateSettings } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'performance': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'milestone': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'system': return <Settings className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.center')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{t('notifications.manage')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('notifications')}
            >
              {t('notifications.tabs.notifications')}
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              {t('notifications.tabs.settings')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'notifications' ? (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('notifications.totalNotifications', { count: notifications.length })}
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('notifications.markAllRead')}
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('notifications.noNotificationsYet')}</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        notification.read 
                          ? 'bg-background' 
                          : 'bg-muted/50 border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {notification.title}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                              {notification.actionUrl && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                  {t('notifications.viewDetails')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarkAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteNotification(notification.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alert Preferences */}
            <div>
              <h3 className="font-medium mb-4">{t('notifications.alertPreferences')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="risk-alerts" className="text-base">{t('notifications.riskAlerts')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.riskAlertsDesc')}
                    </p>
                  </div>
                  <Switch
                    id="risk-alerts"
                    checked={settings.riskAlerts}
                    onCheckedChange={(checked) => updateSettings({ riskAlerts: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="milestone-alerts" className="text-base">{t('notifications.milestoneAlerts')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.milestoneAlertsDesc')}
                    </p>
                  </div>
                  <Switch
                    id="milestone-alerts"
                    checked={settings.milestoneAlerts}
                    onCheckedChange={(checked) => updateSettings({ milestoneAlerts: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="performance-alerts" className="text-base">{t('notifications.performanceAlerts')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.performanceAlertsDesc')}
                    </p>
                  </div>
                  <Switch
                    id="performance-alerts"
                    checked={settings.performanceAlerts}
                    onCheckedChange={(checked) => updateSettings({ performanceAlerts: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-alerts" className="text-base">{t('notifications.systemAlerts')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.systemAlertsDesc')}
                    </p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) => updateSettings({ systemAlerts: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-enabled" className="text-base">{t('notifications.soundNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.soundNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}