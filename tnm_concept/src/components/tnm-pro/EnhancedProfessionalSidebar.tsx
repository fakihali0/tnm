import React from 'react';
import { motion } from 'framer-motion';
import newLogo from "@/assets/new-logo.webp";
import { useTranslation } from 'react-i18next';

import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  Link2,
  Calculator,
  BookOpen,
  Bell,
  Settings,
  User,
  LogOut,
  ArrowLeft,
  Rocket,
  MoreVertical,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthStore, useAccountStore } from '@/store/auth';
import { useRTL } from '@/hooks/useRTL';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface SidebarTooltipButtonProps {
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
  [key: string]: any;
}

const SidebarTooltipButton = ({ children, tooltip, className, ...props }: SidebarTooltipButtonProps) => {
  if (!tooltip) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className} {...props}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const EnhancedProfessionalSidebar = () => {
  const { t } = useTranslation(['tnm-ai']);
  const rtl = useRTL();
  const location = useLocation();
  const { accounts } = useAccountStore();
  const { user, logout } = useAuthStore();
  const { open, state } = useSidebar();
  const collapsed = state === "collapsed";
  const { localizePath } = useLocalizedPath();

  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return hash || 'dashboard';
  };

  const activeSection = getActiveSection();

  // Professional navigation sections with enhanced organization
  const navigationSections = [
    {
      label: t('sidebar.sections.analyticsOverview'),
      icon: TrendingUp,
      items: [
        { 
          id: 'dashboard', 
          label: t('navigation.dashboard'), 
          icon: LayoutDashboard, 
          badge: accounts.length,
          description: t('sidebar.descriptions.dashboard')
        },
        { 
          id: 'accounts', 
          label: t('navigation.accounts'), 
          icon: Link2, 
          badge: accounts.length,
          description: t('sidebar.descriptions.accounts')
        },
      ]
    },
    {
      label: t('sidebar.sections.tradingTools'),
      icon: Zap,
      items: [
        { 
          id: 'ai-hub', 
          label: t('navigation.aiHub'), 
          icon: Brain,
          description: t('sidebar.descriptions.aiHub')
        },
        { 
          id: 'risk-calculator', 
          label: t('navigation.riskCalculator'), 
          icon: Calculator,
          description: t('sidebar.descriptions.riskCalculator')
        },
        { 
          id: 'journal', 
          label: t('navigation.journal'), 
          icon: BookOpen,
          description: t('sidebar.descriptions.journal')
        },
        { 
          id: 'alerts', 
          label: t('navigation.alerts'), 
          icon: Bell,
          badge: 2,
          description: t('sidebar.descriptions.alerts')
        },
      ]
    }
  ];

  const userStats = [
        { label: t('navigation.accounts'), value: accounts.length, color: 'text-primary' },
    { label: t('common.status'), value: 'AI', color: 'text-green-500' },
    { label: t('navigation.alerts'), value: '2', color: 'text-orange-500' },
    { label: t('analytics.performance'), value: '+12.5%', color: 'text-green-500' }
  ];

  return (
    <Sidebar 
      side={rtl.sidebarSide}
      className="sidebar-transition border-e border-border/30"
      collapsible="icon"
    >
      {/* Enhanced Header */}
      <SidebarHeader className={cn(
        "h-16 border-b border-border bg-background/95 backdrop-blur-sm overflow-visible",
        collapsed ? "px-1 py-3" : "px-3 py-4"
      )}>
        <motion.div 
          className="flex items-center justify-center h-full"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {!collapsed && (
            <Link to="/" className="flex items-center gap-3 group w-full">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shadow-sm">
                  <img 
                    src={newLogo}
                    alt="Trade'n More Logo" 
                    className="h-7 w-7 object-contain"
                    loading="eager"
                  />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-background shadow-sm"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-lg text-foreground truncate leading-tight">
                  Trade'n More
                </span>
                <span className="text-xs text-muted-foreground truncate leading-tight">{t('common.aiIntelligence')}</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="relative w-12 h-12 overflow-visible mx-auto">
              <div className="absolute inset-1.5 rounded-lg bg-white/5 flex items-center justify-center shadow-sm">
                <img 
                  src={newLogo}
                  alt="Trade'n More Logo" 
                  className="h-8 w-8 object-contain"
                  loading="eager"
                />
              </div>
            </div>
          )}
        </motion.div>
      </SidebarHeader>

      {/* Enhanced Content */}
      <SidebarContent className={cn(collapsed ? "space-y-2 px-2 py-4" : "space-y-5 px-3 py-5")}>
        {navigationSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
              </SidebarGroupLabel>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="h-px bg-border/50 mx-3 my-3" />
            )}
            <SidebarGroupContent>
              <SidebarMenu className={collapsed ? "space-y-1.5" : "space-y-1.5"}>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarTooltipButton tooltip={collapsed ? `${item.label}\n${item.description}` : undefined}>
                       <SidebarMenuButton 
                        asChild 
                        size={collapsed ? "default" : "lg"}
                        isActive={activeSection === item.id} 
                        className={cn(
                          "relative rounded-lg transition-all duration-300 group w-full",
                          collapsed ? "justify-center" : "",
                          "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/20",
                          "hover:shadow-sm active:scale-[0.98]",
                          activeSection === item.id && [
                            "bg-primary/10 text-primary font-medium shadow-sm",
                            "border border-primary/20"
                          ]
                        )}
                       >
                         <Link to={localizePath(`/tnm-ai#${item.id}`)} className={cn(
                          "flex items-center w-full relative transition-all duration-200",
                          collapsed ? "h-full w-full justify-center" : "gap-3 px-3 py-3"
                        )}>
                           <div className={cn(
                             "relative flex items-center justify-center transition-all duration-200 shrink-0",
                             activeSection === item.id 
                               ? "text-primary scale-110" 
                               : "text-foreground/80 group-hover:text-foreground group-hover:scale-105"
                           )}>
                             <item.icon className="h-4 w-4" />
                             {collapsed && item.badge !== undefined && item.badge > 0 && (
                               <div className="absolute -top-1.5 -end-1.5 min-w-4 h-4 px-1 bg-primary rounded-full ring-2 ring-background shadow-sm flex items-center justify-center z-10">
                                 <span className="text-[8px] text-primary-foreground font-bold leading-none">{item.badge}</span>
                               </div>
                             )}
                           </div>
                          {!collapsed && (
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate leading-tight text-start">{item.label}</div>
                                <div className="text-xs text-muted-foreground truncate leading-tight mt-0.5 text-start">{item.description}</div>
                              </div>
                               {item.badge && item.badge > 0 && (
                                 <Badge 
                                   variant={activeSection === item.id ? "default" : "secondary"} 
                                   className="ms-2"
                                 >
                                   {item.badge}
                                 </Badge>
                               )}
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarTooltipButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Enhanced Footer */}
      <SidebarFooter className={cn(
        "border-t border-border bg-background/95 backdrop-blur-sm",
        collapsed ? "p-3" : "p-4"
      )}>
        <div className={cn("space-y-4", collapsed && "space-y-4")}>
          {/* Enhanced User Profile */}
          {collapsed ? (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 w-11 p-0 rounded-lg hover:bg-muted transition-all duration-200 relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-background shadow-sm"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 p-0" align="center" side="right" sideOffset={16}>
                  <div className="p-4 bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-12 w-12">
                         <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                           {user?.firstName?.[0]}{user?.lastName?.[0]}
                         </AvatarFallback>
                       </Avatar>
                       <div className="min-w-0">
                         <p className="font-medium truncate text-start">{user?.firstName} {user?.lastName}</p>
                         <p className="text-sm text-muted-foreground truncate text-start">{user?.email}</p>
                         <Badge variant="secondary" className="mt-1 text-xs gap-1">
                           <Brain className="h-3 w-3" />
                           {t('sidebar.aiPowered')}
                         </Badge>
                       </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <DropdownMenuItem asChild>
                      <Link to={localizePath('/tnm-ai#settings')} className="flex items-center gap-3 px-3 py-2 rounded-md">
                        <User className="h-4 w-4" />
                        {t('sidebar.profileSettings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={localizePath('/tnm-ai#accounts')} className="flex items-center gap-3 px-3 py-2 rounded-md">
                        <Link2 className="h-4 w-4" />
                        {t('sidebar.accountManagement')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-md text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" />
                      {t('common.signOut')}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 space-y-3 border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-background shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end" side="top" sideOffset={8}>
                    <DropdownMenuItem asChild>
                      <Link to={localizePath('/tnm-ai#settings')} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('sidebar.profileSettings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={localizePath('/tnm-ai#accounts')} className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        {t('sidebar.accountManagement')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      {t('common.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Simplified Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/60 rounded-md p-2 text-center">
                  <p className="font-medium text-xs text-primary">{accounts.length}</p>
                  <p className="text-xs text-muted-foreground">{t('navigation.accounts')}</p>
                </div>
                <div className="bg-background/60 rounded-md p-2 text-center">
                  <p className="font-medium text-xs text-green-500">AI</p>
                  <p className="text-xs text-muted-foreground">{t('common.status')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Bottom Controls */}
          <div className={cn(
            "flex transition-all duration-200",
            collapsed ? "flex-col items-center gap-2 w-full" : "items-center justify-between gap-3"
          )}>
            {collapsed ? (
              <>
                {/* Collapsed: Stack vertically centered */}
                <div className="w-full flex justify-center">
                  <LanguageToggle size="sm" hideLabel />
                </div>
                <div className="w-full flex justify-center">
                  <ThemeToggle />
                </div>
                <div className="w-full flex justify-center">
                  <Button variant="outline" size="sm" asChild className="w-10 h-10 p-0">
                    <Link to="/" className="flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Expanded: Horizontal layout */}
                <div className="flex items-center gap-2">
                  <LanguageToggle size="sm" />
                  <ThemeToggle />
                </div>
                <Button variant="outline" size="sm" asChild className="gap-2 px-3 py-2">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs font-medium">{t('common.backToWebsite')}</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};