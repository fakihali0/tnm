import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { useChatStore } from '@/store/chat';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Send, 
  Lightbulb,
  TrendingUp,
  Shield,
  Sparkles,
  AlertCircle,
  Activity
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const UnifiedAIHub: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedAccount, metrics } = useTradingDashboard();
  const conversationId = 'ai-hub';
  const { 
    getMessages, 
    addMessage, 
    setLoading, 
    getIsLoading,
    setActiveConversation 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  
  // Initialize conversation
  useEffect(() => {
    setActiveConversation(conversationId);
    
    // Add welcome message if conversation is empty
    const existingMessages = getMessages(conversationId);
    if (existingMessages.length === 0) {
      const welcomeMessage = selectedAccount
        ? `Hi! I'm your AI trading assistant with access to your ${selectedAccount.account_name || 'trading account'}. I can analyze your ${metrics.totalTrades} trades, win rate of ${metrics.winRate.toFixed(1)}%, and provide personalized insights. What would you like to know?`
        : "Hi! I'm your AI trading assistant. Connect a trading account to get personalized insights, or ask me about market analysis and trading strategies.";
      
      addMessage(conversationId, {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toISOString(),
        type: 'welcome'
      });
    }
  }, [conversationId, selectedAccount?.id, setActiveConversation]);
  
  const messages = getMessages(conversationId);
  const isLoading = getIsLoading(conversationId);

  const quickActions = [
    { icon: Lightbulb, label: 'Analyze my performance', prompt: 'Analyze my last 10 trades and give me actionable insights' },
    { icon: TrendingUp, label: 'Market opportunities', prompt: 'What are the current market opportunities based on my trading style?' },
    { icon: Shield, label: 'Risk assessment', prompt: 'Assess my current risk exposure and suggest improvements' },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
      type: 'general' as const
    };

    addMessage(conversationId, userMessage);
    const messageText = input;
    setInput('');
    setLoading(conversationId, true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: { 
          message: messageText,
          account_id: selectedAccount?.id || null,
          analysis_type: 'general',
          conversation_history: conversationHistory
        }
      });

      if (error) throw error;

      const aiMessage = {
        role: 'assistant' as const,
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString(),
        type: 'general' as const
      };
      
      addMessage(conversationId, aiMessage);
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage = {
        role: 'assistant' as const,
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        type: 'general' as const
      };
      
      addMessage(conversationId, errorMessage);
    } finally {
      setLoading(conversationId, false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccount && (
            <Badge variant="outline" className="ltr:gap-1.5 rtl:gap-1.5 text-xs px-2.5 py-1">
              <Activity className="h-3 w-3" />
              Analyzing {selectedAccount.account_name || 'Account'}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="justify-start h-auto py-3.5 ltr:text-left rtl:text-right"
            onClick={() => handleQuickAction(action.prompt)}
          >
            <action.icon className="h-4 w-4 ltr:mr-2 rtl:ml-2 shrink-0" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 pb-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ltr:rounded-br-sm rtl:rounded-bl-sm ltr:p-3 rtl:p-4'
                        : 'bg-muted ltr:rounded-bl-sm rtl:rounded-br-sm ltr:p-3 rtl:p-4'
                    }`}
                  >
                    {/* Data source badges for assistant messages */}
                    {message.role === 'assistant' && (
                      <>
                        {(message.content.includes('source:"demo"') || message.content.includes('demonstration data')) && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600 mb-2">
                            📊 {t('common:demoData')}
                          </Badge>
                        )}
                        {message.content.includes('source:"live"') && (
                          <Badge variant="outline" className="text-green-600 border-green-600 mb-2">
                            ✓ {t('common:liveData')}
                          </Badge>
                        )}
                      </>
                    )}
                    <MarkdownContent content={message.content} />
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about your trading..."
                disabled={isLoading}
                dir={t('common:direction') === 'rtl' ? 'rtl' : 'ltr'}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
