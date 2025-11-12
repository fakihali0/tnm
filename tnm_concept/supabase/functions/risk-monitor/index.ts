import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface RiskAlert {
  type: 'margin_call' | 'drawdown' | 'exposure' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  accountId: string;
  triggeredAt: string;
  currentValue: number;
  thresholdValue: number;
  actionRequired: boolean;
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

    // Get all user's active trading accounts
    const { data: accounts, error: accountsError } = await supabaseClient
      .from('trading_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      throw new Error('Failed to fetch user accounts');
    }

    const alerts: RiskAlert[] = [];

    for (const account of accounts) {
      console.log(`Monitoring risk for account ${account.id}`);

      // Check margin level
      if (account.margin_level && account.margin_level < 100) {
        const severity = account.margin_level < 50 ? 'critical' : 
                        account.margin_level < 80 ? 'high' : 'medium';
        
        alerts.push({
          type: 'margin_call',
          severity,
          title: 'Low Margin Level Alert',
          message: `Margin level at ${account.margin_level}%. Consider reducing position sizes or adding funds.`,
          accountId: account.id,
          triggeredAt: new Date().toISOString(),
          currentValue: account.margin_level,
          thresholdValue: 100,
          actionRequired: severity === 'critical'
        });
      }

      // Check equity vs balance (drawdown)
      if (account.equity && account.balance) {
        const drawdownPercent = ((account.balance - account.equity) / account.balance) * 100;
        
        if (drawdownPercent > 5) {
          const severity = drawdownPercent > 20 ? 'critical' :
                          drawdownPercent > 15 ? 'high' :
                          drawdownPercent > 10 ? 'medium' : 'low';
          
          alerts.push({
            type: 'drawdown',
            severity,
            title: 'Drawdown Alert',
            message: `Account drawdown at ${drawdownPercent.toFixed(1)}%. Review open positions.`,
            accountId: account.id,
            triggeredAt: new Date().toISOString(),
            currentValue: drawdownPercent,
            thresholdValue: 5,
            actionRequired: severity === 'critical' || severity === 'high'
          });
        }
      }

      // Check position concentration risk
      const { data: openTrades, error: tradesError } = await supabaseClient
        .from('trades')
        .select('symbol, volume, entry_price, direction')
        .eq('account_id', account.id)
        .eq('trade_status', 'open');

      if (!tradesError && openTrades) {
        const symbolExposure: Record<string, { volume: number, notional: number }> = {};
        let totalNotional = 0;

        for (const trade of openTrades) {
          const notional = trade.volume * trade.entry_price;
          totalNotional += notional;
          
          if (!symbolExposure[trade.symbol]) {
            symbolExposure[trade.symbol] = { volume: 0, notional: 0 };
          }
          symbolExposure[trade.symbol].volume += trade.volume;
          symbolExposure[trade.symbol].notional += notional;
        }

        // Check if any single symbol represents >30% of exposure
        for (const [symbol, exposure] of Object.entries(symbolExposure)) {
          const exposurePercent = (exposure.notional / totalNotional) * 100;
          
          if (exposurePercent > 30) {
            alerts.push({
              type: 'exposure',
              severity: exposurePercent > 50 ? 'high' : 'medium',
              title: 'High Symbol Concentration',
              message: `${symbol} represents ${exposurePercent.toFixed(1)}% of total exposure. Consider diversifying.`,
              accountId: account.id,
              triggeredAt: new Date().toISOString(),
              currentValue: exposurePercent,
              thresholdValue: 30,
              actionRequired: exposurePercent > 50
            });
          }
        }
      }

      // Check correlation risk for forex pairs
      if (openTrades && openTrades.length > 1) {
        const correlationAlert = checkCorrelationRisk(openTrades);
        if (correlationAlert && correlationAlert.type) {
          alerts.push({
            type: correlationAlert.type,
            severity: correlationAlert.severity || 'medium',
            title: correlationAlert.title || 'Risk Alert',
            message: correlationAlert.message || 'Risk detected',
            accountId: account.id,
            triggeredAt: new Date().toISOString(),
            currentValue: correlationAlert.currentValue || 0,
            thresholdValue: correlationAlert.thresholdValue || 0,
            actionRequired: correlationAlert.actionRequired || false
          });
        }
      }
    }

    // Store alerts in database and send notifications for critical ones
    for (const alert of alerts) {
      // Store alert
      await supabaseClient
        .from('risk_alerts')
        .insert({
          user_id: user.id,
          account_id: alert.accountId,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          current_value: alert.currentValue,
          threshold_value: alert.thresholdValue,
          action_required: alert.actionRequired,
          triggered_at: alert.triggeredAt
        });

      // Send immediate notification for critical alerts
      if (alert.severity === 'critical') {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'risk',
            title: alert.title,
            message: alert.message,
            metadata: {
              alertType: alert.type,
              accountId: alert.accountId,
              currentValue: alert.currentValue,
              thresholdValue: alert.thresholdValue
            }
          });
      }
    }

    console.log(`Generated ${alerts.length} risk alerts for user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      alerts,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in risk monitoring:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function checkCorrelationRisk(trades: any[]): Partial<RiskAlert> | null {
  // Check for highly correlated forex pairs
  const correlatedPairs = [
    ['EURUSD', 'GBPUSD'], // Positive correlation
    ['EURUSD', 'USDCHF'], // Negative correlation
    ['GBPUSD', 'EURGBP'], // Related pairs
    ['USDJPY', 'USDCHF'], // USD strength pairs
  ];

  const openSymbols = trades.map(t => t.symbol);
  
  for (const [pair1, pair2] of correlatedPairs) {
    const hasPair1 = openSymbols.includes(pair1);
    const hasPair2 = openSymbols.includes(pair2);
    
    if (hasPair1 && hasPair2) {
      const trade1 = trades.find(t => t.symbol === pair1);
      const trade2 = trades.find(t => t.symbol === pair2);
      
      // Check if directions amplify correlation risk
      const sameDirection = trade1.direction === trade2.direction;
      const riskLevel = sameDirection ? 'medium' : 'low';
      
      return {
        type: 'correlation',
        severity: riskLevel,
        title: 'Correlation Risk Detected',
        message: `Open positions in correlated pairs ${pair1} and ${pair2}. Consider reducing exposure.`,
        currentValue: 1, // Correlation coefficient would go here
        thresholdValue: 0.7,
        actionRequired: false
      };
    }
  }
  
  return null;
}