import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/store/auth';
import { getLocalizedPath, getLanguageFromPath } from '@/i18n';

import {
  LayoutDashboard,
  Brain,
  Link2,
  BookOpen,
  Bell,
  Calculator,
  X,
  TrendingUp,
  User,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import newLogo from "@/assets/new-logo.webp";
import { useRTL } from '@/hooks/useRTL';

interface MobileProfessionalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

export function MobileProfessionalSidebar({ 
  isOpen, 
  onClose, 
  activeSection 
}: MobileProfessionalSidebarProps) {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts } = useAccountStore();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();

  const navigationItems = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: LayoutDashboard,
      badge: accounts.length > 0 ? accounts.length : undefined,
      description: t('dashboard.overviewAndAccounts')
    },
    {
      id: 'ai-hub',
      label: t('navigation.aiHub'),
      icon: Brain,
      description: t('dashboard.aiAssistant')
    },
    {
      id: 'analytics',
      label: t('navigation.analytics'),
      icon: TrendingUp,
      description: t('dashboard.performanceInsights')
    },
    {
      id: 'accounts',
      label: t('navigation.accounts'),
      icon: Link2,
      badge: accounts.length > 0 ? accounts.length : undefined,
      description: t('dashboard.connectedAccounts')
    },
    {
      id: 'journal',
      label: t('navigation.journal'),
      icon: BookOpen,
      description: t('dashboard.tradingJournal')
    },
    {
      id: 'risk-calculator',
      label: t('navigation.riskCalculator'),
      icon: Calculator,
      description: t('dashboard.riskTools')
    },
    {
      id: 'alerts',
      label: t('navigation.alerts'),
      icon: Bell,
      badge: 2,
      description: 'Notifications & alerts'
    }
  ];

  const handleNavigation = (sectionId: string) => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    const currentLang = getLanguageFromPath(location.pathname);
    const localizedPath = getLocalizedPath(`/tnm-ai#${sectionId}`, currentLang);
    navigate(localizedPath);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: rtl.isRTL ? 320 : -320 }}
            animate={{ x: 0 }}
            exit={{ x: rtl.isRTL ? 320 : -320 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className={cn(
              "fixed top-0 bottom-0 w-80 bg-background z-50 flex flex-col border-s border-border",
              rtl.isRTL ? "right-0" : "left-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                  <img 
                    src={newLogo}
                    alt="Trade'n More Logo" 
                    className="h-5 w-5 object-contain"
                    loading="eager"
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">TNM AI</h2>
                  <p className="text-xs text-muted-foreground">{t('common.platform')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Account Status */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t('common.aiTrader')}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {accounts.length > 0 
                      ? t('common.accountsConnected', { 
                          count: accounts.length, 
                          plural: accounts.length > 1 ? 's' : '' 
                        })
                      : t('common.noAccountsConnected')
                    }
                  </p>
                </div>
                {accounts.length === 0 && (
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 group",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted/80 active:bg-muted"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted group-hover:bg-muted-foreground/10"
                      )}>
                        <item.icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary-foreground" : "text-foreground/80"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-start">
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <Badge 
                              variant={isActive ? "secondary" : "outline"}
                              className="text-xs h-5 px-1.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mt-0.5 text-start",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  const currentLang = getLanguageFromPath(location.pathname);
                  // Smart back navigation: use history if available, otherwise go to homepage
                  if (window.history.length > 2 && document.referrer.includes(window.location.origin)) {
                    navigate(-1);
                  } else {
                    const localizedPath = getLocalizedPath("/", currentLang);
                    navigate(localizedPath);
                  }
                  onClose();
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backToWebsite')}
              </Button>
              
              <div className="text-center text-xs text-muted-foreground">
                <p>{t('common.versionInfo')}</p>
                <p>{t('common.aiIntelligence')}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}