import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chat";
import { cn } from "@/lib/utils";
import { useRTL } from "@/hooks/useRTL";

interface FloatingAIButtonProps {
  onClick: () => void;
}

export function FloatingAIButton({ onClick }: FloatingAIButtonProps) {
  const location = useLocation();
  const { t } = useTranslation("tnm-ai");
  const rtl = useRTL();
  const { conversations } = useChatStore();
  
  // Get unread count from conversations (placeholder logic)
  const unreadCount = 0;
  
  // Context-aware button text based on current section
  const getContextText = () => {
    const hash = location.hash.slice(1); // Remove #
    
    switch(hash) {
      case 'dashboard':
        return t('ai.contextPrompts.dashboard', 'Ask about your performance');
      case 'journal':
        return t('ai.contextPrompts.journal', 'Analyze this trade');
      case 'risk-calculator':
        return t('ai.contextPrompts.risk', 'Validate my calculation');
      case 'analytics':
        return t('ai.contextPrompts.analytics', 'Explain these metrics');
      default:
        return t('ai.askAI', 'Ask AI');
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 end-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
    >
      <Button
        onClick={onClick}
        size="lg"
        className="relative h-14 gap-2 rounded-full shadow-lg hover:shadow-xl transition-all group bg-gradient-to-r from-primary to-primary/80"
      >
        <Brain className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline font-medium">{getContextText()}</span>
        <span className="sm:hidden font-medium">{t('ai.askAI', 'Ask AI')}</span>
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -end-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    </motion.div>
  );
}
