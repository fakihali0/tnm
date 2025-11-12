import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, User, LogIn, ChevronDown, Brain, LayoutDashboard, Sparkles, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { useTranslation } from 'react-i18next';
import { getLocalizedPath, getLanguageFromPath } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import newLogo from "@/assets/new-logo.webp";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SPACING } from "@/styles/spacing";
import { Badge } from "@/components/ui/badge";


const navigation = [
  { name: "nav.home", href: "/" },
  { 
    name: "nav.products", 
    href: "/products",
    subPages: [
      { name: "nav.subPages.products.riskCalculator", href: "/products/risk-calculator", description: "Professional position sizing & risk management" },
      { name: "nav.subPages.products.tradingInstruments", href: "/products/trading-instruments", description: "Forex, Indices, Commodities, Crypto" },
      { name: "nav.subPages.products.accountTypes", href: "/products/account-types", description: "Zero Commission & Raw Spread Accounts" },
      { name: "nav.subPages.products.paymentMethods", href: "/products/payment-methods", description: "Secure Deposit & Withdrawal Options" },
      { name: "nav.subPages.products.platforms", href: "/products/platforms", description: "MetaTrader 5 Platform" },
      { name: "nav.subPages.products.tradingTools", href: "/products/trading-tools", description: "Economic Calendar, Market Analysis Tools" },
    ]
  },
  { 
    name: "nav.education", 
    href: "/education",
    subPages: [
      { name: "nav.subPages.education.webinars", href: "/education/webinars", description: "Live Trading Sessions & Expert Insights" },
      { name: "nav.subPages.education.resources", href: "/education/resources", description: "Trading Guides & Educational Materials" },
      { name: "nav.subPages.education.marketReports", href: "/education/market-reports", description: "Daily Market Analysis & Reports" },
      { name: "nav.subPages.education.blogs", href: "/education/blogs", description: "Trading Tips & Market Commentary" },
    ]
  },
  { name: "nav.getFunded", href: "/get-funded" },
  { name: "nav.partners", href: "/partners" },
  { name: "nav.contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();

  // Get current language from the path for routing consistency
  const pathLang = getLanguageFromPath(location.pathname);
  const effectiveLang = i18n.resolvedLanguage ?? pathLang;
  const isRTL = effectiveLang === 'ar';

  // Helper function to get the correct path for the effective language
  const getLocalizedPathForNav = (path: string) => {
    return getLocalizedPath(path, effectiveLang);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Logo */}
          <Link to={getLocalizedPathForNav("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src={newLogo}
              alt="Trade'n More" 
              className="h-12 sm:h-14 w-auto object-contain"
              loading="eager"
            />
            <span className="font-poppins text-lg sm:text-xl font-bold gradient-text hidden sm:inline">
              Trade'n More
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex ml-2 sm:ml-4">
            <NavigationMenuList className="gap-0.5 rtl:flex-row-reverse">
              {navigation.map((item) => {
                const localizedHref = getLocalizedPathForNav(item.href);
                const pathLocalizedHref = getLocalizedPath(item.href, pathLang);
                const isActive =
                  location.pathname === pathLocalizedHref ||
                  (pathLang === 'ar' && location.pathname.slice(3) === item.href) ||
                  (item.subPages &&
                    item.subPages.some((sub) => {
                      const subPathHref = getLocalizedPath(sub.href, pathLang);
                      return (
                        location.pathname === subPathHref ||
                        (pathLang === 'ar' && location.pathname.slice(3) === sub.href)
                      );
                    }));

                if (item.subPages) {
                  return (
                    <NavigationMenuItem key={item.name} className="relative">
                      <NavigationMenuLink asChild>
                        <Link
                          to={localizedHref}
                        className={`relative flex h-10 items-center text-sm font-medium leading-none transition-all duration-200 hover:text-primary px-3 ${isRTL ? 'pl-12' : 'pr-12'} group ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {t(item.name)}
                          <span
                            className={`absolute bottom-[2px] h-0.5 bg-primary transform transition-transform duration-200 left-4 right-12 rtl:left-12 rtl:right-4 ${
                              isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                            }`}
                          />
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuTrigger
                        className={`absolute top-1/2 ${isRTL ? 'left-0' : 'right-0'} z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-transparent bg-transparent px-0 py-0 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        } hover:bg-accent/40 hover:text-primary focus:bg-accent/40 data-[state=open]:text-primary`}
                        aria-label={`${t('common:navigation.toggleSubmenu', 'Toggle submenu')} ${t(item.name)}`}
                      >
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="data-[motion=from-start]:animate-in data-[motion=from-start]:fade-in-0 data-[motion=to-start]:animate-out data-[motion=to-start]:fade-out-0 data-[motion=from-start]:slide-in-from-top-2 data-[motion=to-start]:slide-out-to-top-2">
                        <div className="w-[420px] p-6 md:w-[540px] lg:w-[640px]">
                          <div className="grid grid-cols-1 gap-4">
                            {item.subPages.map((subPage) => {
                              const subLocalizedHref = getLocalizedPathForNav(subPage.href);
                              const subPathHref = getLocalizedPath(subPage.href, pathLang);
                              const subIsActive =
                                location.pathname === subPathHref ||
                                (pathLang === 'ar' && location.pathname.slice(3) === subPage.href);
                              return (
                                <NavigationMenuLink key={subPage.name} asChild>
                                  <Link
                                    to={subLocalizedHref}
                                    className="group block select-none rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md border border-transparent hover:border-border/20"
                                    aria-current={subIsActive ? "page" : undefined}
                                  >
                                    <div className="text-sm font-semibold leading-none text-foreground group-hover:text-accent-foreground mb-2">
                                      {t(subPage.name)}
                                    </div>
                                     <p className="text-xs leading-snug text-muted-foreground group-hover:text-accent-foreground/80 nav-submenu-description">
                                       {t(`common:nav.subPages.descriptions.${subPage.href.replace('/products/', '').replace('/education/', '').replace('-', '')}`)}
                                     </p>
                                  </Link>
                                </NavigationMenuLink>
                              );
                            })}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                
                return (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={localizedHref}
                        className={`flex h-10 items-center text-sm font-medium leading-none transition-all duration-200 hover:text-primary px-3 relative group ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {t(item.name)}
                        <span className={`absolute bottom-[2px] h-0.5 bg-primary transform transition-transform duration-200 left-4 right-4 ${
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`} />
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              size="sm" 
              className="gradient-bg text-white shadow-primary"
              asChild
            >
              <a 
                href={AUTH_URLS.REGISTRATION} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick({ buttonType: 'get-trading-account', buttonLocation: 'header-desktop' })}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {t('auth.getTradingAccount')}
              </a>
            </Button>

            {/* TNM AI dropdown button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-500/70 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-semibold">TNM AI</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={getLocalizedPathForNav("/tnm-pro")} className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={getLocalizedPathForNav("/tnm-pro?tab=signin")} className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In to AI
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={getLocalizedPathForNav("/tnm-pro?tab=signup")} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Sign Up for AI
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
            <LanguageToggle />
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 touch-target focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={t('common:navigation.openMenu', 'Open navigation menu')}
                title={t('common:navigation.openMenu', 'Open navigation menu')}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "left" : "right"} className="w-[300px] sm:w-[400px]">
              <div className={`flex flex-col ${SPACING.stack.comfortable} mt-8`}>
                {navigation.map((item) => {
                  const localizedHref = getLocalizedPathForNav(item.href);
                  const pathLocalizedHref = getLocalizedPath(item.href, pathLang);
                  const isActive =
                    location.pathname === pathLocalizedHref ||
                    (pathLang === 'ar' && location.pathname.slice(3) === item.href) ||
                    (item.subPages &&
                      item.subPages.some((sub) => {
                        const subPathHref = getLocalizedPath(sub.href, pathLang);
                        return (
                          location.pathname === subPathHref ||
                          (pathLang === 'ar' && location.pathname.slice(3) === sub.href)
                        );
                      }));
                  
                  return (
                    <div key={item.name} className={SPACING.stack.normal}>
                      <div className="flex items-center justify-between">
                        <Link
                          to={localizedHref}
                          className={`text-base font-semibold transition-colors hover:text-primary ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => {
                            setMobileMenuOpen(false);
                          }}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {t(item.name)}
                        </Link>
                        {item.subPages && (
                          <button
                            type="button"
                            aria-label={openDropdown === item.name ? t('common.collapse') : t('common.expand')}
                            aria-expanded={openDropdown === item.name}
                            aria-controls={`mobile-submenu-${item.name}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === item.name ? null : item.name);
                            }}
                            className={`flex items-center justify-center p-2 rounded-md transition-colors ${SPACING.touch.min} touch-target flex-shrink-0 ${isRTL ? 'ml-2' : 'mr-2'} ${
                              openDropdown === item.name 
                                ? 'bg-accent text-accent-foreground' 
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                openDropdown === item.name ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                       )}
                      </div>
                       {item.subPages && openDropdown === item.name && (
                         <div id={`mobile-submenu-${item.name}`} className={`${isRTL ? 'mr-6 border-r pr-4' : 'ml-6 border-l pl-4'} ${SPACING.stack.normal} border-border/50 animate-fade-in`}>

                          {item.subPages.map((subPage) => {
                            const subLocalizedHref = getLocalizedPathForNav(subPage.href);
                            const subPathHref = getLocalizedPath(subPage.href, pathLang);
                            const subIsActive =
                              location.pathname === subPathHref ||
                              (pathLang === 'ar' && location.pathname.slice(3) === subPage.href);

                            return (
                              <div key={subPage.name} className={SPACING.stack.tight}>
                                <Link
                                  to={subLocalizedHref}
                                  className={`block text-sm font-medium transition-colors hover:text-primary ${
                                    subIsActive
                                      ? "text-primary"
                                      : "text-foreground"
                                  }`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  aria-current={subIsActive ? "page" : undefined}
                                >
                                  {t(subPage.name)}
                                </Link>
                                 <p className="text-xs text-muted-foreground leading-relaxed nav-submenu-description">
                                   {t(`common:nav.subPages.descriptions.${subPage.href.replace('/products/', '').replace('/education/', '').replace('-', '')}`)}
                                 </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* TNM AI Featured Section - Premium Highlight */}
                <div className={`${SPACING.stack.normal} -mx-6`}>
                  <div className="relative px-6 py-4 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 border-y border-purple-500/20">
                    {/* Premium Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] px-2 py-0.5">
                        Premium AI
                      </Badge>
                    </div>
                    
                    {/* Header with Icon */}
                    <div className={`flex items-center ${SPACING.gap.small} mb-3`}>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          TNM AI Platform
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t('nav.tnmAi.tagline')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Prominent Design */}
                    {isAuthenticated ? (
                      <>
                        <Button 
                          className="w-full gradient-bg text-white shadow-lg mb-2"
                          asChild
                        >
                          <Link to={getLocalizedPathForNav("/tnm-pro")} onClick={() => setMobileMenuOpen(false)}>
                            <LayoutDashboard className="h-4 w-4" />
                            {t('nav.tnmAi.goToDashboard')}
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-purple-500/30 hover:bg-purple-500/10"
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          {t('nav.tnmAi.signOut')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          className="w-full gradient-bg text-white shadow-lg mb-2"
                          asChild
                        >
                          <Link to={getLocalizedPathForNav("/tnm-pro?tab=signup")} onClick={() => setMobileMenuOpen(false)}>
                            <Sparkles className="h-4 w-4" />
                            {t('nav.tnmAi.startFree')}
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-purple-500/30 hover:bg-purple-500/10"
                          asChild
                        >
                          <Link to={getLocalizedPathForNav("/tnm-pro?tab=signin")} onClick={() => setMobileMenuOpen(false)}>
                            <LogIn className="h-4 w-4" />
                            {t('nav.tnmAi.signIn')}
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className={`flex flex-col ${SPACING.stack.normal} pt-6 border-t`}>
                  {/* Main website auth button */}
                  <Button 
                    className={`gradient-bg text-white shadow-primary ${SPACING.gap.small}`}
                    asChild
                  >
                    <a 
                      href={AUTH_URLS.REGISTRATION} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackButtonClick({ buttonType: 'get-trading-account', buttonLocation: 'header-mobile' });
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4" />
                      {t('auth.getTradingAccount')}
                    </a>
                  </Button>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('common.language')}</span>
                    <div className="flex-shrink-0">
                      <LanguageToggle size="mobile" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('common.theme')}</span>
                    <div className="flex-shrink-0">
                      <ThemeToggle size="mobile" />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}