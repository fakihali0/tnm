import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { encryptCredentials, secureLog, sanitizeForLogging } from '../_shared/encryption.ts';
import { sanitizeConnectionError } from '../_shared/error-sanitizer.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

interface MT5ConnectionRequest {
  server: string;
  login: string;
  password: string;
  broker_name: string;
}

interface MT5AccountInfo {
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

    const { server, login, password, broker_name }: MT5ConnectionRequest = await req.json();

    // SECURITY: Use secure logging that masks sensitive data (NEVER log passwords)
    secureLog('Attempting MT5 connection:', { server, login, broker_name });

    // Enhanced input validation and security logging
    if (!server || !login || !password || !broker_name) {
      throw new Error('Missing required connection parameters');
    }

    // Validate input formats for security
    if (typeof login !== 'string' || login.length < 3 || login.length > 50) {
      throw new Error('Invalid login format');
    }
    
    if (typeof password !== 'string' || password.length < 4 || password.length > 100) {
      throw new Error('Invalid password format');
    }

    if (typeof server !== 'string' || server.length < 3 || server.length > 100) {
      throw new Error('Invalid server format');
    }

    if (typeof broker_name !== 'string' || broker_name.length < 2 || broker_name.length > 100) {
      throw new Error('Invalid broker name format');
    }

    // Log security event for credential handling
    try {
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_attempt',
        _details: {
          user_id: user.id,
          broker: broker_name,
          server: server,
          login_masked: login.substring(0, 3) + '***',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          ip_source: 'edge_function'
        },
        _user_id: user.id
      });
    } catch (logError) {
      console.warn('Failed to log security event:', logError);
    }

    // Use MetaAPI or similar service for real MT5 connection
    const metaApiKey = Deno.env.get('METAAPI_KEY');
    if (!metaApiKey) {
      throw new Error('MetaAPI configuration not found');
    }

    // Step 1: Create MetaAPI account
    const createAccountResponse = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': metaApiKey,
      },
      body: JSON.stringify({
        name: `TNM-MT5-${login}`,
        type: 'cloud',
        login: login,
        password: password,
        server: server,
        platform: 'mt5',
        magic: 0,
        quoteStreamingIntervalInSeconds: 2.5,
        reliability: 'regular'
      })
    });

    if (!createAccountResponse.ok) {
      const errorData = await createAccountResponse.json();
      // Log full error server-side for debugging
      console.error('MetaAPI MT5 account creation failed:', errorData);
      // Throw generic error that will be sanitized
      throw new Error(errorData.message || 'Connection failed');
    }

    const accountData = await createAccountResponse.json();
    console.log('MetaAPI MT5 account created:', accountData.id);

    // Step 2: Deploy the account
    const deployResponse = await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountData.id}/deploy`, {
      method: 'POST',
      headers: {
        'auth-token': metaApiKey,
      }
    });

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json();
      // Log full error server-side for debugging
      console.error('MetaAPI MT5 deployment failed:', errorData);
      // Throw generic error that will be sanitized
      throw new Error(errorData.message || 'Deployment failed');
    }

    // Step 3: Wait for connection and get account info
    let accountInfo: MT5AccountInfo | null = null;
    let retries = 0;
    const maxRetries = 30; // 30 seconds max wait time

    while (!accountInfo && retries < maxRetries) {
      try {
        const statusResponse = await fetch(`https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountData.id}/account-information`, {
          headers: {
            'auth-token': metaApiKey,
          }
        });

        if (statusResponse.ok) {
          const info = await statusResponse.json();
          accountInfo = {
            login: info.login.toString(),
            name: info.name || 'Unknown',
            server: info.server || server,
            company: info.company || broker_name,
            currency: info.currency || 'USD',
            balance: info.balance || 0,
            equity: info.equity || 0,
            margin: info.margin || 0,
            freeMargin: info.freeMargin || 0,
            marginLevel: info.marginLevel || 0,
            leverage: info.leverage || 1,
            isDemo: server.toLowerCase().includes('demo')
          };
          break;
        }
      } catch (error) {
        console.log(`Retry ${retries + 1}: Waiting for MT5 account connection...`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }

    if (!accountInfo) {
      throw new Error('Failed to retrieve MT5 account information after connection');
    }

    // Step 4: Store account in database
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const { data: dbAccount, error: dbError } = await supabaseClient
      .from('trading_accounts')
      .insert({
        user_id: profile.user_id,
        platform: 'MT5',
        broker_name: accountInfo.company,
        server: accountInfo.server,
        login_number: accountInfo.login,
        account_name: accountInfo.name,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        free_margin: accountInfo.freeMargin,
        margin_level: accountInfo.marginLevel,
        currency: accountInfo.currency,
        leverage: accountInfo.leverage,
        is_active: true,
        connection_status: 'connected',
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save account to database');
    }

    // Step 5: Encrypt and store credentials securely
    const encryptedCreds = await encryptCredentials({
      metaapi_account_id: accountData.id,
      platform: 'mt5',
      server: server,
      login: login,
      encrypted_at: new Date().toISOString()
    });

    const { error: metaError } = await supabaseClient
      .from('account_integrations')
      .insert({
        account_id: dbAccount.id,
        provider: 'metaapi',
        external_account_id: accountData.id,
        encrypted_credentials: encryptedCreds.encrypted_data,
        encryption_key_id: encryptedCreds.encryption_key_id,
        credentials: {
          iv: encryptedCreds.iv // Store IV for decryption
        }
      });

    if (metaError) {
      secureLog('Failed to store integration data:', metaError);
      // Don't fail the request, just log the warning
    }

    secureLog('Successfully connected MT5 account:', { account_id: dbAccount.id });

    // Log successful connection for security monitoring
    try {
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_success',
        _details: {
          user_id: user.id,
          account_id: dbAccount.id,
          broker: accountInfo.company,
          timestamp: new Date().toISOString()
        },
        _user_id: user.id
      });
    } catch (logError) {
      console.warn('Failed to log success event:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      account: {
        id: dbAccount.id,
        platform: 'MT5',
        broker_name: accountInfo.company,
        server: accountInfo.server,
        login: accountInfo.login,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        currency: accountInfo.currency,
        isDemo: accountInfo.isDemo
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error connecting MT5 account:', error);
    
    // Log security event for failed connection
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      await supabaseClient.rpc('log_security_event', {
        _event_type: 'mt5_connection_failed',
        _details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent')
        }
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    // SECURITY: Sanitize error message to prevent information disclosure
    return new Response(JSON.stringify({ 
      success: false, 
      error: sanitizeConnectionError(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});