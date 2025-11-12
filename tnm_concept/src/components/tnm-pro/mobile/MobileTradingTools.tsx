import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLocalizedPath, getLanguageFromPath } from '@/i18n';
import { 
  Calculator,
  BookOpen,
  Bell,
  Settings,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Globe,
  Zap,
  ChevronRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTL } from '@/hooks/useRTL';

export function MobileTradingTools() {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { triggerHapticFeedback, hapticFeedback } = useMobileOptimizations();
  const navigate = useNavigate();
  const location = useLocation();

  const handleToolPress = (toolId: string) => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    
    const currentLang = getLanguageFromPath(location.pathname);
    
    switch (toolId) {
      case 'risk-calculator':
        navigate(getLocalizedPath('/tnm-ai#risk-calculator', currentLang));
        break;
      case 'journal':
        navigate(getLocalizedPath('/tnm-ai#journal', currentLang));
        break;
      case 'alerts':
        navigate(getLocalizedPath('/tnm-ai#alerts', currentLang));
        break;
      case 'settings':
        navigate(getLocalizedPath('/tnm-ai#settings', currentLang));
        break;
      default:
        console.log(`Tool pressed: ${toolId}`);
    }
  };

  const primaryTools = [
    {
      id: 'risk-calculator',
      title: t('navigation.riskCalculator'),
      description: 'Calculate position size and risk',
      icon: Calculator,
      color: 'text-blue-500',
      bgColor: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-500/20',
      badge: 'Essential'
    },
    {
      id: 'journal',
      title: t('navigation.journal'),
      description: 'Track and analyze your trades',
      icon: BookOpen,
      color: 'text-green-500',
      bgColor: 'from-green-500/10 to-green-600/10',
      borderColor: 'border-green-500/20',
      badge: 'Popular'
    },
    {
      id: 'alerts',
      title: t('navigation.alerts'),
      description: 'Manage trading notifications',
      icon: Bell,
      color: 'text-orange-500',
      bgColor: 'from-orange-500/10 to-orange-600/10',
      borderColor: 'border-orange-500/20',
      badge: '3 Active'
    }
  ];

  const quickTools = [
    {
      id: 'pip-calculator',
      title: 'Pip Calculator',
      icon: Target,
      color: 'text-purple-500'
    },
    {
      id: 'profit-calculator',
      title: 'Profit Calculator',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      id: 'currency-converter',
      title: 'Currency Converter',
      icon: Globe,
      color: 'text-blue-500'
    },
    {
      id: 'session-timer',
      title: 'Session Timer',
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      id: 'economic-calendar',
      title: 'Economic Calendar',
      icon: TrendingUp,
      color: 'text-red-500'
    },
    {
      id: 'market-scanner',
      title: 'Market Scanner',
      icon: Zap,
      color: 'text-yellow-500'
    }
  ];

  const integrations = [
    {
      id: 'mt4',
      title: 'MetaTrader 4',
      description: 'Integration temporarily disabled',
      status: 'Unavailable',
      icon: ExternalLink
    },
    {
      id: 'mt5',
      title: 'MetaTrader 5',
      description: 'Integration temporarily disabled',
      status: 'Unavailable',
      icon: ExternalLink
    },
    {
      id: 'tradingview',
      title: 'TradingView',
      description: 'Advanced charting platform',
      status: 'Coming Soon',
      icon: ExternalLink
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      dir={rtl.dir}
    >
      {/* Tools Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-xl flex items-center justify-center mb-4" role="presentation">
            <Calculator className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('navigation.tools')}</h2>
          <p className="text-sm text-muted-foreground">
            Professional trading tools and calculators
          </p>
        </CardContent>
      </Card>

      {/* Primary Tools */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-1">Essential Tools</h3>
        {primaryTools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  `bg-gradient-to-br ${tool.bgColor} ${tool.borderColor} cursor-pointer transition-all duration-200 active:scale-95`
                )}
                onClick={() => handleToolPress(tool.id)}
                role="button"
                tabIndex={0}
                aria-label={`${tool.title}: ${tool.description}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToolPress(tool.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-background/50")} role="presentation">
                        <Icon className={cn("h-5 w-5", tool.color)} aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{tool.title}</h4>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs" aria-label={`Status: ${tool.badge}`}>
                        {tool.badge}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Tools Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-1">Quick Tools</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-md min-h-[88px]"
                  onClick={() => handleToolPress(tool.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Quick tool: ${tool.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToolPress(tool.id);
                    }
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className={cn("h-6 w-6 mx-auto mb-2", tool.color)} aria-hidden="true" />
                    <p className="text-xs font-medium">{tool.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Platform Integrations */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-1">Platform Integrations</h3>
        {integrations.map((integration, index) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 active:scale-95",
                  (integration.status === 'Coming Soon' || integration.status === 'Unavailable') && "opacity-60"
                )}
                onClick={() => integration.status === 'Available' && handleToolPress(integration.id)}
                role="button"
                tabIndex={0}
                aria-label={`${integration.title}: ${integration.description} - ${integration.status}`}
                aria-disabled={integration.status !== 'Available'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (integration.status === 'Available') {
                      handleToolPress(integration.id);
                    }
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted" role="presentation">
                        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{integration.title}</h4>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={integration.status === 'Available' ? "default" : integration.status === 'Unavailable' ? "destructive" : "secondary"}
                      className="text-xs"
                      aria-label={`Status: ${integration.status}`}
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Settings Access */}
      <Card 
        className="cursor-pointer transition-all duration-200 active:scale-95"
        onClick={() => handleToolPress('settings')}
        role="button"
        tabIndex={0}
        aria-label={`${t('navigation.settings')}: Customize your experience`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToolPress('settings');
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20" role="presentation">
                <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{t('navigation.settings')}</h4>
                <p className="text-xs text-muted-foreground">Customize your experience</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}