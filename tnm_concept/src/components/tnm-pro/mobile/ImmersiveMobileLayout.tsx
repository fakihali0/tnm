import { useState, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { 
  Menu, 
  MessageSquare, 
  Wallet, 
  Plus,
  ArrowUpDown,
  Calculator,
  Brain,
  Database,
  AlertCircle
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { getLocalizedPath, getLanguageFromPath } from "@/i18n";
import { ImmersiveHeroCard } from "./ImmersiveHeroCard";
import { MiniChartCard } from "./MiniChartCard";
import { PillActionButtons } from "./PillActionButtons";
import { InfiniteActivityFeed } from "./InfiniteActivityFeed";
import { MobileProfessionalSidebar } from "./MobileProfessionalSidebar";
import { AIChatDrawer } from "../AIChatDrawer";
import { AIChatAssistant } from "../AIChatAssistant";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { useRealTradingData } from "@/hooks/useRealTradingData";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { cn } from "@/lib/utils";
import { useRTL } from "@/hooks/useRTL";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trade } from "@/types/trading";
import newLogo from "@/assets/new-logo.webp";

interface ImmersiveMobileLayoutProps {
  children?: React.ReactNode;
}

// Helper function to transform trades into activity feed format
const transformTradesToActivities = (trades: Trade[]) => {
  return trades.slice(0, 10).map(trade => ({
    id: trade.id,
    type: "trade" as const,
    symbol: trade.symbol,
    action: trade.direction.toLowerCase() as "buy" | "sell",
    amount: trade.volume,
    profit: trade.pnl || 0,
    timestamp: new Date(trade.closed_at || trade.opened_at)
  }));
};

// Helper function to get top traded symbols
const getTopSymbols = (trades: Trade[]) => {
  const symbolCounts = trades.reduce((acc, trade) => {
    acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(symbolCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([symbol]) => symbol);
};

export function ImmersiveMobileLayout({ children }: ImmersiveMobileLayoutProps) {
  const { t } = useTranslation("tnm-ai");
  const rtl = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerHapticFeedback, swipeGestures } = useMobileOptimizations();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Real data hook
  const {
    accounts,
    selectedAccount,
    trades,
    isLoading,
    error,
    refreshData
  } = useRealTradingData();

  // Calculate real data
  const balance = selectedAccount?.balance || 0;
  const equity = selectedAccount?.equity || balance;
  const change = equity - balance;
  const changePercent = balance > 0 ? (change / balance) * 100 : 0;

  // Get top symbols for mini charts
  const topSymbols = getTopSymbols(trades);
  const mockCharts = topSymbols.map(symbol => ({
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    sparklineData: [0, 0, 0, 0, 0]
  }));

  // Transform trades to activities
  const activities = transformTradesToActivities(trades);

  const handleQuickAction = (sectionId: string) => {
    const currentLang = getLanguageFromPath(location.pathname);
    const localizedPath = getLocalizedPath(`/tnm-pro#${sectionId}`, currentLang);
    navigate(localizedPath);
  };

  const quickActions = [
    { icon: Plus, label: t("quickActions.newTrade"), onClick: () => handleQuickAction("trading"), variant: "primary" as const },
    { icon: Wallet, label: t("quickActions.deposit"), onClick: () => handleQuickAction("accounts"), variant: "success" as const },
    { icon: Calculator, label: t("quickActions.calculator"), onClick: () => handleQuickAction("risk-calculator"), variant: "default" as const },
    { icon: Brain, label: t("quickActions.aiHub"), onClick: () => handleQuickAction("ai-hub"), variant: "primary" as const },
  ];

  const handleRefresh = async () => {
    triggerHapticFeedback("medium");
    await refreshData();
  };

  const handleSwipe = useCallback((event: any, info: PanInfo) => {
    if (!swipeGestures) return;
    
    // RTL: swipe left to open sidebar, LTR: swipe right to open sidebar
    if ((rtl.isRTL && info.offset.x < -100 && Math.abs(info.velocity.x) > 500) ||
        (!rtl.isRTL && info.offset.x > 100 && Math.abs(info.velocity.x) > 500)) {
      setSidebarOpen(true);
      triggerHapticFeedback("light");
    }
  }, [swipeGestures, triggerHapticFeedback, rtl.isRTL]);

  // Get current section from hash
  const currentSection = location.hash.replace("#", "") || "dashboard";

  return (
    <div className="fixed inset-0 flex flex-col bg-background" dir={rtl.dir}>
      {/* Floating header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 pt-safe-area-top"
      >
        <div className="bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Menu button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSidebarOpen(true);
                triggerHapticFeedback("light");
              }}
              className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-primary" />
            </motion.button>

            {/* Language, Theme Toggle and AI Chat */}
            <div className="flex items-center gap-2">
              <LanguageToggle size="mobile" />
              <ThemeToggle size="mobile" />
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setChatOpen(true);
                  triggerHapticFeedback("light");
                }}
                className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors relative"
              >
                <MessageSquare className="w-5 h-5 text-primary" />
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16" style={{ paddingTop: 'var(--safe-area-top, 0px)' }} />

      {/* Main content with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-hidden">
        <div 
          className="h-full overflow-y-auto px-4 pt-6 space-y-4 pb-8"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}
        >
          {/* Show custom sections based on route, or default dashboard */}
          {currentSection === "dashboard" || !currentSection ? (
            <>
              {/* Error state */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("common.error")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Loading state */}
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-12 w-24 rounded-full flex-shrink-0" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                </div>
              ) : accounts.length === 0 ? (
                /* Empty state */
                <Card className="text-center p-8 mt-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">{t("emptyStates.noTradingAccounts")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("emptyStates.connectAccount")}
                  </p>
                  <Button onClick={() => handleQuickAction("accounts")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("account.linkAccount")}
                  </Button>
                </Card>
              ) : (
                <>
                  {/* Hero balance card */}
                  <ImmersiveHeroCard 
                    balance={balance}
                    change={change}
                    changePercent={changePercent}
                    accountName={selectedAccount?.account_name || t("common.tradingAccount")}
                  />

                  {/* Quick actions */}
                  <PillActionButtons actions={quickActions} />

                  {/* Mini charts section */}
                  {topSymbols.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                        {t("markets.yourTopMarkets")}
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        {mockCharts.map((chart) => (
                          <MiniChartCard 
                            key={chart.symbol}
                            {...chart}
                            onClick={() => {
                              console.log("Navigate to", chart.symbol);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Infinite activity feed */}
                  <InfiniteActivityFeed 
                    initialItems={activities}
                    onLoadMore={async () => {
                      // Could implement pagination here
                      return [];
                    }}
                  />
                </>
              )}
            </>
          ) : currentSection === "ai-hub" ? (
            <div className="flex-1 flex flex-col -mx-4 -my-4 min-h-0">
              <AIChatAssistant />
            </div>
          ) : (
            // Render children for other sections
            <div className="animate-fade-in">
              {children}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Sidebar */}
      <MobileProfessionalSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={currentSection}
      />

      {/* AI Chat drawer */}
      <AIChatDrawer 
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
