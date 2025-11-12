import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
  metadata?: any;
  user_id: string;
}

interface UseRealNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (title: string, message: string, options?: {
    type?: 'info' | 'warning' | 'error' | 'success';
    action_url?: string;
    send_email?: boolean;
    send_push?: boolean;
  }) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useRealNotifications = (): UseRealNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.read_at)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const sendNotification = async (
    title: string, 
    message: string, 
    options: {
      type?: 'info' | 'warning' | 'error' | 'success';
      action_url?: string;
      send_email?: boolean;
      send_push?: boolean;
    } = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          user_id: user.id,
          title,
          message,
          type: options.type || 'info',
          action_url: options.action_url,
          send_email: options.send_email || false,
          send_push: options.send_push || false
        }
      });

      if (error) throw error;

      // Show toast notification immediately
      toast({
        title,
        description: message,
        variant: options.type === 'error' ? 'destructive' : 'default',
      });

      // Refresh notifications list
      await fetchNotifications();
    } catch (err) {
      console.error('Error sending notification:', err);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const refreshNotifications = async () => {
    setIsLoading(true);
    await fetchNotifications();
  };

  // Calculate unread count
  const unreadCount = notifications.filter(notif => !notif.read_at).length;

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('New notification received:', payload);
        setNotifications(prev => [payload.new as Notification, ...prev]);
        
        // Show toast for new notifications
        const newNotification = payload.new as Notification;
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.type === 'error' ? 'destructive' : 'default',
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === payload.new.id 
              ? payload.new as Notification
              : notif
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    sendNotification,
    deleteNotification,
    refreshNotifications
  };
};