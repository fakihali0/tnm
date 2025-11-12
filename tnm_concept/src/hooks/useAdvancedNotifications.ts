import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedNotification {
  id: string;
  type: 'risk' | 'milestone' | 'system' | 'performance' | 'market' | 'ai';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'alert' | 'info' | 'warning' | 'success';
  metadata?: any;
  expiresAt?: Date;
}

interface NotificationSettings {
  riskAlerts: boolean;
  milestoneAlerts: boolean;
  systemAlerts: boolean;
  performanceAlerts: boolean;
  marketAlerts: boolean;
  aiInsights: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  quietHours: { start: string; end: string; enabled: boolean };
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const defaultSettings: NotificationSettings = {
  riskAlerts: true,
  milestoneAlerts: true,
  systemAlerts: true,
  performanceAlerts: true,
  marketAlerts: true,
  aiInsights: true,
  emailNotifications: false,
  pushNotifications: false,
  soundEnabled: false,
  quietHours: { start: '22:00', end: '07:00', enabled: false }
};

export function useAdvancedNotifications() {
  const [notifications, setNotifications] = useState<AdvancedNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationSounds = useRef<Map<string, AudioBuffer>>(new Map());

  // Check push notification support
  useEffect(() => {
    const checkPushSupport = () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setPushSupported(true);
      }
    };
    checkPushSupport();
  }, []);

  // Load notification sounds
  useEffect(() => {
    const loadSounds = async () => {
      if (!settings.soundEnabled) return;
      
      try {
        audioContextRef.current = new AudioContext();
        
        const soundConfigs = [
          { type: 'critical', frequency: 800, duration: 0.3 },
          { type: 'high', frequency: 600, duration: 0.2 },
          { type: 'medium', frequency: 400, duration: 0.15 },
          { type: 'low', frequency: 300, duration: 0.1 }
        ];
        
        soundConfigs.forEach(config => {
          const buffer = audioContextRef.current!.createBuffer(1, 44100 * config.duration, 44100);
          const data = buffer.getChannelData(0);
          
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.sin(2 * Math.PI * config.frequency * i / 44100) * 0.1;
          }
          
          notificationSounds.current.set(config.type, buffer);
        });
      } catch (error) {
        console.error('Error loading notification sounds:', error);
      }
    };

    loadSounds();
  }, [settings.soundEnabled]);

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    if (!settings.soundEnabled || !audioContextRef.current) return;
    
    const buffer = notificationSounds.current.get(priority);
    if (!buffer) return;
    
    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [settings.soundEnabled]);

  // Check if in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [settings.quietHours]);

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!pushSupported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.VAPID_PUBLIC_KEY // You'll need to set this
        });
        
        setPushSubscription({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          }
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
    return false;
  }, [pushSupported]);

  // Send email notification
  const sendEmailNotification = useCallback(async (notification: AdvancedNotification) => {
    if (!settings.emailNotifications || notification.priority === 'low') return;
    
    try {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority
        }
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }, [settings.emailNotifications]);

  // Send push notification
  const sendPushNotification = useCallback(async (notification: AdvancedNotification) => {
    if (!settings.pushNotifications || !pushSubscription || notification.priority === 'low') return;
    
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          subscription: pushSubscription,
          notification: {
            title: notification.title,
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: notification.type,
            requireInteraction: notification.priority === 'critical'
          }
        }
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }, [settings.pushNotifications, pushSubscription]);

  // Add notification with advanced features
  const addNotification = useCallback(async (
    notification: Omit<AdvancedNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: AdvancedNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    // Check if notification type is enabled
    const typeEnabled = {
      risk: settings.riskAlerts,
      milestone: settings.milestoneAlerts,
      system: settings.systemAlerts,
      performance: settings.performanceAlerts,
      market: settings.marketAlerts,
      ai: settings.aiInsights
    }[notification.type];

    if (!typeEnabled) return;

    // Add to state
    setNotifications(prev => [newNotification, ...prev.slice(0, 199)]); // Keep last 200
    setUnreadCount(prev => prev + 1);

    // Don't disturb during quiet hours for non-critical notifications
    const inQuietHours = isInQuietHours();
    if (inQuietHours && notification.priority !== 'critical') return;

    // Play sound
    playNotificationSound(notification.priority);

    // Show toast notification
    const shouldShowToast = notification.priority === 'high' || notification.priority === 'critical';
    if (shouldShowToast) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.category === 'warning' || notification.category === 'alert' 
          ? 'destructive' 
          : 'default',
        duration: notification.priority === 'critical' ? 0 : 5000 // Critical notifications don't auto-dismiss
      });
    }

    // Send email notification
    await sendEmailNotification(newNotification);

    // Send push notification
    await sendPushNotification(newNotification);

    // Store notifications locally for now
    try {
      const stored = localStorage.getItem('notifications') || '[]';
      const notifications = JSON.parse(stored);
      notifications.unshift(newNotification);
      localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)));
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  }, [
    settings,
    isInQuietHours,
    playNotificationSound,
    sendEmailNotification,
    sendPushNotification
  ]);

  // Bulk notification management
  const addBulkNotifications = useCallback(async (
    notifications: Omit<AdvancedNotification, 'id' | 'timestamp' | 'read'>[]
  ) => {
    for (const notification of notifications) {
      await addNotification(notification);
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [addNotification]);

  // Mark as read with analytics
  const markAsRead = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Track read analytics (simplified for now)
    console.log(`Notification ${id} marked as read at ${new Date().toISOString()}`);
  }, [notifications]);

  // Auto-expire notifications
  useEffect(() => {
    const checkExpired = () => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(n => !n.expiresAt || n.expiresAt > now)
      );
    };

    const interval = setInterval(checkExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Load saved settings (simplified for now)
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (error) {
          console.log('Error loading saved settings');
        }
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('notification_settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, [settings]);

  // Clear expired and read notifications
  const cleanupNotifications = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setNotifications(prev => 
      prev.filter(n => 
        (!n.read || n.timestamp > weekAgo) && // Keep unread or recent read notifications
        (!n.expiresAt || n.expiresAt > now) // Remove expired
      )
    );
  }, []);

  return {
    notifications,
    unreadCount,
    settings,
    pushSupported,
    pushSubscription,
    addNotification,
    addBulkNotifications,
    markAsRead,
    markAllAsRead: useCallback(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }, []),
    clearNotifications: useCallback(() => {
      setNotifications([]);
      setUnreadCount(0);
    }, []),
    updateSettings,
    requestPushPermission,
    cleanupNotifications
  };
}