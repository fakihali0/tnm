import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/store/auth';
import { useRealTradingData } from '@/hooks/useRealTradingData';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileProfessionalSidebar } from '@/components/tnm-pro/mobile/MobileProfessionalSidebar';
import { MobileChatInterface } from '@/components/tnm-pro/mobile/MobileChatInterface';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { 
  Brain,
  Plus,
  ArrowLeft,
  Bell,
  Search,
  Database,
  MessageSquare,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileTNMProLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

export function MobileTNMProLayout({ children, activeSection }: MobileTNMProLayoutProps) {
  const { t } = useTranslation('tnm-ai');
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { accounts, loadAccounts } = useAccountStore();
  const { refreshData } = useRealTradingData();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  
  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  
  // If not mobile, return children as-is
  if (!isMobile) {
    return <>{children}</>;
  }

  const handleSidebarToggle = () => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    setShowSidebar(!showSidebar);
  };

  const handleChatToggle = () => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    setShowChat(!showChat);
    setIsChatMinimized(false);
  };

  const handleBackAction = () => {
    navigate('/');
  };

  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return t('navigation.dashboard');
      case 'ai-hub':
        return t('navigation.aiHub');
      case 'analytics':
        return t('navigation.analytics');
      case 'accounts':
        return t('navigation.accounts');
      case 'journal':
        return t('navigation.journal');
      case 'risk-calculator':
        return t('navigation.riskCalculator');
      case 'alerts':
        return t('navigation.alerts');
      case 'settings':
        return t('navigation.settings');
      default:
        return 'TNM AI';
    }
  };

  const getHeaderSubtitle = () => {
    if (activeSection === 'dashboard') {
      return accounts.length > 0 
        ? t('dashboard.subtitle', { count: accounts.length })
        : t('dashboard.noAccounts');
    }
    return undefined;
  };

  const rightActions = [
    {
      icon: MessageSquare,
      onClick: handleChatToggle,
      label: t('ai.askAI', 'Ask AI')
    }
  ];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background relative">
      {/* Mobile Header - Fixed */}
      <div className="sticky top-0 z-50">
        <MobileHeader
          title={getHeaderTitle()}
          subtitle={getHeaderSubtitle()}
          leftAction={{
            icon: Menu,
            onClick: handleSidebarToggle,
            label: t('common.menu', 'Menu')
          }}
          rightActions={rightActions}
          gradient
          className="border-b"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <PullToRefresh onRefresh={async () => {
          // Refresh both account store and trading data
          await loadAccounts();
          await refreshData();
        }}>
          <motion.div 
            className="h-full overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ 
              paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
              paddingTop: '16px'
            }}
          >
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        </PullToRefresh>
      </div>

      {/* Mobile Sidebar */}
      <MobileProfessionalSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeSection={activeSection}
      />

      {/* Mobile Chat Interface */}
      {showChat && (
        <MobileChatInterface
          isMinimized={isChatMinimized}
          onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
        />
      )}

      {/* Status Bar for Debug/Dev */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-16 left-0 right-0 bg-muted/90 text-xs p-1 text-center backdrop-blur-sm z-20 pointer-events-none">
          Section: {activeSection} | Accounts: {accounts.length}
        </div>
      )}
    </div>
  );
}