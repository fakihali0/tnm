import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { useAccountStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { useChatStore, type ChatMessage } from '@/store/chat';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useToast } from '@/hooks/use-toast';
import { analytics } from '@/services/analytics';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/useRTL';
import { 
  MessageSquare,
  Send, 
  Brain, 
  User,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Clock,
  Copy,
  RefreshCw
} from 'lucide-react';


export const AIChatAssistant = () => {
  const { selectedAccount } = useAccountStore();
  const { t, i18n } = useTranslation();
  const rtl = useRTL();
  const { currentLanguage } = useLocalizedPath();
  const notifications = useAdvancedNotifications();
  const { toast } = useToast();
  const triggerSystemAlert = (message: string) => {
    notifications.addNotification({
      title: 'AI Assistant',
      message,
      type: 'system',
      priority: 'low',
      category: 'info'
    });
  };
  
  const [inputMessage, setInputMessage] = useState('');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingElapsedSeconds, setLoadingElapsedSeconds] = useState(0);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use global chat store
  const { 
    setActiveConversation, 
    addMessage, 
    setLoading, 
    clearConversation,
    getMessages, 
    getIsLoading 
  } = useChatStore();
  
  // Create conversation ID based on selected account
  const conversationId = selectedAccount ? `account-${selectedAccount.id}` : 'global';
  
  // Get current conversation state
  const messages = getMessages(conversationId);
  const isLoading = getIsLoading(conversationId);
  
  // Set active conversation when component mounts or account changes
  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  const quickQuestions = currentLanguage === 'ar' ? [
    "تحليل فني للذهب الآن (H1)",
    "أفضل مستويات الدعم والمقاومة للذهب اليوم؟",
    "متى موعد بيانات NFP؟ (توقيت بيروت)",
    "لخص آخر 3 أخبار للذهب",
    "احسب حجم المركز: رصيد 5000$، مخاطرة 1%، ستوب 120 نقطة على اليورو/دولار",
    "قارن حركة الذهب ومؤشر الدولار اليوم"
  ] : [
    "Gold technical now (H1)",
    "Best support/resistance for XAUUSD today?",
    "When is NFP? (Beirut time)",
    "Summarize top 3 gold headlines",
    "Position size: balance 5000$, risk 1%, stop 120 pips EURUSD",
    "Compare XAUUSD and DXY moves today"
  ];

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      const welcomeContent = currentLanguage === 'ar' ? 
        `🚀 **مساعد TNM للتداول** 🚀

أنا TNM Assistant - مساعدك الذكي للتداول مع تركيز خاص على السوق العربي.

**قدراتي:**
📊 **تحليل فني مباشر**: أحصل على بيانات حية للذهب، العملات، المؤشرات
📅 **الأجندة الاقتصادية**: جميع الأوقات بتوقيت بيروت
📰 **أخبار السوق**: آخر العناوين والتحليلات
🧮 **حسابات المخاطر**: حجم المركز والستوب لوس المثالي
📈 **مستويات فنية**: دعم، مقاومة، EMA، RSI، MACD

${selectedAccount ? '✅ **الحساب متصل**: تحليل شخصي متاح' : '⚠️ **ربط الحساب**: للحصول على تحليل شخصي'}

**جرب:**
• "تحليل فني للذهب الآن (H1)"
• "متى موعد NFP؟ (توقيت بيروت)"
• "آخر أخبار الذهب"

⚠️ **تنبيه**: تداول العقود مقابل الفروقات ينطوي على مخاطر عالية. المعلومات هنا للتعليم فقط.` :
        `🚀 **TNM Trading Assistant** 🚀

I'm TNM Assistant - your smart trading companion with real-time market insights.

**My Capabilities:**
📊 **Live Technical Analysis**: Real-time data for gold, forex, indices
📅 **Economic Calendar**: All times in Beirut timezone
📰 **Market News**: Latest headlines and analysis
🧮 **Risk Calculations**: Optimal position sizing and stop loss
📈 **Technical Levels**: Support, resistance, EMAs, RSI, MACD

${selectedAccount ? '✅ **Account Connected**: Personalized analysis available' : '⚠️ **Connect Account**: For personalized insights'}

**Try asking:**
• "Gold technical now (H1)"
• "When is NFP? (Beirut time)"
• "Latest gold headlines"

⚠️ **Risk Note**: Trading CFDs involves high risk. Information is educational only.`;

      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date().toISOString(),
        type: 'welcome'
      };
      addMessage(conversationId, welcomeMessage);
    }
  }, [selectedAccount, messages.length, conversationId, addMessage, currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // Track loading time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && loadingStartTime) {
      interval = setInterval(() => {
        setLoadingElapsedSeconds(Math.floor((Date.now() - loadingStartTime) / 1000));
      }, 1000);
    } else {
      setLoadingElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, loadingStartTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'general'
    };

    addMessage(conversationId, userMessage);
    setInputMessage('');
    setLoading(conversationId, true);
    setLoadingStartTime(Date.now());
    
    // Track analytics
    analytics.track('ai_chat_message_sent', {
      conversationId,
      messageLength: messageText.length,
      hasAccount: !!selectedAccount
    });

    try {
      // Determine analysis type based on message content
      const analysisType = determineAnalysisType(messageText);
      
      // Effective language detection - detect Arabic in message or use i18n preference
      const langFromI18n = i18n.resolvedLanguage?.startsWith('ar') ? 'ar' : 'en';
      const messageHasArabic = /[\u0600-\u06FF]/.test(messageText);
      const effectiveLanguage = messageHasArabic ? 'ar' : langFromI18n;
      
      // Optimize conversation context: filter welcome messages & use sliding window
      const optimizeConversationContext = (msgs: ChatMessage[]): any[] => {
        const relevantMessages = msgs.filter(m => m.type !== 'welcome');
        const recentMessages = relevantMessages.slice(-10); // Last 10 messages only
        
        const estimatedTokens = recentMessages.reduce((total, msg) => {
          return total + Math.ceil(msg.content.length / 4);
        }, 0);
        
        if (estimatedTokens > 6000) {
          toast({
            title: currentLanguage === 'ar' ? 'محادثة طويلة' : 'Long Conversation',
            description: currentLanguage === 'ar' 
              ? 'فكر في بدء محادثة جديدة لأداء أفضل.'
              : 'Consider starting a new conversation for better performance.',
            variant: 'default'
          });
        }
        
        return recentMessages.map(m => ({
          role: m.role,
          content: m.content
        }));
      };
      
      const conversationHistory = optimizeConversationContext([...messages, userMessage]);

      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: { 
          message: messageText,
          messages: conversationHistory,
          account_id: selectedAccount?.id || selectedAccount,
          context: 'enhanced_trading_assistant',
          analysis_type: analysisType,
          user_language: effectiveLanguage
        }
      });

      if (error) throw error;
      
      // Phase 4: Handle DATA_PROVIDER_ERROR
      if (data?.errorType === 'DATA_PROVIDER_ERROR') {
        toast({
          title: currentLanguage === 'ar' ? '⚠️ بيانات السوق غير متوفرة' : '⚠️ Market Data Unavailable',
          description: data.suggestion || (currentLanguage === 'ar' 
            ? 'غير قادر على جلب بيانات السوق الحية في الوقت الحالي.'
            : 'Unable to fetch live market data right now.'),
          variant: "default",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => sendMessage(messageText)}
              className="text-xs"
            >
              {currentLanguage === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
          )
        });
        
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: currentLanguage === 'ar'
            ? `⚠️ غير قادر على جلب بيانات السوق الحية في الوقت الحالي. قد يكون ذلك بسبب:\n\n• حدود معدل استخدام API\n• مشاكل مؤقتة في الخدمة\n• تكوين API مفقود\n\nيرجى المحاولة مرة أخرى بعد قليل، أو اتصل بالدعم إذا استمرت المشكلة.`
            : `⚠️ I'm unable to fetch live market data at the moment. This could be due to:\n\n• API rate limits\n• Temporary service issues\n• Missing API configuration (FINNHUB_API_KEY)\n\nPlease try again in a moment, or contact support if this continues.`,
          timestamp: new Date().toISOString(),
          type: 'general'
        };
        addMessage(conversationId, errorMessage);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.response || generateFallbackResponse(messageText),
        timestamp: new Date().toISOString(),
        type: data?.type || 'general'
      };

      addMessage(conversationId, assistantMessage);
      
      // Track successful response
      analytics.track('ai_chat_response_received', {
        conversationId,
        responseTime: Date.now() - loadingStartTime!,
        toolsCalled: data?.toolsCalled || [],
        tokensUsed: data?.tokensUsed || 0,
        responseType: data?.type
      });
      
      // Show enhanced notification for successful AI responses
      if (data?.response && data.type !== 'fallback') {
        triggerSystemAlert(`AI analysis completed`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Parse structured error response
      const errorData = error?.response?.data || error?.data;
      
      if (errorData?.errorType === 'RATE_LIMIT') {
        toast({
          title: currentLanguage === 'ar' ? 'تباطأ!' : 'Slow down!',
          description: `${errorData.error} ${currentLanguage === 'ar' ? 'انتظر' : 'Please wait'} ${errorData.retryAfter || 60} ${currentLanguage === 'ar' ? 'ثانية' : 'seconds'}.`,
          variant: 'default'
        });
        
        analytics.track('ai_chat_error', {
          conversationId,
          errorType: 'RATE_LIMIT'
        });
        return; // Don't add fallback message
      }
      
      if (errorData?.errorType === 'PLACEHOLDER_DATA') {
        toast({
          title: currentLanguage === 'ar' ? 'مشكلة في جودة البيانات' : 'Data Quality Issue',
          description: errorData.suggestion || (currentLanguage === 'ar' 
            ? 'إعادة المحاولة بالبيانات الحية...'
            : 'Retrying with live data...'),
          variant: 'default'
        });
        
        // Auto-retry once
        setTimeout(() => sendMessage(messageText), 2000);
        return;
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorData?.suggestion || generateFallbackResponse(messageText),
        timestamp: new Date().toISOString(),
        type: 'general'
      };

      addMessage(conversationId, errorMessage);
      
      toast({
        title: currentLanguage === 'ar' ? 'خطأ' : 'Error',
        description: errorData?.error || (currentLanguage === 'ar' 
          ? 'فشل في الحصول على رد الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
          : 'Failed to get AI response. Please try again.'),
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm" onClick={() => sendMessage(messageText)}>
            {currentLanguage === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        )
      });
      
      analytics.track('ai_chat_error', {
        conversationId,
        errorType: errorData?.errorType || 'UNKNOWN',
        errorMessage: errorData?.error || error.message
      });
    } finally {
      setLoading(conversationId, false);
      setLoadingStartTime(null);
    }
  };

  const determineAnalysisType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Mathematical analysis triggers
    if (lowerMessage.includes('calculate') || 
        lowerMessage.includes('position size') ||
        lowerMessage.includes('risk') ||
        lowerMessage.includes('probability') ||
        lowerMessage.includes('percentage') ||
        lowerMessage.includes('ratio') ||
        lowerMessage.includes('formula')) {
      return 'mathematical';
    }
    
    // Strategic analysis (default)
    return 'strategic';
  };

  const generateFallbackResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('analyze')) {
      return "Based on your recent trading activity, I can see some interesting patterns. Your trading performance shows a strong profit factor, which indicates good risk management. However, there's room for improvement in trade selection consistency. Would you like me to dive deeper into specific metrics?";
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('eurusd') || lowerMessage.includes('conditions')) {
      return "Current market conditions show mixed sentiment with moderate volatility. For EUR/USD specifically, we're seeing consolidation around key support levels. The upcoming economic announcements could provide direction. I recommend monitoring the 1.0900-1.1000 range for breakout opportunities.";
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('exposure')) {
      return "Your current risk exposure appears manageable based on your account settings. However, I notice you might benefit from better position sizing on certain trades. Consider implementing a maximum risk per trade rule of 1-2% of your account balance for optimal risk management.";
    }
    
    if (lowerMessage.includes('improve') || lowerMessage.includes('win rate')) {
      return "To improve your win rate, focus on these key areas: 1) Wait for higher probability setups with clear risk/reward ratios, 2) Improve your entry timing using multiple timeframe analysis, 3) Consider scaling into positions rather than entering all at once. Your current strategy shows promise with some fine-tuning.";
    }
    
    return "I understand you're looking for trading insights. While I'd love to provide more specific analysis, I'm currently working with limited data. For the most accurate and personalized advice, please ensure your trading account is connected and has recent trading data. Is there a specific aspect of trading you'd like to discuss?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (role: string, type?: string) => {
    if (role === 'user') return User;
    if (type === 'analysis') return BarChart3;
    if (type === 'insight') return TrendingUp;
    if (type === 'alert') return AlertTriangle;
    return Brain;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" dir={rtl.dir}>
      {/* Chat Header */}
      <Card className="shrink-0">
        <CardHeader className="py-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            {currentLanguage === 'ar' ? 'مساعد التداول الذكي' : 'AI Trading Assistant'}
            <Badge
              variant="secondary"
              className="gap-1 text-xs ms-3 px-2.5 py-1 shrink-0"
            >
              <Brain className="h-3 w-3" />
              AI
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground text-start">
            {currentLanguage === 'ar' 
              ? 'تحليل متقدم للسوق والمخاطر والرؤى الشخصية'
              : 'Advanced market analysis, risk assessment, and insights'
            }
          </p>
        </CardHeader>
      </Card>

      <div className="h-2" />

      {/* Quick Questions */}
      <Card className="shrink-0">
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-medium">
            {currentLanguage === 'ar' ? 'أسئلة سريعة' : 'Quick Questions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(question)}
                disabled={isLoading}
                className="flex-shrink-0 min-w-[160px] text-xs sm:text-sm h-auto px-4 py-2.5 leading-snug text-start whitespace-normal rounded-md me-2 line-clamp-2"
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="h-4" />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {currentLanguage === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'ar' 
                      ? 'اختر سؤالاً سريعاً أعلاه أو اكتب استفسارك الخاص للبدء'
                      : 'Choose a quick question above or type your own to get started'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => {
                const IconComponent = getMessageIcon(message.role, message.type);
                const isUserMessage = message.role === 'user';

                return (
                  <motion.div
                    key={`${conversationId}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'flex items-start gap-3 group relative',
                      isUserMessage && 'justify-end'
                    )}
                  >
                    {!isUserMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary">
                          <IconComponent className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'flex flex-1 flex-col gap-1 max-w-full sm:max-w-[85%]',
                        isUserMessage ? 'items-end text-right' : 'items-start'
                      )}
                      onMouseEnter={() => setHoveredMessageIndex(index)}
                      onMouseLeave={() => setHoveredMessageIndex(null)}
                    >
                      {message.role === 'assistant' && (
                        <>
                          {(message.content.includes('source:"demo"') || message.content.includes('demonstration data')) && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-600 mb-2 self-start"
                            >
                              📊 {t('common:demoData')}
                            </Badge>
                          )}
                          {message.content.includes('source:"live"') && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600 mb-2 self-start"
                            >
                              ✓ {t('common:liveData')}
                            </Badge>
                          )}
                        </>
                      )}

                      <div
                        className={cn(
                          'relative w-fit max-w-full rounded-lg text-start break-words',
                          isUserMessage
                            ? 'self-end bg-primary text-primary-foreground rounded-ts-sm p-3 pe-8'
                            : 'self-start bg-muted rounded-te-sm p-3 ps-0'
                        )}
                      >
                        <MarkdownContent content={message.content} />

                        {message.role === 'assistant' && hoveredMessageIndex === index && (
                          <div className="absolute top-2 end-2 flex gap-1 backdrop-blur-sm bg-background/80 rounded p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-muted-foreground/10"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast({
                                  title: currentLanguage === 'ar' ? 'تم النسخ!' : 'Copied!',
                                  description: currentLanguage === 'ar'
                                    ? 'تم نسخ الرسالة إلى الحافظة'
                                    : 'Message copied to clipboard'
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-muted-foreground/10"
                              onClick={() => {
                                const userMsg = messages[index - 1];
                                if (userMsg?.role === 'user') {
                                  sendMessage(userMsg.content);
                                }
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {message.role === 'user' && hoveredMessageIndex === index && (
                          <div className="absolute top-2 end-2 flex gap-1 backdrop-blur-sm bg-background/80 rounded p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-primary/20"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast({
                                  title: currentLanguage === 'ar' ? 'تم النسخ!' : 'Copied!',
                                  description: currentLanguage === 'ar'
                                    ? 'تم نسخ الرسالة إلى الحافظة'
                                    : 'Message copied to clipboard'
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-primary/20"
                              onClick={() => sendMessage(message.content)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground text-start"
                      >
                        <Clock className="h-3 w-3" />
                        {new Date(message.timestamp).toLocaleString('en-US', {
                          timeZone: 'Asia/Beirut',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          month: 'short',
                          day: 'numeric'
                        })} (Beirut)
                      </div>
                    </div>

                    {isUserMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <IconComponent className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="inline-block p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'ar' ? 'الذكاء الاصطناعي يفكر...' : 'AI is thinking...'}
                          {loadingElapsedSeconds > 0 && ` (${loadingElapsedSeconds}s)`}
                          {loadingElapsedSeconds > 8 && (currentLanguage === 'ar' ? ' - لا يزال قيد المعالجة...' : ' - Still processing...')}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <Card className="shrink-0">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'ar' 
                ? 'اسألني عن أدائك في التداول أو أحوال السوق أو نصائح الاستراتيجية...'
                : 'Ask me about your trading performance, market conditions, or strategy advice...'
              }
              disabled={isLoading}
              className="flex-1"
              dir={rtl.dir}
            />
            <Button 
              onClick={() => sendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!selectedAccount && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {currentLanguage === 'ar' 
                ? 'اختر حساب تداول للحصول على تحليل شخصي'
                : 'Select a trading account for personalized analysis'
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};