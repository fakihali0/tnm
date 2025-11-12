import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { SPACING } from '@/styles/spacing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calculator,
  Bell,
  Settings,
  Activity,
  DollarSign,
  ChevronRight,
  Menu,
  X,
  Plus,
  ArrowUp,
  Search,
  Filter,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
  badge?: number;
}

interface EnhancedMobileLayoutProps {
  children?: React.ReactNode;
}

export function EnhancedMobileLayout({ children }: EnhancedMobileLayoutProps) {
  const isMobile = useIsMobile();
  const { 
    reducedAnimations, 
    optimizedTouchTargets, 
    hapticFeedback, 
    swipeGestures,
    triggerHapticFeedback 
  } = useMobileOptimizations();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh functionality
  const handlePanStart = () => {
    if (containerRef.current?.scrollTop === 0) {
      if (hapticFeedback) triggerHapticFeedback('light');
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (containerRef.current?.scrollTop === 0 && info.delta.y > 0) {
      setPullY(Math.min(info.delta.y * 0.5, 100));
    }
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (pullY > 60) {
      setIsRefreshing(true);
      if (hapticFeedback) triggerHapticFeedback('medium');
      
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 2000);
    } else {
      setPullY(0);
    }
  };

  const handleTabChange = (tabId: string) => {
    if (hapticFeedback) triggerHapticFeedback('light');
    setActiveTab(tabId);
  };

  // Swipe between tabs
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!swipeGestures) return;
    
    const tabIds = tabs.map(tab => tab.id);
    const currentIndex = tabIds.indexOf(activeTab);
    
    let newIndex;
    if (direction === 'left' && currentIndex < tabIds.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }
    
    if (newIndex !== undefined) {
      setActiveTab(tabIds[newIndex]);
      if (hapticFeedback) triggerHapticFeedback('light');
    }
  };

  const tabs: MobileTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: TrendingUp,
      component: (
        <div className={SPACING.stack.comfortable}>
          {/* Account Summary Cards */}
          <div className={`grid grid-cols-2 ${SPACING.gap.button}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`trading-card ${SPACING.padding.cardSmall} border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20`}>
                <div className={`flex items-center ${SPACING.gap.small} ${SPACING.margin.paragraph}`}>
                  <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/40">
                    <DollarSign className={`${SPACING.icon.sm} text-green-600 dark:text-green-400`} />
                  </div>
                  <span className="text-sm font-medium">Balance</span>
                </div>
                <p className="text-2xl font-bold">$52,450</p>
                <div className={`flex items-center ${SPACING.gap.iconButton} mt-1`}>
                  <ArrowUp className={`${SPACING.icon.xs} text-green-600`} />
                  <p className="text-xs text-green-600">+2.3% today</p>
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`trading-card ${SPACING.padding.cardSmall} border-0 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20`}>
                <div className={`flex items-center ${SPACING.gap.small} ${SPACING.margin.paragraph}`}>
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40">
                    <Activity className={`${SPACING.icon.sm} text-blue-600 dark:text-blue-400`} />
                  </div>
                  <span className="text-sm font-medium">P&L</span>
                </div>
                <p className="text-2xl font-bold text-green-600">+$1,250</p>
                <p className="text-xs text-muted-foreground mt-1">This week</p>
              </Card>
            </motion.div>
          </div>
          
          {/* Quick Actions Row */}
          <div className={`grid grid-cols-4 ${SPACING.gap.small}`}>
            {[
              { icon: Plus, label: 'New Trade', color: 'bg-primary' },
              { icon: Search, label: 'Search', color: 'bg-accent' },
              { icon: Filter, label: 'Filter', color: 'bg-secondary' },
              { icon: MoreHorizontal, label: 'More', color: 'bg-muted' }
            ].map((action, i) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  `flex flex-col items-center ${SPACING.gap.small} ${SPACING.padding.cardCompact} rounded-2xl text-white shadow-sm`,
                  action.color
                )}
                onClick={() => hapticFeedback && triggerHapticFeedback('light')}
              >
                <action.icon className={SPACING.icon.md} />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Enhanced Quick Stats */}
          <Card className={`trading-card ${SPACING.padding.cardSmall} border-0`}>
            <div className={`flex items-center justify-between ${SPACING.margin.heading}`}>
              <h3 className="font-semibold">Performance</h3>
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                Live
              </Badge>
            </div>
            <div className={SPACING.stack.comfortable}>
              {[
                { label: 'Win Rate', value: '68%', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/20' },
                { label: 'Active Trades', value: '5', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' },
                { label: 'Risk Level', value: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/20' }
              ].map((stat, i) => (
                <div key={stat.label} className={`flex items-center justify-between ${SPACING.padding.cardCompact} rounded-xl border`}>
                  <span className="text-sm font-medium">{stat.label}</span>
                  <div className={cn("px-3 py-1 rounded-full text-sm font-semibold", stat.bgColor, stat.color)}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'positions',
      label: 'Positions',
      icon: BarChart3,
      badge: 5,
      component: (
        <div className={SPACING.stack.normal}>
          {Array.from({ length: 5 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`trading-card ${SPACING.padding.cardSmall} border-0`}>
                <div className={`flex items-center justify-between ${SPACING.margin.paragraph}`}>
                  <div className={`flex items-center ${SPACING.gap.button}`}>
                    <div className={`${SPACING.icon.xxl} rounded-full bg-primary/10 flex items-center justify-center`}>
                      <TrendingUp className={`${SPACING.icon.md} text-primary`} />
                    </div>
                    <div>
                      <span className="font-semibold">EURUSD</span>
                      <p className="text-xs text-muted-foreground">Forex</p>
                    </div>
                  </div>
                  <Badge variant={i % 2 === 0 ? "default" : "destructive"} className="font-semibold">
                    {i % 2 === 0 ? '+$125' : '-$45'}
                  </Badge>
                </div>
                <div className={`grid grid-cols-3 ${SPACING.gap.medium} text-sm`}>
                  <div>
                    <p className="text-muted-foreground">Lot Size</p>
                    <p className="font-medium">0.1</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-medium">1.0850</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-medium">1.0875</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChart,
      component: (
        <div className={SPACING.stack.comfortable}>
          <Card className={`trading-card ${SPACING.padding.cardSmall} border-0`}>
            <h3 className={`font-semibold ${SPACING.margin.heading}`}>Performance Metrics</h3>
            <div className={SPACING.stack.comfortable}>
              {[
                { label: 'Total Return', value: '+12.4%', color: 'text-green-600' },
                { label: 'Sharpe Ratio', value: '1.45', color: 'text-primary' },
                { label: 'Max Drawdown', value: '-3.2%', color: 'text-red-600' },
                { label: 'Profit Factor', value: '2.1', color: 'text-blue-600' }
              ].map((metric, i) => (
                <div key={metric.label} className={`flex items-center justify-between ${SPACING.padding.cardCompact} rounded-xl bg-muted/30`}>
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span className={cn("font-semibold", metric.color)}>{metric.value}</span>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Risk Gauge */}
          <Card className={`trading-card ${SPACING.padding.cardSmall} border-0`}>
            <h3 className={`font-semibold ${SPACING.margin.heading}`}>Risk Assessment</h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.7} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">7.2</p>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary">
                Moderate Risk
              </Badge>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Calculator,
      component: (
        <div className={SPACING.stack.normal}>
          {[
            { name: 'Position Calculator', icon: Calculator, color: 'bg-blue-500' },
            { name: 'Risk Manager', icon: Activity, color: 'bg-green-500' },
            { name: 'Currency Converter', icon: TrendingUp, color: 'bg-purple-500' },
            { name: 'Economic Calendar', icon: Bell, color: 'bg-orange-500' }
          ].map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`trading-card ${SPACING.padding.cardSmall} border-0 cursor-pointer`}>
                <div className={`flex items-center ${SPACING.gap.medium}`}>
                  <div className={cn(`${SPACING.padding.cardCompact} rounded-xl text-white`, tool.color)}>
                    <tool.icon className={SPACING.icon.lg} />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">{tool.name}</span>
                    <p className="text-sm text-muted-foreground">Tap to open</p>
                  </div>
                  <ChevronRight className={`${SPACING.icon.md} text-muted-foreground`} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )
    }
  ];

  if (!isMobile) {
    return <div className="w-full">{children}</div>;
  }

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="flex flex-col h-screen bg-background mobile-safe-area">
      {/* Enhanced Mobile Header */}
      <motion.div 
        className={`flex items-center justify-between ${SPACING.padding.cardSmall} border-b bg-background/95 backdrop-blur-md shadow-sm`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className={SPACING.icon.md} />
        </Button>

        <div className="text-center">
          <h1 className="text-lg font-bold gradient-text">Trade'n More</h1>
          <p className="text-xs text-muted-foreground">Professional Trading</p>
        </div>

        <div className={`flex items-center ${SPACING.gap.small}`}>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className={SPACING.icon.md} />
            <div className={`absolute -top-1 -right-1 ${SPACING.icon.xs} bg-red-500 rounded-full flex items-center justify-center`}>
              <span className="text-xs text-white font-bold">3</span>
            </div>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className={SPACING.icon.md} />
          </Button>
        </div>
      </motion.div>

      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {pullY > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center p-2"
          >
            <div className={`flex items-center ${SPACING.gap.small} text-sm text-muted-foreground`}>
              {isRefreshing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className={SPACING.icon.sm} />
                  </motion.div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <ArrowUp className={SPACING.icon.sm} />
                  <span>{pullY > 60 ? 'Release to refresh' : 'Pull to refresh'}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Swipe Gestures */}
      <div className="flex-1 overflow-hidden">
        <motion.div 
          ref={containerRef}
          className={`h-full overflow-y-auto ${SPACING.padding.cardSmall}`}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          drag={swipeGestures ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 100) {
              handleSwipe(info.offset.x > 0 ? 'right' : 'left');
            }
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: reducedAnimations ? 0.1 : 0.3 }}
            >
              {activeTabData?.component}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced Bottom Navigation */}
      <motion.div 
        className="border-t bg-background/95 backdrop-blur-md shadow-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around p-2 pb-safe-bottom">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 min-w-0 flex-1 relative",
                  isActive 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground',
                  optimizedTouchTargets && 'min-h-[56px]'
                )}
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  {tab.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                    >
                      {tab.badge}
                    </motion.div>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium truncate w-full text-center transition-all",
                  isActive ? 'font-semibold' : 'font-normal'
                )}>
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 w-1 h-1 bg-primary rounded-full"
                    style={{ x: '-50%' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Enhanced Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => {
          setShowQuickActions(!showQuickActions);
          if (hapticFeedback) triggerHapticFeedback('medium');
        }}
        className="absolute bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 flex items-center justify-center z-10"
        style={{ boxShadow: '0 8px 25px -8px hsl(var(--primary) / 0.4)' }}
      >
        <motion.div
          animate={{ rotate: showQuickActions ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-7 w-7" />
        </motion.div>
      </motion.button>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20"
            onClick={() => setShowQuickActions(false)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute bottom-40 right-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { label: 'New Order', icon: TrendingUp, color: 'bg-blue-500' },
                { label: 'Close All', icon: X, color: 'bg-red-500' },
                { label: 'Calculator', icon: Calculator, color: 'bg-green-500' },
                { label: 'Alerts', icon: Bell, color: 'bg-orange-500' }
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 50, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                        {action.label}
                      </span>
                      <Button
                        size="icon"
                        className={cn(
                          "w-12 h-12 rounded-full shadow-lg text-white border-0",
                          action.color
                        )}
                        onClick={() => {
                          if (hapticFeedback) triggerHapticFeedback('light');
                          setShowQuickActions(false);
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}