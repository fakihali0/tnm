import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useAccountStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { useChatStore, type ChatMessage } from '@/store/chat';
import {
  MessageSquare,
  Send,
  Brain,
  User,
  Loader2,
  Sparkles,
  X,
  ChevronDown,
  Mic,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileChatInterfaceProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function MobileChatInterface({ 
  isMinimized = false, 
  onToggleMinimize 
}: MobileChatInterfaceProps) {
  const isMobile = useIsMobile();
  const { selectedAccount } = useAccountStore();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  const notifications = useAdvancedNotifications();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use global chat store
  const { 
    setActiveConversation, 
    addMessage, 
    setLoading, 
    getMessages, 
    getIsLoading 
  } = useChatStore();
  
  const conversationId = selectedAccount ? `account-${selectedAccount.id}` : 'global';
  const messages = getMessages(conversationId);
  const isLoading = getIsLoading(conversationId);

  const { t } = useTranslation('tnm-ai');
  
  const quickActions = [
    t("ai.quickActions.calculatePosition"),
    t("ai.quickActions.marketAnalysis"),
    t("ai.quickActions.riskAssessment"),
    t("ai.quickActions.tradingSignals")
  ];

  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: t("ai.welcome"),
        timestamp: new Date().toISOString(),
        type: 'welcome'
      };
      addMessage(conversationId, welcomeMessage);
    }
  }, [messages.length, conversationId, addMessage]);

  // Prevent background scroll when chat is open (simplified)
  useEffect(() => {
    if (!isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isMinimized]);

  const scrollToBottom = (smooth = true) => {
    if (!isMinimized && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  const sendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim();
    if (!messageText) return;

    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'general'
    };

    addMessage(conversationId, userMessage);
    setInputMessage('');
    scrollToBottom(false); // Immediate scroll to show user message
    setLoading(conversationId, true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: { 
          message: messageText,
          account_id: selectedAccount?.id,
          context: 'mobile_trading_assistant',
          mobile_optimized: true
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.response || generateMobileFallbackResponse(messageText),
        timestamp: new Date().toISOString(),
        type: data?.type || 'general'
      };

      addMessage(conversationId, assistantMessage);
      
      notifications.addNotification({
        title: t("ai.assistant"),
        message: t("ai.quickActions.marketAnalysis"),
        type: 'system',
        priority: 'low',
        category: 'info'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: t("ai.errors.connectionTrouble"),
        timestamp: new Date().toISOString(),
        type: 'general'
      };

      addMessage(conversationId, errorMessage);
    } finally {
      setLoading(conversationId, false);
    }
  };

  const generateMobileFallbackResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('position') || lowerMessage.includes('size')) {
      return "For position sizing, I recommend risking 1-2% of your account per trade. Would you like me to calculate the exact lot size for a specific trade?";
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('analysis')) {
      return "Current market conditions show mixed signals. I can provide more specific analysis if you tell me which currency pair or asset you're interested in.";
    }
    
    return "I'm here to help with your trading questions! Try asking about position sizing, market analysis, or risk management.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    scrollToBottom(false); // Immediate scroll
    setTimeout(() => {
      scrollToBottom();
    }, 300); // Wait for keyboard animation
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {!isMinimized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-black/20"
        />
      )}
      
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isMinimized ? 'calc(100% - 60px)' : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-x-0 bottom-0 bg-background border-t border-border z-40 flex flex-col"
        style={{ 
          height: isMinimized ? '60px' : '70svh',
          maxHeight: isMinimized ? '60px' : 'calc(100svh - 120px)'
        }}
      >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-border cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{t("ai.assistant")}</h3>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs h-4 px-1">
                <Sparkles className="h-2 w-2 mr-1" />
                {t("ai.online")}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isMinimized ? <ChevronDown className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Quick Actions */}
            <div className="p-3 border-b border-border">
              <div className="flex gap-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (hapticFeedback) {
                        triggerHapticFeedback('light');
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isLoading) {
                        sendMessage(action);
                      }
                    }}
                    disabled={isLoading}
                    className="whitespace-nowrap text-xs shrink-0 active:scale-95 transition-transform"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
              style={{ 
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={`${conversationId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-2",
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs",
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary'
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Brain className="h-3 w-3" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex-1 max-w-[80%]",
                    message.role === 'user' ? 'text-right' : ''
                  )}>
                    <div className={cn(
                      "inline-block p-3 rounded-2xl text-sm",
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-2">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-secondary">
                      <Brain className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="inline-block p-3 rounded-2xl rounded-bl-md bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <p className="text-sm text-muted-foreground">{t("ai.thinking")}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn(
              "border-t border-border p-4 transition-all duration-300",
              isInputFocused ? "pb-2" : ""
            )}>
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={t("ai.askAboutTrading")}
                    disabled={isLoading}
                    className="rounded-full"
                  />
                </div>
                <Button 
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </>
  );
}