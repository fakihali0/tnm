import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TradingNotification {
  id: string;
  type: 'risk' | 'milestone' | 'system' | 'performance';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSettings {
  riskAlerts: boolean;
  milestoneAlerts: boolean;
  systemAlerts: boolean;
  performanceAlerts: boolean;
  soundEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  riskAlerts: true,
  milestoneAlerts: true,
  systemAlerts: true,
  performanceAlerts: true,
  soundEnabled: false
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<TradingNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from Supabase on mount
  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = transformNotification(payload.new as any);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for high priority notifications
          if (newNotification.priority === 'high') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'risk' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to load notifications:', error);
        return;
      }

      const transformedNotifications = (data || []).map(transformNotification);
      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformNotification = (dbNotification: any): TradingNotification => ({
    id: dbNotification.id,
    type: dbNotification.type || 'system',
    title: dbNotification.title,
    message: dbNotification.message,
    timestamp: new Date(dbNotification.created_at),
    read: !!dbNotification.read_at,
    actionUrl: dbNotification.action_url,
    priority: getPriorityFromMetadata(dbNotification.metadata)
  });

  const getPriorityFromMetadata = (metadata: any): 'low' | 'medium' | 'high' => {
    if (!metadata || typeof metadata !== 'object') return 'medium';
    return metadata.priority || 'medium';
  };

  const addNotification = useCallback(async (notification: Omit<TradingNotification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Save to Supabase for persistence
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          action_url: notification.actionUrl,
          metadata: { priority: notification.priority }
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save notification:', error);
        // Fallback to in-memory notification
        const newNotification: TradingNotification = {
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
          ...notification
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 99)]);
        setUnreadCount(prev => prev + 1);
      }

      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'risk' ? 'destructive' : 'default'
        });
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Failed to mark notification as read:', error);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Update all unread notifications in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Failed to mark all as read:', error);
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    notifications,
    unreadCount,
    settings,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings,
    refreshNotifications: loadNotifications
  };
}