import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEvent {
  id: string;
  event_type: string;
  details: any;
  timestamp: string;
  ip_address: string;
  user_agent?: string;
  created_at: string;
}

// Critical event types that require immediate admin notification
const CRITICAL_EVENT_TYPES = [
  'failed_login',
  'unauthorized_access',
  'suspicious_form_submission',
  'credential_access_violation',
  'rate_limit_exceeded',
  'admin_access_violation',
  'data_breach_attempt',
  'sql_injection_attempt',
  'xss_attempt'
];

// Severity thresholds
const SEVERITY_CONFIG = {
  failed_login: { threshold: 5, window_minutes: 10 },
  rate_limit_exceeded: { threshold: 3, window_minutes: 5 },
  unauthorized_access: { threshold: 1, window_minutes: 1 }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting security event monitoring...');

    // Get security events from the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching security events:', eventsError);
      throw eventsError;
    }

    console.log(`Found ${recentEvents?.length || 0} recent security events`);

    // Filter for critical events
    const criticalEvents = recentEvents?.filter((event: SecurityEvent) => 
      CRITICAL_EVENT_TYPES.includes(event.event_type)
    ) || [];

    console.log(`Identified ${criticalEvents.length} critical events`);

    if (criticalEvents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No critical events detected',
          events_checked: recentEvents?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze event patterns for severity assessment
    const eventPatterns = analyzeEventPatterns(criticalEvents);
    const highSeverityPatterns = eventPatterns.filter(p => p.severity === 'high');

    console.log(`Detected ${highSeverityPatterns.length} high-severity patterns`);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];
    console.log(`Found ${adminUserIds.length} admin users to notify`);

    if (adminUserIds.length === 0) {
      console.warn('No admin users found to notify');
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'No admin users to notify',
          critical_events: criticalEvents.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for each admin
    const notifications = [];
    
    for (const pattern of highSeverityPatterns) {
      const notificationTitle = getNotificationTitle(pattern);
      const notificationMessage = getNotificationMessage(pattern);

      for (const adminId of adminUserIds) {
        notifications.push({
          user_id: adminId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'security_alert',
          metadata: {
            event_type: pattern.event_type,
            count: pattern.count,
            severity: pattern.severity,
            first_occurrence: pattern.first_occurrence,
            last_occurrence: pattern.last_occurrence,
            ip_addresses: pattern.ip_addresses
          }
        });
      }
    }

    // Also create notifications for individual critical events if no patterns detected
    if (highSeverityPatterns.length === 0 && criticalEvents.length > 0) {
      for (const event of criticalEvents.slice(0, 5)) { // Limit to 5 most recent
        const notificationTitle = `Security Alert: ${formatEventType(event.event_type)}`;
        const notificationMessage = `A ${event.event_type} event was detected from IP ${event.ip_address}`;

        for (const adminId of adminUserIds) {
          notifications.push({
            user_id: adminId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'security_alert',
            metadata: {
              event_id: event.id,
              event_type: event.event_type,
              timestamp: event.timestamp,
              ip_address: event.ip_address
            }
          });
        }
      }
    }

    // Insert all notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      throw notifError;
    }

    console.log(`Created ${notifications.length} security alert notifications`);

    // Log the monitoring activity
    await supabase.from('security_events').insert({
      event_type: 'security_monitoring_completed',
      details: {
        events_checked: recentEvents?.length || 0,
        critical_events: criticalEvents.length,
        high_severity_patterns: highSeverityPatterns.length,
        notifications_sent: notifications.length,
        admins_notified: adminUserIds.length
      },
      ip_address: 'system',
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        events_analyzed: recentEvents?.length || 0,
        critical_events: criticalEvents.length,
        high_severity_patterns: highSeverityPatterns.length,
        notifications_sent: notifications.length,
        admins_notified: adminUserIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in monitor-security-events:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Analyze event patterns to detect coordinated attacks or repeated violations
function analyzeEventPatterns(events: SecurityEvent[]) {
  const patterns: any[] = [];
  const eventsByType: { [key: string]: SecurityEvent[] } = {};

  // Group events by type
  events.forEach(event => {
    if (!eventsByType[event.event_type]) {
      eventsByType[event.event_type] = [];
    }
    eventsByType[event.event_type].push(event);
  });

  // Analyze each event type
  for (const [eventType, typeEvents] of Object.entries(eventsByType)) {
    const config = SEVERITY_CONFIG[eventType as keyof typeof SEVERITY_CONFIG];
    const count = typeEvents.length;
    
    let severity = 'medium';
    
    // Determine severity based on count and threshold
    if (config) {
      if (count >= config.threshold) {
        severity = 'high';
      }
    } else if (count >= 3) {
      severity = 'high';
    }

    // Check for patterns from same IP
    const ipGroups: { [key: string]: SecurityEvent[] } = {};
    typeEvents.forEach(event => {
      const ip = event.ip_address || 'unknown';
      if (!ipGroups[ip]) {
        ipGroups[ip] = [];
      }
      ipGroups[ip].push(event);
    });

    // If multiple events from same IP, increase severity
    const suspiciousIPs = Object.entries(ipGroups).filter(([_, events]) => events.length >= 2);
    if (suspiciousIPs.length > 0) {
      severity = 'high';
    }

    patterns.push({
      event_type: eventType,
      count,
      severity,
      first_occurrence: typeEvents[typeEvents.length - 1].timestamp,
      last_occurrence: typeEvents[0].timestamp,
      ip_addresses: [...new Set(typeEvents.map(e => e.ip_address))],
      suspicious_ips: suspiciousIPs.map(([ip, _]) => ip)
    });
  }

  return patterns;
}

function getNotificationTitle(pattern: any): string {
  if (pattern.severity === 'high') {
    return `🚨 Critical Security Alert: ${formatEventType(pattern.event_type)}`;
  }
  return `⚠️ Security Alert: ${formatEventType(pattern.event_type)}`;
}

function getNotificationMessage(pattern: any): string {
  const eventName = formatEventType(pattern.event_type);
  const ipInfo = pattern.suspicious_ips.length > 0 
    ? ` from ${pattern.suspicious_ips.length} suspicious IP(s)` 
    : '';
  
  return `Detected ${pattern.count} ${eventName} event(s)${ipInfo} in the last 10 minutes. Immediate investigation recommended.`;
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
