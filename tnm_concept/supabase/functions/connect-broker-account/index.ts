import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface BrokerConnectionRequest {
  server: string;
  login: string;
  password: string;
  broker_name: string;
  platform: 'MT4' | 'MT5';
  investor_password?: string; // Optional read-only password
}

interface AccountInfo {
  login: string;
  name: string;
  server: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  isDemo: boolean;
}

// Rate limiting storage
const connectionAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

// Security function to validate input
function validateConnectionRequest(data: any): string | null {
  if (!data.server || typeof data.server !== 'string' || data.server.length > 100) {
    return 'Invalid server parameter';
  }
  if (!data.login || typeof data.login !== 'string' || data.login.length > 50) {
    return 'Invalid login parameter';
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length > 100) {
    return 'Invalid password parameter';
  }
  if (!data.broker_name || typeof data.broker_name !== 'string' || data.broker_name.length > 100) {
    return 'Invalid broker name parameter';
  }
  if (!data.platform || !['MT4', 'MT5'].includes(data.platform)) {
    return 'Invalid platform parameter';
  }
  return null;
}

// Security function to check rate limits
function checkRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const userAttempts = connectionAttempts.get(userId) || { count: 0, lastAttempt: 0, blocked: false };
  
  // Clear old attempts (1 hour window)
  if (now - userAttempts.lastAttempt > 3600000) {
    userAttempts.count = 0;
    userAttempts.blocked = false;
  }
  
  // Check if user is blocked (after 5 attempts)
  if (userAttempts.blocked) {
    return { allowed: false, message: 'Too many connection attempts. Please try again later.' };
  }
  
  // Check rate limit (5 attempts per hour)
  if (userAttempts.count >= 5) {
    userAttempts.blocked = true;
    connectionAttempts.set(userId, userAttempts);
    return { allowed: false, message: 'Rate limit exceeded. Please try again later.' };
  }
  
  return { allowed: true };
}

// Log security event
async function logSecurityEvent(supabaseClient: any, userId: string, eventType: string, details: any) {
  try {
    await supabaseClient
      .from('security_events')
      .insert({
        event_type: eventType,
        ip_address: 'server-side',
        timestamp: new Date().toISOString(),
        details: { user_id: userId, ...details }
      });
  } catch (error) {
    console.warn('Failed to log security event:', error);
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check rate limits
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      await logSecurityEvent(supabaseClient, user.id, 'rate_limit_exceeded', { endpoint: 'connect-broker-account' });
      throw new Error(rateCheck.message);
    }

    const requestData: BrokerConnectionRequest = await req.json();

    // Validate input thoroughly
    const validationError = validateConnectionRequest(requestData);
    if (validationError) {
      await logSecurityEvent(supabaseClient, user.id, 'invalid_input', { error: validationError });
      throw new Error(validationError);
    }

    const { server, login, password, broker_name, platform, investor_password } = requestData;

    console.log('Attempting broker connection:', { server, login, broker_name, platform });

    // Update rate limit counter
    const userAttempts = connectionAttempts.get(user.id) || { count: 0, lastAttempt: 0, blocked: false };
    userAttempts.count++;
    userAttempts.lastAttempt = Date.now();
    connectionAttempts.set(user.id, userAttempts);

    // Log connection attempt
    await logSecurityEvent(supabaseClient, user.id, 'broker_connection_attempt', { 
      broker_name, 
      platform, 
      server: server.substring(0, 10) + '...' // Partial server for security
    });

    // TODO: Replace with actual broker MT5 Manager API integration
    // For now, simulate a pending connection that will be completed when broker API is ready
    
    // Simulate account info (replace with real broker API call)
    const mockAccountInfo: AccountInfo = {
      login: login,
      name: `${broker_name} Account`,
      server: server,
      company: broker_name,
      currency: 'USD',
      balance: 0, // Will be updated when broker API is connected
      equity: 0,
      margin: 0,
      freeMargin: 0,
      marginLevel: 0,
      leverage: 1,
      isDemo: server.toLowerCase().includes('demo')
    };

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Store account in database with pending status
    const { data: dbAccount, error: dbError } = await supabaseClient
      .from('trading_accounts')
      .insert({
        user_id: profile.user_id,
        platform: platform,
        broker_name: mockAccountInfo.company,
        server: mockAccountInfo.server,
        login_number: mockAccountInfo.login,
        account_name: mockAccountInfo.name,
        balance: mockAccountInfo.balance,
        equity: mockAccountInfo.equity,
        margin: mockAccountInfo.margin,
        free_margin: mockAccountInfo.freeMargin,
        margin_level: mockAccountInfo.marginLevel,
        currency: mockAccountInfo.currency,
        leverage: mockAccountInfo.leverage,
        is_active: false, // Will be activated when broker API is ready
        connection_status: 'pending_broker_setup',
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      await logSecurityEvent(supabaseClient, user.id, 'database_error', { error: dbError.message });
      throw new Error('Failed to save account to database');
    }

    // Store broker integration placeholder (no sensitive data stored)
    const { error: integrationError } = await supabaseClient
      .from('account_integrations')
      .insert({
        account_id: dbAccount.id,
        provider: 'broker_mt5_manager',
        external_account_id: `pending_${login}`,
        credentials: {
          status: 'awaiting_broker_api_setup',
          connection_type: 'mt5_manager'
        }
      });

    if (integrationError) {
      console.warn('Failed to store integration placeholder:', integrationError);
    }

    // Log successful account creation
    await logSecurityEvent(supabaseClient, user.id, 'account_created', { 
      account_id: dbAccount.id, 
      platform, 
      broker_name 
    });

    console.log('Successfully created pending broker account:', dbAccount.id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Account registered successfully. Connection will be activated when broker MT5 Manager API is configured.',
      account: {
        id: dbAccount.id,
        platform: platform,
        broker_name: mockAccountInfo.company,
        server: mockAccountInfo.server,
        login: mockAccountInfo.login,
        balance: mockAccountInfo.balance,
        equity: mockAccountInfo.equity,
        currency: mockAccountInfo.currency,
        isDemo: mockAccountInfo.isDemo,
        status: 'pending_broker_setup'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error connecting broker account:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});