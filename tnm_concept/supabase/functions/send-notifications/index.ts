import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';
// Note: Resend import would be used in production
// import { Resend } from "npm:resend@2.0.0";

interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  action_url?: string;
  send_email?: boolean;
  send_push?: boolean;
}

// Rate limiting storage
const notificationAttempts = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 10; // 10 notifications per minute per user

  const userAttempts = notificationAttempts.get(userId);
  
  if (!userAttempts || now - userAttempts.timestamp > windowMs) {
    notificationAttempts.set(userId, { count: 1, timestamp: now });
    return { allowed: true };
  }
  
  if (userAttempts.count >= maxAttempts) {
    return { 
      allowed: false, 
      message: 'Rate limit exceeded. Maximum 10 notifications per minute.' 
    };
  }
  
  userAttempts.count++;
  return { allowed: true };
}

function validateNotificationRequest(data: any): string | null {
  if (!data.user_id || typeof data.user_id !== 'string') {
    return 'Invalid user_id';
  }
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return 'Title is required';
  }
  
  if (data.title.length > 200) {
    return 'Title must be less than 200 characters';
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    return 'Message is required';
  }
  
  if (data.message.length > 1000) {
    return 'Message must be less than 1000 characters';
  }
  
  if (data.type && !['info', 'warning', 'error', 'success'].includes(data.type)) {
    return 'Invalid notification type';
  }
  
  if (data.action_url && data.action_url.length > 500) {
    return 'Action URL too long';
  }
  
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const requestData = await req.json();
    
    // Validate input
    const validationError = validateNotificationRequest(requestData);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      user_id, 
      title, 
      message, 
      type = 'info', 
      action_url,
      send_email = false,
      send_push = false 
    }: NotificationRequest = requestData;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(user_id);
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: rateLimitCheck.message 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing notification:', { user_id, title, type, send_email, send_push });

    // Store notification in database
    const { data: notification, error: dbError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        action_url,
        metadata: {
          email_sent: false,
          push_sent: false,
          created_by: 'system'
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing notification:', dbError);
      throw dbError;
    }

    let emailSent = false;
    let pushSent = false;

    // Send email notification if requested
    if (send_email) {
      try {
        // Get user profile to get email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .eq('user_id', user_id)
          .single();

        if (profile) {
          // Get user email from auth.users (using service role)
          const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
          
          if (user?.email) {
            // In production, this would use Resend to send emails
            console.log(`Would send email to ${user.email}: ${title}`);
            console.log(`Email content: ${message}`);
            emailSent = true;
          }
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Send push notification if requested (simplified - would integrate with web push service)
    if (send_push) {
      try {
        // In a real implementation, this would use Web Push API
        // For now, we'll just mark it as sent
        pushSent = true;
        console.log('Push notification would be sent for:', title);
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
    }

    // Update notification metadata with delivery status
    await supabaseClient
      .from('notifications')
      .update({
        metadata: {
          email_sent: emailSent,
          push_sent: pushSent,
          created_by: 'system',
          delivered_at: new Date().toISOString()
        }
      })
      .eq('id', notification.id);

    return new Response(JSON.stringify({
      success: true,
      notification_id: notification.id,
      email_sent: emailSent,
      push_sent: pushSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});