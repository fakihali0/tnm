import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  console.log('Market Insights Generator function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { symbol = 'EURUSD', timeframe = '1H' } = await req.json();
    console.log(`Generating market insights for ${symbol} on ${timeframe} timeframe`);

    // Fetch real market data for the symbol
    const marketDataResponse = await supabase.functions.invoke('financial-data', {
      body: { symbols: [symbol] }
    });

    let marketData = null;
    if (marketDataResponse.data && marketDataResponse.data.length > 0) {
      marketData = marketDataResponse.data[0];
      console.log(`Retrieved market data for ${symbol}:`, marketData);
    }

    // Fetch real news articles
    const newsArticles = await fetchNewsData(symbol, timeframe, supabase);
    console.log(`Fetched ${newsArticles.length} news articles for ${symbol}`);

    // Fetch historical data for technical context
    const historicalQuotes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}=X?interval=1h&range=7d`)
      .then(response => response.json())
      .catch(error => {
        console.log('Could not fetch historical data:', error.message);
        return null;
      });

    let technicalContext = '';
    if (historicalQuotes?.chart?.result?.[0]?.indicators?.quote?.[0]) {
      const quotes = historicalQuotes.chart.result[0].indicators.quote[0];
      const closes = quotes.close.filter((c: any) => c !== null).slice(-20);
      
      if (closes.length >= 10) {
        const sma10 = closes.slice(-10).reduce((a: number, b: number) => a + b, 0) / 10;
        const sma20 = closes.reduce((a: number, b: number) => a + b, 0) / closes.length;
        
        technicalContext = `
        Technical Analysis for ${symbol}:
        - 10-period SMA: ${sma10.toFixed(5)}
        - 20-period SMA: ${sma20.toFixed(5)}
        - Current trend: ${sma10 > sma20 ? 'Bullish' : 'Bearish'}
        - Recent volatility: ${(Math.max(...closes) - Math.min(...closes)).toFixed(5)}
        `;
      }
    }

    let insights: MarketInsight[] = [];

    // Process real news articles into insights FIRST
    if (newsArticles && newsArticles.length > 0) {
      const newsInsights: MarketInsight[] = newsArticles.slice(0, 10).map((article: any, idx: number) => {
        const impactKeywords = ['rate', 'hike', 'cut', 'crisis', 'earnings', 'gdp', 'inflation', 'recession', 'bank', 'fed'];
        const hasHighImpact = impactKeywords.some(keyword => 
          article.headline?.toLowerCase().includes(keyword) || 
          article.summary?.toLowerCase().includes(keyword)
        );
        
        const bullishKeywords = ['surge', 'gain', 'rally', 'growth', 'positive', 'strong', 'beat', 'upgrade'];
        const bearishKeywords = ['fall', 'drop', 'decline', 'weak', 'miss', 'downgrade', 'concern', 'risk'];
        const text = `${article.headline} ${article.summary || ''}`.toLowerCase();
        const bullishScore = bullishKeywords.filter(k => text.includes(k)).length;
        const bearishScore = bearishKeywords.filter(k => text.includes(k)).length;
        
        let sentiment = 'Neutral';
        if (bullishScore > bearishScore) sentiment = 'Bullish';
        if (bearishScore > bullishScore) sentiment = 'Bearish';

        return {
          id: `news_${symbol}_${article.datetime || Date.now()}_${idx}`,
          symbol,
          type: 'news' as const,
          title: article.headline || 'Market News',
          description: article.summary || article.headline || 'No summary available',
          confidence: hasHighImpact ? 85 : 70,
          impact: (hasHighImpact ? 'High' : 'Medium') as any,
          timeframe: timeframe,
          priority: 'Medium' as const,
          generated_at: new Date().toISOString(),
          metadata: {
            source: article.source || 'Financial News',
            url: article.url,
            publishedAt: article.datetime ? new Date(article.datetime * 1000).toISOString() : new Date().toISOString(),
            sentiment: sentiment,
            category: article.category || 'general'
          }
        };
      });
      
      insights.push(...newsInsights);
      console.log(`Added ${newsInsights.length} real news insights`);
    }

    // Generate AI insights if API key is available
    if (deepseekApiKey && marketData) {
      try {
        const prompt = `
        Analyze the market data for ${symbol} and provide trading insights:
        
        Current Market Data:
        - Symbol: ${symbol}
        - Current Bid: ${marketData.bid}
        - Current Ask: ${marketData.ask}
        - Spread: ${marketData.spread}
        - Market Status: ${marketData.isMarketOpen ? 'Open' : 'Closed'}
        
        ${technicalContext}
        
        Generate 3-4 market insights in JSON format with the following structure (DO NOT include news type, only sentiment, technical, and prediction):
        {
          "insights": [
            {
              "id": "unique_id",
              "symbol": "${symbol}",
              "type": "sentiment|prediction|technical",
              "title": "Brief insight title",
              "description": "Detailed insight description",
              "confidence": 70-95,
              "timeframe": "15M|1H|4H|1D",
              "impact": "Low|Medium|High",
              "priority": "Low|Medium|High",
              "generated_at": "${new Date().toISOString()}"
            }
          ]
        }
        
        Focus on actionable insights based on current market conditions, technical levels, and potential trading opportunities or risks.
        `;

        const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are an expert forex and financial market analyst. Generate practical trading insights based on current market data. DO NOT generate news insights, only sentiment, technical, and prediction types.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices?.[0]?.message?.content;
          
          if (aiContent) {
            console.log('AI Response received:', aiContent);
            
            try {
              const parsedInsights = sanitizeAndExtractJSON(aiContent);
              if (parsedInsights?.insights && Array.isArray(parsedInsights.insights)) {
                const aiInsights = parsedInsights.insights
                  .filter((i: any) => i.type !== 'news') // Skip news type from AI since we have real news
                  .map((insight: any, index: number) => ({
                    ...insight,
                    id: insight.id || `ai_${symbol}_${Date.now()}_${index}`,
                    symbol,
                    generated_at: new Date().toISOString()
                  }));
                insights.push(...aiInsights);
                console.log(`Generated ${aiInsights.length} AI insights for ${symbol}`);
              }
            } catch (parseError) {
              console.error('Failed to parse AI insights:', parseError);
            }
          }
        } else {
          console.error('DeepSeek API error:', await aiResponse.text());
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
      }
    }

    // Add fallback insights (only non-news) if we have very few insights
    const nonNewsInsights = insights.filter(i => i.type !== 'news');
    if (nonNewsInsights.length < 2) {
      console.log('Adding fallback insights for', symbol);
      const fallbackInsights = generateFallbackInsights(symbol, marketData)
        .filter(i => i.type !== 'news'); // Don't add fallback news
      insights.push(...fallbackInsights);
    }

    // Save insights to database for persistence
    try {
      // Delete old insights for this symbol + timeframe combination
      const { error: deleteError } = await supabase
        .from('market_insights')
        .delete()
        .eq('symbol', symbol)
        .eq('timeframe', timeframe);

      if (deleteError) {
        console.error('Error deleting old insights:', deleteError);
      }

      // Insert new insights
      const insightsToInsert = insights.map(insight => ({
        symbol: insight.symbol || symbol,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        impact: typeof insight.impact === 'string' ? insight.impact.toLowerCase() : insight.impact,
        timeframe: insight.timeframe || timeframe,
        generated_at: new Date(insight.generated_at)
      }));

      const { data: savedInsights, error: insertError } = await supabase
        .from('market_insights')
        .insert(insightsToInsert)
        .select();

      if (insertError) {
        console.error('Error saving insights to database:', insertError);
      } else {
        console.log(`Saved ${savedInsights?.length || 0} insights to database`);
        // Update insights with database IDs
        if (savedInsights) {
          insights = savedInsights.map((saved, idx) => ({
            id: saved.id,
            type: saved.type as any,
            title: saved.title,
            description: saved.description,
            confidence: saved.confidence,
            impact: saved.impact as any,
            symbol: saved.symbol,
            timeframe: saved.timeframe,
            generated_at: saved.generated_at,
            metadata: insights[idx]?.metadata // Preserve metadata from original
          }));
        }
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        symbol,
        timeframe,
        generated_at: new Date().toISOString(),
        source: insights.length > 0 && insights[0].id?.toString().startsWith('ai_') ? 'AI' : 'Database'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Market insights generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate market insights',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function fetchNewsData(symbol: string, timeframe: string, supabase: any) {
  try {
    const daysBack = timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : 2;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    console.log(`[NEWS] Fetching news for ${symbol} from ${fromDate.toISOString()}`);
    
    // Build URL with query parameters for GET request to /news endpoint
    const financialDataUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/financial-data/news`;
    const params = new URLSearchParams({
      symbols: symbol,  // Pass as 'symbols' parameter
      since: fromDate.toISOString(),  // Use 'since' instead of 'fromDate'
      limit: '20'  // Fetch up to 20 news articles
    });

    const response = await fetch(`${financialDataUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NEWS] Financial data returned ${response.status}: ${errorText}`);
      throw new Error(`Financial data returned ${response.status}`);
    }

    const data = await response.json();
    const newsArticles = data?.news || [];
    console.log(`[NEWS] Fetched ${newsArticles.length} news articles for ${symbol}`);
    
    return newsArticles;
  } catch (error) {
    console.error('[NEWS] Error fetching news data:', error);
    return [];
  }
}

function sanitizeAndExtractJSON(text: string): any {
  try {
    // Remove markdown code fences if present
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing error:', error);
    return null;
  }
}

function generateFallbackInsights(symbol: string, marketData: any): MarketInsight[] {
  const baseInsights = [
    {
      id: `fallback_${symbol}_${Date.now()}_1`,
      symbol,
      type: 'technical' as const,
      title: `${symbol} Technical Analysis`,
      description: marketData 
        ? `Current spread at ${marketData.spread} pips. Market is ${marketData.isMarketOpen ? 'active' : 'closed'}. Technical indicators suggest monitoring key support and resistance levels.`
        : `Analyzing current technical conditions for ${symbol}`,
      confidence: 75,
      timeframe: '1H',
      impact: 'Medium' as const,
      priority: 'Medium' as const,
      generated_at: new Date().toISOString()
    },
    {
      id: `fallback_${symbol}_${Date.now()}_2`,
      symbol,
      type: 'prediction' as const,
      title: 'Price Forecast',
      description: `${symbol} showing potential bullish patterns. Technical analysis suggests upward momentum in the medium term.`,
      confidence: 68,
      timeframe: '4H',
      impact: 'High' as const,
      priority: 'Medium' as const,
      generated_at: new Date().toISOString()
    },
    {
      id: `fallback_${symbol}_${Date.now()}_3`,
      symbol,
      type: 'sentiment' as const,
      title: 'Market Sentiment',
      description: `Current market sentiment for ${symbol} is cautiously optimistic. Traders should monitor volatility and consider appropriate position sizing.`,
      confidence: 82,
      timeframe: '1D',
      impact: 'Medium' as const,
      priority: 'High' as const,
      generated_at: new Date().toISOString()
    }
  ];

  return baseInsights;
}

interface MarketInsight {
  id: string;
  symbol: string;
  type: 'sentiment' | 'technical' | 'news' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  generated_at: string;
  metadata?: {
    source?: string;
    url?: string;
    publishedAt?: string;
    sentiment?: string;
    category?: string;
  };
}