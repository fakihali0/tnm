import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface RiskRecommendation {
  type: 'position_size' | 'stop_loss' | 'leverage' | 'timing' | 'symbol_warning';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const { accountId, symbol, balance, riskPercent, stopDistance, leverage } = await req.json();

    console.log(`Generating AI risk recommendations for account ${accountId}, symbol ${symbol}`);

    // Fetch recent trading history for this symbol
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trades')
      .select('symbol, direction, volume, pnl, entry_price, exit_price, stop_loss, opened_at, closed_at, trade_status')
      .eq('account_id', accountId)
      .order('opened_at', { ascending: false })
      .limit(50);

    if (tradesError) {
      console.error('Failed to fetch trades:', tradesError);
    }

    // Fetch account metrics
    const { data: account, error: accountError } = await supabaseClient
      .from('trading_accounts')
      .select('balance, equity, margin_level, currency, leverage, free_margin')
      .eq('id', accountId)
      .single();

    if (accountError) {
      throw new Error('Failed to fetch account data');
    }

    // Calculate statistics
    const symbolTrades = (trades || []).filter(t => t.symbol === symbol);
    const closedSymbolTrades = symbolTrades.filter(t => t.trade_status === 'closed');
    const recentTrades = (trades || []).filter(t => t.trade_status === 'closed').slice(0, 20);
    
    const symbolWinRate = closedSymbolTrades.length > 0 
      ? (closedSymbolTrades.filter(t => (t.pnl || 0) > 0).length / closedSymbolTrades.length) * 100 
      : 0;
    
    const totalPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin = recentTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / Math.max(1, recentTrades.filter(t => (t.pnl || 0) > 0).length);
    const avgLoss = Math.abs(recentTrades.filter(t => (t.pnl || 0) <= 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) / Math.max(1, recentTrades.filter(t => (t.pnl || 0) <= 0).length);
    
    const currentDrawdown = ((account.balance - account.equity) / account.balance) * 100;
    
    // Get trading time analysis
    const tradingHours = (trades || []).map(t => new Date(t.opened_at).getHours());
    const currentHour = new Date().getHours();
    const tradesInCurrentHour = tradingHours.filter(h => h === currentHour).length;

    const analysisPrompt = `As a professional risk management advisor, analyze this trader's data and provide personalized position sizing recommendations.

TRADER PROFILE:
- Total trades executed: ${(trades || []).length}
- Recent 20 trades P&L: ${totalPnL.toFixed(2)} ${account.currency}
- Symbol "${symbol}" performance: ${closedSymbolTrades.length} trades, ${symbolWinRate.toFixed(1)}% win rate
- Average winning trade: ${avgWin.toFixed(2)} ${account.currency}
- Average losing trade: ${avgLoss.toFixed(2)} ${account.currency}
- Current drawdown: ${currentDrawdown.toFixed(2)}%
- Account balance: ${account.balance} ${account.currency}
- Equity: ${account.equity} ${account.currency}
- Margin level: ${account.margin_level}%
- Free margin: ${account.free_margin} ${account.currency}
- Account leverage: 1:${account.leverage}

PROPOSED TRADE SETUP:
- Symbol: ${symbol}
- Account balance: ${balance} ${account.currency}
- Proposed risk: ${riskPercent}%
- Stop distance: ${stopDistance} pips
- Leverage: 1:${leverage}

TIME CONTEXT:
- Current hour: ${currentHour}:00
- Historical trades at this hour: ${tradesInCurrentHour}

TASK: Provide ONLY a valid JSON response with:
1. optimalRiskPercent: number (recommended risk % based on performance, between 0.5 and 5)
2. riskLevel: "conservative" | "moderate" | "aggressive"
3. recommendations: array of 3-5 recommendations (type, message, impact)
4. warnings: array of important warnings (strings)
5. confidence: number (0-100, how confident you are in this recommendation)

Consider:
- If drawdown is high (>5%), recommend lower risk
- If symbol-specific win rate is low (<40%), suggest caution
- If margin level is tight (<200%), recommend smaller positions
- If trader performs better at certain times, mention it
- If recent trades show losing streak, suggest reducing risk

CRITICAL: Respond with ONLY valid JSON, no markdown, no code blocks, no prose. Example:
{
  "optimalRiskPercent": 1.5,
  "riskLevel": "moderate",
  "recommendations": [
    {"type": "position_size", "message": "Based on your recent performance, consider reducing position size by 25%", "impact": "high"},
    {"type": "symbol_warning", "message": "Your win rate on ${symbol} is below 50%, approach with caution", "impact": "medium"}
  ],
  "warnings": ["Current drawdown of ${currentDrawdown.toFixed(1)}% suggests conservative approach"],
  "confidence": 75
}`;

    let aiResponse;
    let usedFallback = false;

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert risk management advisor. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error (${response.status}):`, errorText);
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      let content = data.choices[0].message.content;

      // Clean and parse JSON
      content = content.trim();
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch) {
        content = codeBlockMatch[1].trim();
      }
      
      const objectStart = content.indexOf('{');
      const objectEnd = content.lastIndexOf('}');
      if (objectStart !== -1 && objectEnd !== -1) {
        content = content.substring(objectStart, objectEnd + 1);
      }

      aiResponse = JSON.parse(content);
      console.log('Successfully parsed AI response');
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      usedFallback = true;
      aiResponse = generateFallbackRecommendation(
        riskPercent,
        symbolWinRate,
        currentDrawdown,
        account.margin_level,
        closedSymbolTrades.length
      );
    }

    // Calculate recommended lot size based on AI suggestion
    const recommendedRiskAmount = (balance * aiResponse.optimalRiskPercent) / 100;
    const pipValue = symbol.includes('JPY') ? 0.01 : 0.0001;
    const contractSize = 100000;
    const valuePerPip = (contractSize * pipValue) / leverage;
    const recommendedLotSize = Math.round((recommendedRiskAmount / (stopDistance * valuePerPip)) * 100) / 100;

    // Store recommendation in database
    await supabaseClient
      .from('ai_risk_recommendations')
      .insert({
        account_id: accountId,
        symbol: symbol,
        recommended_risk_percent: aiResponse.optimalRiskPercent,
        recommended_lot_size: recommendedLotSize,
        risk_level: aiResponse.riskLevel,
        recommendations: aiResponse.recommendations,
        warnings: aiResponse.warnings,
        confidence_score: aiResponse.confidence,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    return new Response(JSON.stringify({
      success: true,
      optimalRiskPercent: aiResponse.optimalRiskPercent,
      recommendedLotSize,
      riskLevel: aiResponse.riskLevel,
      recommendations: aiResponse.recommendations,
      warnings: aiResponse.warnings,
      confidence: aiResponse.confidence,
      usedFallback,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating risk recommendations:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackRecommendation(
  riskPercent: number,
  symbolWinRate: number,
  currentDrawdown: number,
  marginLevel: number,
  symbolTrades: number
): any {
  const recommendations: RiskRecommendation[] = [];
  const warnings: string[] = [];
  let optimalRisk = riskPercent;
  let riskLevel: 'conservative' | 'moderate' | 'aggressive' = 'moderate';

  // Adjust based on drawdown
  if (currentDrawdown > 5) {
    optimalRisk = Math.max(0.5, riskPercent * 0.5);
    riskLevel = 'conservative';
    recommendations.push({
      type: 'position_size',
      message: `Current drawdown of ${currentDrawdown.toFixed(1)}% warrants reduced position sizing`,
      impact: 'high'
    });
    warnings.push('High drawdown detected - strongly recommend conservative approach');
  }

  // Symbol-specific warnings
  if (symbolTrades > 5 && symbolWinRate < 40) {
    recommendations.push({
      type: 'symbol_warning',
      message: `Your win rate on this symbol is ${symbolWinRate.toFixed(1)}% - consider avoiding or reducing risk`,
      impact: 'high'
    });
  }

  // Margin level warnings
  if (marginLevel < 200) {
    recommendations.push({
      type: 'leverage',
      message: 'Margin level below 200% - reduce position size to avoid margin calls',
      impact: 'high'
    });
    warnings.push('Tight margin situation - exercise extreme caution');
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'position_size',
      message: 'Your risk parameters appear reasonable for current account conditions',
      impact: 'low'
    });
  }

  return {
    optimalRiskPercent: optimalRisk,
    riskLevel,
    recommendations,
    warnings,
    confidence: 60
  };
}