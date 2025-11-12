import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface TradingInsight {
  type: 'performance' | 'risk' | 'strategy' | 'timing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  metrics?: any;
  recommendation?: string;
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

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const { accountId } = await req.json();

    // Fetch trading data for analysis
    const { data: trades, error: tradesError } = await supabaseClient
      .from('trades')
      .select(`
        symbol,
        direction,
        volume,
        entry_price,
        exit_price,
        pnl,
        commission,
        swap,
        opened_at,
        closed_at,
        trade_status,
        risk_reward_ratio
      `)
      .eq('account_id', accountId)
      .order('opened_at', { ascending: false })
      .limit(100);

    if (tradesError) {
      throw new Error('Failed to fetch trading data');
    }

    // Fetch account information
    const { data: account, error: accountError } = await supabaseClient
      .from('trading_accounts')
      .select('balance, equity, margin_level, currency, leverage')
      .eq('id', accountId)
      .single();

    if (accountError) {
      throw new Error('Failed to fetch account data');
    }

    // Prepare data summary for AI analysis
    const closedTrades = trades.filter(t => t.trade_status === 'closed');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losingTrades.length : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Symbol distribution
    const symbolStats = trades.reduce((acc, trade) => {
      acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Trading timing analysis
    const tradingHours = trades.map(t => new Date(t.opened_at).getHours());
    const hourDistribution = tradingHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostActiveHour = Object.entries(hourDistribution).sort(([,a], [,b]) => b - a)[0];
    
    const analysisPrompt = `
    As a professional trading analyst, analyze this trading performance data and provide actionable insights.
    
    MANDATORY: Generate exactly 4 insights, one for each type: "performance", "risk", "strategy", and "timing".

    PERFORMANCE METRICS:
    - Total Trades: ${closedTrades.length}
    - Win Rate: ${winRate.toFixed(1)}%
    - Total P&L: ${totalPnL.toFixed(2)} ${account.currency}
    - Average Win: ${avgWin.toFixed(2)}
    - Average Loss: ${avgLoss.toFixed(2)}
    - Profit Factor: ${profitFactor.toFixed(2)}
    - Current Balance: ${account.balance} ${account.currency}
    - Current Equity: ${account.equity} ${account.currency}
    - Margin Level: ${account.margin_level}%
    - Leverage: 1:${account.leverage}

    TRADING PATTERNS:
    - Most Traded Symbols: ${Object.entries(symbolStats).sort(([,a], [,b]) => b - a).slice(0, 5).map(([symbol, count]) => `${symbol}(${count})`).join(', ')}
    - Most Active Trading Hour: ${mostActiveHour ? `${mostActiveHour[0]}:00 (${mostActiveHour[1]} trades)` : 'N/A'}
    - Recent Trades: ${trades.slice(0, 5).map(t => `${t.symbol} ${t.direction} ${t.pnl?.toFixed(2) || 'Open'}`).join(', ')}

    REQUIRED INSIGHT TYPES (generate exactly one of each):
    1. "performance" - Overall performance analysis and metrics evaluation
    2. "risk" - Risk management assessment and exposure analysis  
    3. "strategy" - Trading strategy effectiveness and optimization suggestions
    4. "timing" - Market timing patterns and optimal trading hours analysis

    IMPORTANT: Output MUST be ONLY a valid JSON array with exactly 4 insights (no code blocks, no prose, no markdown). Example:
    [
      {"type":"performance","title":"Performance Title","description":"Performance analysis","impact":"high","actionable":true,"recommendation":"Performance recommendation"},
      {"type":"risk","title":"Risk Title","description":"Risk analysis","impact":"medium","actionable":true,"recommendation":"Risk recommendation"},
      {"type":"strategy","title":"Strategy Title","description":"Strategy analysis","impact":"high","actionable":true,"recommendation":"Strategy recommendation"},
      {"type":"timing","title":"Timing Title","description":"Timing analysis","impact":"medium","actionable":true,"recommendation":"Timing recommendation"}
    ]
    `;

    // Call DeepSeek for insights
    let insights: TradingInsight[];
    let usedFallback = false;
    let aiError = '';
    
    // Check if we have enough data for meaningful analysis
    if (closedTrades.length < 5) {
      console.log(`Not enough closed trades (${closedTrades.length}) for AI analysis, using fallback insights`);
      insights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
      usedFallback = true;
      aiError = 'Insufficient trading data for AI analysis';
    } else {
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
                content: 'You are an expert trading analyst providing actionable insights. Always respond with valid JSON array format.'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`DeepSeek API error (${response.status}):`, errorText);
          aiError = `DeepSeek API error: ${response.status} - ${errorText}`;
          insights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
          usedFallback = true;
        } else {
          const aiResponse = await response.json();
          let content = aiResponse.choices[0].message.content;

          try {
            const sanitizedContent = sanitizeAndExtractJSON(content);
            console.log(`Raw content preview: ${content.substring(0, 200)}...`);
            console.log(`Sanitized content preview: ${sanitizedContent.substring(0, 200)}...`);
            
            const parsedResponse = JSON.parse(sanitizedContent);
            
            // Handle both array and object responses
            if (parsedResponse && typeof parsedResponse === 'object' && 'insights' in parsedResponse && Array.isArray(parsedResponse.insights)) {
              insights = parsedResponse.insights as TradingInsight[];
              console.log(`Parse path: object.insights, extracted ${insights.length} insights`);
            } else if (Array.isArray(parsedResponse)) {
              insights = parsedResponse as TradingInsight[];
              console.log(`Parse path: direct array, found ${insights.length} insights`);
            } else {
              throw new Error('Invalid response format');
            }
            
            // Validate that we have all required insight types
            if (!insights || insights.length === 0) {
              console.log('AI returned empty insights, using fallback');
              insights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
              usedFallback = true;
              aiError = 'AI returned empty insights';
            } else {
              // Check if all required types are present
              const requiredTypes: ('performance' | 'risk' | 'strategy' | 'timing')[] = ['performance', 'risk', 'strategy', 'timing'];
              const presentTypes = new Set(insights.map(i => i.type));
              const missingTypes = requiredTypes.filter(type => !presentTypes.has(type));
              
              if (missingTypes.length > 0) {
                console.log(`AI missing insight types: ${missingTypes.join(', ')}, supplementing with fallback`);
                const fallbackInsights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
                
                // Add missing insights from fallback
                for (const missingType of missingTypes) {
                  const fallbackInsight = fallbackInsights.find(i => i.type === missingType);
                  if (fallbackInsight) {
                    insights.push(fallbackInsight);
                  }
                }
                aiError = `AI response incomplete, supplemented missing types: ${missingTypes.join(', ')}`;
              }
              
              console.log(`Successfully generated ${insights.length} AI insights with types: ${[...presentTypes].join(', ')}`);
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', content.substring(0, 300));
            console.error('Parse error:', parseError);
            aiError = 'Failed to parse AI response';
            insights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
            usedFallback = true;
          }
        }
      } catch (fetchError) {
        console.error('DeepSeek fetch error:', fetchError);
        aiError = `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
        insights = generateFallbackInsights(winRate, profitFactor, totalPnL, account, trades);
        usedFallback = true;
      }
    }

    // Store insights in database for caching
    try {
      for (const insight of insights) {
        await supabaseClient
          .from('ai_insights')
          .upsert({
            account_id: accountId,
            insight_type: insight.type,
            title: insight.title,
            description: insight.description,
            impact_level: insight.impact,
            actionable: insight.actionable,
            recommendation: insight.recommendation,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          });
      }
      console.log(`Successfully stored ${insights.length} insights for account ${accountId}`);
    } catch (dbError) {
      console.error('Database error storing insights:', dbError);
      // Continue execution even if DB write fails
    }

    const responseData = {
      success: true,
      insights,
      metrics: {
        totalTrades: closedTrades.length,
        winRate,
        totalPnL,
        profitFactor
      },
      usedFallback,
      ...(aiError && { aiError }),
      ...(usedFallback && { message: 'Using fallback insights due to AI service issues' })
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Robust JSON extractor that handles markdown, prose, and various formats
function sanitizeAndExtractJSON(content: string): string {
  let sanitized = content.trim();
  
  // Method 1: Extract from markdown code fences
  const codeBlockMatch = sanitized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    console.log('Parse path: code_fence');
    return codeBlockMatch[1].trim();
  }
  
  // Method 2: Find JSON array bounds
  const arrayStart = sanitized.indexOf('[');
  const arrayEnd = sanitized.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    console.log('Parse path: bracket_slice');
    return sanitized.substring(arrayStart, arrayEnd + 1);
  }
  
  // Method 3: Find JSON object bounds  
  const objectStart = sanitized.indexOf('{');
  const objectEnd = sanitized.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    console.log('Parse path: brace_slice');
    return sanitized.substring(objectStart, objectEnd + 1);
  }
  
  // Method 4: Try direct parse (remove common prefixes)
  sanitized = sanitized.replace(/^Here's?\s+(?:the\s+)?(?:analysis|insights?|json)\s*:?\s*/i, '');
  sanitized = sanitized.replace(/^Based\s+on.*?:\s*/i, '');
  console.log('Parse path: direct');
  return sanitized;
}

function generateFallbackInsights(winRate: number, profitFactor: number, totalPnL: number, account: any, trades: any[] = []): TradingInsight[] {
  const insights: TradingInsight[] = [];

  // Always generate all 4 insight types
  
  // 1. Performance insight
  if (winRate < 40) {
    insights.push({
      type: 'performance',
      title: 'Low Win Rate Detected',
      description: `Your win rate of ${winRate.toFixed(1)}% is below optimal levels. Consider reviewing your entry criteria.`,
      impact: 'high',
      actionable: true,
      recommendation: 'Focus on higher probability setups and consider implementing stricter entry rules.'
    });
  } else if (winRate > 70) {
    insights.push({
      type: 'performance',
      title: 'Strong Win Rate Performance',
      description: `Excellent win rate of ${winRate.toFixed(1)}% indicates good trade selection.`,
      impact: 'high',
      actionable: true,
      recommendation: 'Maintain current approach while gradually increasing position sizes for optimal growth.'
    });
  } else {
    insights.push({
      type: 'performance',
      title: 'Moderate Performance Levels',
      description: `Current performance shows ${winRate.toFixed(1)}% win rate with ${profitFactor.toFixed(2)} profit factor.`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Continue refining entry and exit strategies to improve consistency.'
    });
  }

  // 2. Risk insight
  if (profitFactor < 1.2) {
    insights.push({
      type: 'risk',
      title: 'Risk Management Optimization Needed',
      description: `Your profit factor of ${profitFactor.toFixed(2)} indicates room for improvement in risk-reward ratios.`,
      impact: 'high',
      actionable: true,
      recommendation: 'Review stop-loss placement and profit targets to achieve better risk-reward ratios (aim for 1:2 minimum).'
    });
  } else if (account.equity < account.balance * 0.95) {
    insights.push({
      type: 'risk',
      title: 'Open Position Exposure Alert',
      description: 'Your equity is significantly below balance, indicating unrealized losses on open positions.',
      impact: 'high',
      actionable: true,
      recommendation: 'Consider reducing open position sizes or adjusting stop losses to manage drawdown.'
    });
  } else {
    insights.push({
      type: 'risk',
      title: 'Risk Management Assessment',
      description: `Margin level at ${account.margin_level}% with leverage 1:${account.leverage} appears manageable.`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Continue monitoring margin usage and avoid over-leveraging positions.'
    });
  }

  // 3. Strategy insight
  if (totalPnL > 0) {
    insights.push({
      type: 'strategy',
      title: 'Profitable Strategy Foundation',
      description: `Your current strategy is generating positive returns (${totalPnL.toFixed(2)} ${account.currency}).`,
      impact: 'medium',
      actionable: true,
      recommendation: 'Scale up successful patterns while maintaining strict risk management protocols.'
    });
  } else {
    insights.push({
      type: 'strategy',
      title: 'Strategy Refinement Required',
      description: `Current strategy showing negative P&L (${totalPnL.toFixed(2)} ${account.currency}) requires adjustment.`,
      impact: 'high',
      actionable: true,
      recommendation: 'Analyze losing trades to identify patterns and consider strategy backtesting before live implementation.'
    });
  }

  // 4. Timing insight
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour <= 10) {
    insights.push({
      type: 'timing',
      title: 'Market Opening Hour Opportunities',
      description: 'Trading during market opening hours typically offers increased volatility and opportunities.',
      impact: 'medium',
      actionable: true,
      recommendation: 'Focus on major market opening times (London: 8-10 GMT, New York: 13-15 GMT) for optimal liquidity.'
    });
  } else if (currentHour >= 13 && currentHour <= 15) {
    insights.push({
      type: 'timing',
      title: 'Peak Trading Session Active',
      description: 'London-New York overlap period provides highest liquidity and tighter spreads.',
      impact: 'high',
      actionable: true,
      recommendation: 'Maximize trading activity during overlap sessions (13-17 GMT) for best execution conditions.'
    });
  } else {
    insights.push({
      type: 'timing',
      title: 'Off-Peak Trading Considerations',
      description: 'Trading during off-peak hours may result in wider spreads and reduced liquidity.',
      impact: 'medium',
      actionable: true,
      recommendation: 'Consider reducing position sizes during low-liquidity periods or focus on major session overlaps.'
    });
  }

  return insights;
}