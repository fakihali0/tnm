import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Rate limiting: 20 requests per minute per user
const chatAttempts = new Map<string, { count: number; timestamp: number }>();

function checkChatRateLimit(userId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 20; // 20 requests per minute
  
  const attempts = chatAttempts.get(userId) || { count: 0, timestamp: now };
  
  if (now - attempts.timestamp > windowMs) {
    // Reset window
    chatAttempts.set(userId, { count: 1, timestamp: now });
    return { allowed: true };
  }
  
  if (attempts.count >= maxRequests) {
    return {
      allowed: false,
      message: 'Rate limit exceeded. Please wait before sending more messages.'
    };
  }
  
  attempts.count++;
  chatAttempts.set(userId, attempts);
  return { allowed: true };
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;
  for (const [userId, data] of chatAttempts.entries()) {
    if (now - data.timestamp > windowMs * 5) {
      chatAttempts.delete(userId);
    }
  }
}, 300000);

const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const currentYear = new Date().getFullYear();
const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

const TNM_ASSISTANT_PROMPT = `You are TNM AI, an expert financial market analyst specializing in Forex, commodities, indices, and cryptocurrencies.

CURRENT DATE AND TIME CONTEXT:
- Today's date: ${currentDate} (${currentMonth} ${currentYear})
- When users ask about "today", "now", "current", "recent", or mention dates without a year, assume they mean ${currentYear}
- NEVER use years from 2023 or earlier in your responses unless explicitly asked about historical data

CRITICAL - TOOL USAGE:
- YOU MUST ALWAYS use tools to fetch live market data before providing analysis
- NEVER provide analysis based on assumptions - ALWAYS call the appropriate tool first
- If you receive data with source:"demo", mention: "📊 Note: Using demonstration data for illustration"
- If you receive data with source:"live", you can proceed with confidence

TOOL SELECTION - Choose the RIGHT tool based on the CURRENT user message:
1. For PRICE queries (e.g., "What is the price of gold?", "Current EURUSD price", "How much is BTC?", "What's the quote for...?"): 
   → Call getPrice(symbol) FIRST
2. For TECHNICAL ANALYSIS (e.g., "Support/resistance", "Should I buy/sell?", "Technical analysis", "Chart analysis"):
   → Call getCandles(symbol, timeframe, limit) FIRST
3. For NEWS/HEADLINES (e.g., "Top headlines", "Latest news", "Market stories", "Summarize news about..."):
   → Call getNews(query, limit)
4. For ECONOMIC CALENDAR (e.g., "Economic events", "What events today?", "Calendar"):
   → Call getEconomicCalendar()

IMPORTANT: Always base tool selection on the CURRENT user message, NOT conversation history!

When analyzing markets:
1. FIRST: Call the appropriate tool based on the query type above
2. For technical analysis: Call getCandles(symbol, timeframe, limit) to get:
   - Price action (OHLCV candles)
   - Technical indicators (EMA, RSI, MACD, BB, ATR)
   - Support/Resistance levels (Pivot Points, Swing Levels, Fibonacci)
3. THEN: Analyze the returned data using the calculated indicators and S/R levels
4. PROVIDE: Clear, actionable insights based on actual calculated levels

CRITICAL - Support/Resistance Levels:
- Use pivotPoints (standard pivot, R1-R3, S1-S3) for intraday levels
- Use supportResistance (swing highs/lows) for key price action levels
- Use fibonacci (retracement levels) for trend-based levels
- NEVER fabricate or estimate S/R levels - always use the calculated data

Your responses should be:
- Data-driven and specific
- Include concrete price levels from the indicators response
- Mention data source when using demo data
- Professional yet conversational

EXAMPLES:
User: "What is the price of gold now?"
→ Tool: getPrice("XAUUSD")
→ Response: "The current gold (XAUUSD) price is $3,997.03 (bid: $3,997.02, ask: $3,997.38). [Data source: Yahoo Finance, live]"

User: "Summarize top 3 gold headlines"
→ Tool: getNews("gold", 3)
→ Response: "[List actual news headlines with timestamps]"

User: "Support and resistance for EURUSD H1"
→ Tool: getCandles("EURUSD", "H1", 100)
→ Response: "[Analyze S/R levels from pivotPoints and supportResistance in the response]"

Remember: Users trust you for REAL analysis with actual calculated levels, not generic advice!`;

// Demo data constants for fallback
const DEMO_DATA = {
  XAUUSD: { price: 2650, bid: 2649.82, ask: 2650.18, spread: 0.35 },
  EURUSD: { price: 1.0850, bid: 1.08495, ask: 1.08505, spread: 0.0008 },
  GBPUSD: { price: 1.2950, bid: 1.29494, ask: 1.29506, spread: 0.0012 }
};

function generateDemoCandles(symbol: string, timeframe: string, limit: number): any[] {
  const demo = DEMO_DATA[symbol as keyof typeof DEMO_DATA] || DEMO_DATA.EURUSD;
  const now = Math.floor(Date.now() / 1000);
  const tfSeconds = timeframe === 'M5' ? 300 : timeframe === 'M15' ? 900 : timeframe === 'H1' ? 3600 : timeframe === 'H4' ? 14400 : 86400;
  
  return Array.from({ length: limit }, (_, i) => {
    const variance = (Math.random() - 0.5) * 0.02; // ±1% random variation
    const basePrice = demo.price * (1 + variance);
    return {
      time: now - ((limit - i) * tfSeconds),
      open: basePrice * 0.999,
      high: basePrice * 1.001,
      low: basePrice * 0.998,
      close: basePrice,
      volume: Math.floor(Math.random() * 10000) + 5000
    };
  });
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "getPrice",
      description: "Get latest quote for symbol",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string", description: "e.g. XAUUSD, EURUSD" } },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getCandles",
      description: "Fetch OHLCV candles",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          timeframe: { type: "string", enum: ["M5","M15","H1","H4","D1","W1"] },
          limit: { type: "integer", default: 500 }
        },
        required: ["symbol", "timeframe"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getEconomicCalendar",
      description: "Economic events (Asia/Beirut time)",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "YYYY-MM-DD" },
          to: { type: "string", description: "YYYY-MM-DD" },
          importance: { type: "string", enum: ["low","medium","high"] }
        },
        required: ["from", "to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getNews",
      description: "Search news",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "integer", default: 10 }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "positionSize",
      description: "Calculate position size",
      parameters: {
        type: "object",
        properties: {
          balance: { type: "number" },
          riskPercent: { type: "number" },
          stopPips: { type: "number" },
          pair: { type: "string" }
        },
        required: ["balance", "riskPercent", "stopPips", "pair"]
      }
    }
  }
];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check rate limit (20 requests per minute per user)
    const rateLimitCheck = checkChatRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: rateLimitCheck.message,
        errorType: 'RATE_LIMIT',
        retryAfter: 60,
        suggestion: 'Please wait a minute before sending more messages.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, messages, user_language = 'en' } = await req.json();
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
    
    // SECURITY: Input validation to prevent prompt injection attacks
    // Support both single message and conversation history
    let conversationMessages = messages || [{ role: 'user', content: message }];
    
    // Limit conversation history to prevent context stuffing attacks (max 15 messages)
    if (conversationMessages.length > 15) {
      console.log(`Truncating conversation from ${conversationMessages.length} to 15 messages`);
      conversationMessages = conversationMessages.slice(-15);
    }
    
    // Sanitize messages: clamp length to 3000 chars to avoid runtime errors
    conversationMessages = conversationMessages.map((msg: any, idx: number) => {
      if (!msg || typeof msg.content !== 'string') {
        throw new Error('Invalid message format');
      }
      if (msg.content.length > 3000) {
        console.warn(`Truncating message ${idx} from ${msg.content.length} to 3000 chars`);
        return { ...msg, content: msg.content.slice(0, 3000) };
      }
      return msg;
    });
    
    const latestMessage = message || conversationMessages[conversationMessages.length - 1]?.content || '';
    
    // Log sanitized query (never echo full user input in errors)
    console.log('User query length:', latestMessage.length);
    console.log('Conversation length:', conversationMessages.length);

    // Detect if query needs live data
    const needsLiveData = /price|quote|level|support|resistance|technical|analysis|compare|today|now|current|candle|indicator|rsi|macd|ema|bollinger|atr|calendar|event|news|headlines?|articles?|stor(y|ies)|reports?|updates?|move|market/i.test(latestMessage);
    
    // Let AI choose appropriate tool instead of forcing it
    const toolChoice = "auto";
    
    console.log('Needs live data:', needsLiveData);
    
    // Log news query detection
    const isNewsQuery = /news|headlines?|articles?|stor(y|ies)|reports?|updates?/i.test(latestMessage);
    if (isNewsQuery) {
      console.log('News query detected - should call getNews tool');
    }
    
    const requestStartTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: TNM_ASSISTANT_PROMPT },
          ...conversationMessages
        ],
        tools: TOOLS,
        tool_choice: toolChoice
      })
    });

    const aiResponse = await response.json();
    const openaiLatency = Date.now() - requestStartTime;
    console.log(`OpenAI API latency: ${openaiLatency}ms`);
    
    let assistantMsg = aiResponse.choices[0].message;
    
    // Retry logic: if no tool calls but live data is expected
    if (!assistantMsg.tool_calls && needsLiveData) {
      console.warn('RETRY: AI did not call tools for live data query');
      
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: TNM_ASSISTANT_PROMPT + "\n\nCRITICAL: User is asking about live market data. You MUST call appropriate tools. DO NOT respond without calling tools first." 
            },
            ...conversationMessages
          ],
          tools: TOOLS,
          tool_choice: "required"
        })
      });
      
      if (retryResponse.ok) {
        const retryJson = await retryResponse.json();
        assistantMsg = retryJson.choices[0].message;
        console.log('Retry successful - tools called');
      }
    }
    
    console.log('AI response:', JSON.stringify(assistantMsg, null, 2));

    if (assistantMsg.tool_calls?.length > 0) {
      console.log('Tool calls:', assistantMsg.tool_calls.map(tc => tc.function.name));
      const toolResults = await Promise.all(
        assistantMsg.tool_calls.map(async (tc: any) => ({
          tool_call_id: tc.id,
          role: 'tool',
          name: tc.function.name,
          content: JSON.stringify(await executeTool(tc.function.name, JSON.parse(tc.function.arguments)))
        }))
      );

      // Compute S/R summary from tool results
      let srSummary: any = null;
      for (const tr of toolResults) {
        if (tr.name === 'getCandles') {
          try {
            const data = JSON.parse(tr.content);
            if (data.indicators && data.latest) {
              srSummary = computeSRSummary(data);
              console.log(`[SR] ${data.symbol} ${data.timeframe} | price=${srSummary.currentPrice}, S=[${srSummary.selected.support.join(', ')}], R=[${srSummary.selected.resistance.join(', ')}], source=${data.source}`);
            }
          } catch (e) {
            console.error('[SR] Failed to compute S/R summary:', e.message);
          }
        }
      }

      // Phase 3: Detect tool execution errors
      const hasToolErrors = toolResults.some(tr => {
        try {
          const content = JSON.parse(tr.content);
          return content.error && content.provider_error;
        } catch { return false; }
      });

      if (hasToolErrors) {
        const errorDetails = toolResults
          .filter(tr => {
            try { return JSON.parse(tr.content).error; } catch { return false; }
          })
          .map(tr => {
            try {
              const content = JSON.parse(tr.content);
              return { tool: tr.name, error: content.error };
            } catch { return null; }
          })
          .filter(Boolean);
        
        console.error('[DATA_PROVIDER_ERROR] Tool execution failed:', errorDetails);
        
        return new Response(
          JSON.stringify({ 
            error: 'Unable to fetch live market data. The data provider may be temporarily unavailable.',
            errorType: 'DATA_PROVIDER_ERROR',
            suggestion: 'Please try again in a few moments. If the issue persists, check your FINNHUB_API_KEY configuration or contact support.',
            toolErrors: errorDetails,
            timestamp: toBeirut(new Date())
          }),
          { 
            status: 503, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Inject S/R data summary if available
      const finalMessages: any[] = [
        { role: 'system', content: TNM_ASSISTANT_PROMPT },
        ...conversationMessages,
        assistantMsg,
        ...toolResults
      ];

      if (srSummary) {
        finalMessages.push({
          role: 'system',
          content: `CRITICAL - USE THIS EXACT DATA:\n${JSON.stringify(srSummary, null, 2)}\n\nYou MUST include the selected.support and selected.resistance values in your answer. Do not invent numbers. These are calculated from real price action.`
        });
      }

      const finalResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: finalMessages
        })
      });

      const final = await finalResp.json();
      let finalContent = final.choices[0].message.content;
      
      const totalLatency = Date.now() - requestStartTime;
      console.log(`Total request time: ${totalLatency}ms`);
      console.log(`Token usage: ${final.usage?.total_tokens || 0} tokens`);
      
      // Validate S/R data is included in response
      if (srSummary && needsLiveData) {
        const includesSR = srSummary.selected.support.some((s: number) => finalContent.includes(s.toString())) ||
                           srSummary.selected.resistance.some((r: number) => finalContent.includes(r.toString()));
        
        if (!includesSR) {
          console.warn('[SR] AI did not include calculated S/R levels, using fallback');
          finalContent = buildSRFallbackResponse(srSummary, finalContent);
        }
        
        // Always append Data used block for transparency
        finalContent += `\n\n---\n\n**📊 Data used:**\n`;
        finalContent += `- **Source:** ${srSummary.source}\n`;
        finalContent += `- **Symbol:** ${srSummary.symbol} (${srSummary.timeframe})\n`;
        finalContent += `- **Current Price:** ${srSummary.currentPrice}\n`;
        finalContent += `- **Support Levels:** ${srSummary.selected.support.join(', ')}\n`;
        finalContent += `- **Resistance Levels:** ${srSummary.selected.resistance.join(', ')}\n`;
        if (srSummary.pivotPoints) {
          finalContent += `- **Pivot Point:** ${srSummary.pivotPoints.pivot} (R1: ${srSummary.pivotPoints.r1}, R2: ${srSummary.pivotPoints.r2}, R3: ${srSummary.pivotPoints.r3} | S1: ${srSummary.pivotPoints.s1}, S2: ${srSummary.pivotPoints.s2}, S3: ${srSummary.pivotPoints.s3})\n`;
        }
      }
      
      // Quality validation: Check for placeholder data patterns
      const hasPlaceholderData = /\$1,800|\$1,875|101\.00|104\.00|~50\)|around \$|approximately|estimated at/gi.test(finalContent);
      if (hasPlaceholderData && needsLiveData) {
        console.error('QUALITY FAILURE: Response contains placeholder/estimated data');
        return new Response(
          JSON.stringify({ 
            error: 'AI returned estimated data instead of live data. Please try again.',
            errorType: 'PLACEHOLDER_DATA',
            suggestion: 'Try asking a more specific question about a particular symbol.'
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          response: finalContent, 
          type: 'analysis',
          toolsCalled: assistantMsg.tool_calls?.map(tc => tc.function.name) || [],
          tokensUsed: final.usage?.total_tokens || 0,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.warn('WARNING: No tool calls made for query:', latestMessage);
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMsg.content, 
        type: 'general',
        toolsCalled: [],
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: sanitizeError(error),
        errorType: 'INTERNAL_ERROR',
        suggestion: 'Please try again. If the issue persists, contact support.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Map query to symbols for news fetching
function mapQueryToSymbols(query: string): string {
  const lowerQuery = query.toLowerCase();
  const symbolMap: Record<string, string> = {
    'gold': 'XAUUSD,GC=F',
    'silver': 'XAGUSD,SI=F',
    'oil': 'CL=F,BRN',
    'crude': 'CL=F',
    'bitcoin': 'BTCUSD,BTC-USD',
    'ethereum': 'ETHUSD,ETH-USD'
  };
  
  for (const [key, symbols] of Object.entries(symbolMap)) {
    if (lowerQuery.includes(key)) {
      console.log(`[SYMBOL_MAP] "${query}" → ${symbols}`);
      return symbols;
    }
  }
  
  return '';
}

async function executeTool(name: string, args: any) {
  try {
    console.log(`[TOOL] Executing: ${name}`, JSON.stringify(args));
    
    switch (name) {
      case 'getPrice': {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/financial-data/quotes?symbols=${args.symbol}`);
        const d = await r.json();
        console.log(`[TOOL] getPrice result for ${args.symbol}:`, JSON.stringify(d).substring(0, 300));
        
        if (!r.ok) {
          console.error(`[TOOL] getPrice HTTP error: ${r.status} ${r.statusText}`);
          return { error: `Data provider error: ${r.status}`, provider_error: true };
        }
        
        return d[0] ? { ...d[0], timestamp: toBeirut(new Date()) } : { error: 'No price data available', provider_error: true };
      }
      case 'getCandles': {
        console.log(`Fetching candles: ${args.symbol}, ${args.timeframe}, limit=${args.limit||500}`);
        
        const r = await fetch(`${SUPABASE_URL}/functions/v1/financial-data/candles?symbol=${args.symbol}&timeframe=${args.timeframe}&limit=${args.limit||500}`);
        
        if (!r.ok) {
          console.error(`Candles API HTTP error: ${r.status}`);
          // Use demo data
          const demoCandles = generateDemoCandles(args.symbol, args.timeframe, args.limit || 500);
          const ir = await fetch(`${SUPABASE_URL}/functions/v1/technical-indicators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candles: demoCandles, indicators: ['EMA20','EMA50','EMA200','RSI14','MACD','ATR','BB','PIVOT','SR','FIB'] })
          });
          const ind = await ir.json();
          
          return {
            symbol: args.symbol,
            timeframe: args.timeframe,
            latest: demoCandles[demoCandles.length-1],
            indicators: ind.indicators,
            timestamp: toBeirut(new Date()),
            source: 'demo',
            note: 'Using demonstration data for illustration'
          };
        }
        
        const d = await r.json();
        
        if (!d.success || !d.candles || d.candles.length === 0) {
          console.log(`No candle data returned, using demo data for ${args.symbol}`);
          // Use demo data
          const demoCandles = generateDemoCandles(args.symbol, args.timeframe, args.limit || 500);
          const ir = await fetch(`${SUPABASE_URL}/functions/v1/technical-indicators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candles: demoCandles, indicators: ['EMA20','EMA50','EMA200','RSI14','MACD','ATR','BB','PIVOT','SR','FIB'] })
          });
          const ind = await ir.json();
          
          return {
            symbol: args.symbol,
            timeframe: args.timeframe,
            latest: demoCandles[demoCandles.length-1],
            indicators: ind.indicators,
            timestamp: toBeirut(new Date()),
            source: 'demo',
            note: 'Using demonstration data for illustration'
          };
        }
        
        // Real data path
            const ir = await fetch(`${SUPABASE_URL}/functions/v1/technical-indicators`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ candles: d.candles, indicators: ['EMA20','EMA50','EMA200','RSI14','MACD','ATR','BB','PIVOT','SR','FIB'] })
            });
        const ind = await ir.json();
        
        console.log(`Candles fetched successfully: ${d.candles.length} candles`);
        
        return {
          symbol: args.symbol,
          timeframe: args.timeframe,
          latest: d.candles[d.candles.length-1],
          indicators: ind.indicators,
          timestamp: toBeirut(new Date()),
          source: 'live'
        };
      }
      case 'getEconomicCalendar': {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/financial-data/calendar?from=${args.from}&to=${args.to}${args.importance?'&importance='+args.importance:''}`);
        const d = await r.json();
        console.log(`[TOOL] getEconomicCalendar result:`, JSON.stringify(d).substring(0, 200));
        
        if (!r.ok) {
          console.error(`[TOOL] getEconomicCalendar HTTP error: ${r.status}`);
          return { error: `Calendar data unavailable: ${r.status}`, provider_error: true };
        }
        
        return { events: d.events?.map((e:any) => ({...e, time: toBeirut(new Date(e.time))})) || [], timezone: 'Asia/Beirut', timestamp: toBeirut(new Date()) };
      }
      case 'getNews': {
        const symbols = mapQueryToSymbols(args.query || '');
        let url = `${SUPABASE_URL}/functions/v1/financial-data/news?query=${encodeURIComponent(args.query)}&limit=${args.limit||10}`;
        if (symbols) {
          url += `&symbols=${encodeURIComponent(symbols)}`;
        }
        console.log(`[TOOL] getNews URL: ${url}`);
        const r = await fetch(url);
        const d = await r.json();
        console.log(`[TOOL] getNews result:`, JSON.stringify(d));
        
        if (!r.ok) {
          console.error(`[TOOL] getNews HTTP error: ${r.status}`);
          return { error: `News data unavailable: ${r.status}`, provider_error: true };
        }
        
        return { news: d.news?.map((n:any) => ({...n, published_at: toBeirut(new Date(n.published_at))})) || [], timestamp: toBeirut(new Date()) };
      }
      case 'positionSize': {
        const pip = args.pair.includes('JPY') ? 0.01 : 0.0001;
        const risk = args.balance * (args.riskPercent / 100);
        const lot = risk / (args.stopPips * pip * 100000);
        console.log(`[TOOL] positionSize calculated: ${lot.toFixed(2)} lots`);
        return { lot_size: parseFloat(lot.toFixed(2)), risk_amount: risk, timestamp: toBeirut(new Date()) };
      }
      default: 
        console.error(`[TOOL] Unknown tool requested: ${name}`);
        return { error: 'Unknown tool' };
    }
  } catch (e) {
    console.error(`[TOOL] Execution error for ${name}:`, e.message, e.stack);
    return { error: `Tool execution failed: ${e.message}`, provider_error: true };
  }
}

function toBeirut(d: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Beirut',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
}

function computeSRSummary(data: any) {
  const currentPrice = data.latest.close;
  const ind = data.indicators;
  
  const supportCandidates: number[] = [];
  const resistanceCandidates: number[] = [];
  
  // Add pivot points
  if (ind.pivotPoints) {
    const pp = ind.pivotPoints;
    if (pp.s1 < currentPrice) supportCandidates.push(pp.s1);
    if (pp.s2 < currentPrice) supportCandidates.push(pp.s2);
    if (pp.s3 < currentPrice) supportCandidates.push(pp.s3);
    if (pp.r1 > currentPrice) resistanceCandidates.push(pp.r1);
    if (pp.r2 > currentPrice) resistanceCandidates.push(pp.r2);
    if (pp.r3 > currentPrice) resistanceCandidates.push(pp.r3);
  }
  
  // Add swing levels
  if (ind.supportResistance) {
    const sr = ind.supportResistance;
    sr.support?.forEach((s: number) => { if (s < currentPrice) supportCandidates.push(s); });
    sr.resistance?.forEach((r: number) => { if (r > currentPrice) resistanceCandidates.push(r); });
  }
  
  // Add fibonacci levels
  if (ind.fibonacci) {
    const fib = ind.fibonacci;
    [fib.fib_236, fib.fib_382, fib.fib_50, fib.fib_618, fib.fib_786].forEach((f: number) => {
      if (f < currentPrice) supportCandidates.push(f);
      else if (f > currentPrice) resistanceCandidates.push(f);
    });
  }
  
  // Sort and pick nearest levels
  supportCandidates.sort((a, b) => b - a); // Descending (nearest first)
  resistanceCandidates.sort((a, b) => a - b); // Ascending (nearest first)
  
  return {
    symbol: data.symbol,
    timeframe: data.timeframe,
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    pivotPoints: ind.pivotPoints || null,
    swingLevels: ind.supportResistance || null,
    fibonacci: ind.fibonacci || null,
    selected: {
      support: supportCandidates.slice(0, 3).map((s: number) => parseFloat(s.toFixed(2))),
      resistance: resistanceCandidates.slice(0, 3).map((r: number) => parseFloat(r.toFixed(2)))
    },
    source: data.source
  };
}

function buildSRFallbackResponse(srSummary: any, aiContent: string): string {
  const header = `📊 **${srSummary.symbol} ${srSummary.timeframe}** (${srSummary.source === 'live' ? 'Live Data' : 'Demo Data'})\n\n`;
  const price = `**Current Price:** ${srSummary.currentPrice}\n\n`;
  
  const support = `**Support Levels:**\n${srSummary.selected.support.map((s: number, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n`;
  const resistance = `**Resistance Levels:**\n${srSummary.selected.resistance.map((r: number, i: number) => `${i + 1}. ${r}`).join('\n')}\n\n`;
  
  const pivot = srSummary.pivotPoints 
    ? `**Pivot Points:** Pivot: ${srSummary.pivotPoints.pivot}, R1: ${srSummary.pivotPoints.r1}, R2: ${srSummary.pivotPoints.r2}, S1: ${srSummary.pivotPoints.s1}, S2: ${srSummary.pivotPoints.s2}\n\n`
    : '';
  
  return header + price + support + resistance + pivot + (aiContent ? `\n---\n${aiContent}` : '');
}
