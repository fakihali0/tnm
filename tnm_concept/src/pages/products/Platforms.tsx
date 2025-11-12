import { useState, useEffect, useMemo } from "react";
import { motion, type Transition } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import PlatformAnimations from "@/components/platforms/PlatformAnimations";
import { MotionAccordionItem } from "@/components/ui/motion-accordion-item";
import { SPACING } from "@/styles/spacing";
import { 
  Download, Monitor, Laptop, Smartphone, Check, Globe, BarChart3, Settings, Users, 
  Apple, Chrome, Play, ArrowRight, ChevronRight, Copy, 
  TrendingUp, Shield, Zap, Clock, AlertTriangle, HelpCircle, CheckCircle,
  Calculator, PieChart, Calendar, CreditCard, ExternalLink, Server,
  Activity, Signal, Target, Bell, Eye, LineChart, Layers, MousePointer
} from "lucide-react";

// Device detection utility
const detectOS = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'windows';
  if (userAgent.includes('Mac')) return 'macos';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  if (userAgent.includes('Android')) return 'android';
  return 'windows'; // fallback
};

// Device configuration with translation support
const getDeviceConfig = (t: any) => ({
  windows: {
    name: t('platforms.deviceConfig.windows'),
    icon: Monitor,
    downloadUrl: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe',
    specs: { version: 'v5.0.39', size: '~45MB', updated: '2024-09-10' },
    features: { multiChart: true, oneClick: true, indicators: true, eas: true, alerts: true },
    screenshots: ['/screenshots/mt5-windows-1.jpg', '/screenshots/mt5-windows-2.jpg']
  },
  macos: {
    name: t('platforms.deviceConfig.macos'),
    icon: Laptop,
    downloadUrl: 'https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5.dmg',
    specs: { version: 'v5.0.39', size: '~38MB', updated: '2024-09-10' },
    features: { multiChart: true, oneClick: true, indicators: true, eas: true, alerts: true },
    screenshots: ['/screenshots/mt5-mac-1.jpg', '/screenshots/mt5-mac-2.jpg']
  },
  web: {
    name: t('platforms.deviceConfig.web'),
    icon: Globe,
    downloadUrl: 'https://trade.mql5.com/trade',
    specs: { version: t('platforms.deviceSpecs.webBased'), size: t('platforms.deviceSpecs.noDownload'), updated: t('platforms.deviceSpecs.alwaysCurrent') },
    features: { multiChart: true, oneClick: true, indicators: true, eas: false, alerts: true },
    screenshots: ['/screenshots/mt5-web-1.jpg', '/screenshots/mt5-web-2.jpg']
  },
  ios: {
    name: t('platforms.deviceConfig.ios'),
    icon: Smartphone,
    downloadUrl: 'https://apps.apple.com/app/metatrader-5/id413251709',
    specs: { version: 'v5.0.3700', size: '~65MB', updated: '2024-09-05' },
    features: { multiChart: false, oneClick: true, indicators: true, eas: false, alerts: true },
    screenshots: ['/screenshots/mt5-ios-1.jpg', '/screenshots/mt5-ios-2.jpg']
  },
  android: {
    name: t('platforms.deviceConfig.android'),
    icon: Smartphone,
    downloadUrl: 'https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5',
    specs: { version: 'v5.0.3700', size: '~45MB', updated: '2024-09-05' },
    features: { multiChart: false, oneClick: true, indicators: true, eas: false, alerts: true },
    screenshots: ['/screenshots/mt5-android-1.jpg', '/screenshots/mt5-android-2.jpg']
  }
});

// Server list with translation support
const getServerList = (t: any) => [
  { name: "Trade'n More-Real", type: t('platforms.setup.serverList.real') },
  { name: "Trade'n More-Demo", type: t('platforms.setup.serverList.demo') },
  { name: "Trade'n More-ECN", type: t('platforms.setup.serverList.ecn') }
];

// Feature highlights with translation support
const getFeatureHighlights = (t: any) => [
  { icon: BarChart3, title: t('platforms.highlights.advancedCharting'), description: t('platforms.highlights.chartingDesc') },
  { icon: Calculator, title: t('platforms.highlights.indicators'), description: t('platforms.highlights.indicatorsDesc') },
  { icon: MousePointer, title: t('platforms.highlights.oneClick'), description: t('platforms.highlights.oneClickDesc') },
  { icon: Layers, title: t('platforms.highlights.dom'), description: t('platforms.highlights.domDesc') },
  { icon: Smartphone, title: t('platforms.highlights.mobile'), description: t('platforms.highlights.mobileDesc') },
  { icon: Bell, title: t('platforms.highlights.alerts'), description: t('platforms.highlights.alertsDesc') }
];

// System requirements with translation support
const getSystemRequirements = (t: any) => [
  {
    platform: t('platforms.deviceConfig.windows'),
    os: t('platforms.systemReq.requirements.windows.os'),
    cpu: t('platforms.systemReq.requirements.windows.cpu'),
    ram: t('platforms.systemReq.requirements.windows.ram'),
    disk: t('platforms.systemReq.requirements.windows.disk'),
    network: t('platforms.systemReq.requirements.windows.network')
  },
  {
    platform: t('platforms.deviceConfig.macos'), 
    os: t('platforms.systemReq.requirements.macos.os'),
    cpu: t('platforms.systemReq.requirements.macos.cpu'),
    ram: t('platforms.systemReq.requirements.macos.ram'),
    disk: t('platforms.systemReq.requirements.macos.disk'),
    network: t('platforms.systemReq.requirements.macos.network')
  },
  {
    platform: t('platforms.deviceConfig.ios'),
    os: t('platforms.systemReq.requirements.ios.os'),
    cpu: t('platforms.systemReq.requirements.ios.cpu'),
    ram: t('platforms.systemReq.requirements.ios.ram'),
    disk: t('platforms.systemReq.requirements.ios.disk'),
    network: t('platforms.systemReq.requirements.ios.network')
  },
  {
    platform: t('platforms.deviceConfig.android'),
    os: t('platforms.systemReq.requirements.android.os'),
    cpu: t('platforms.systemReq.requirements.android.cpu'),
    ram: t('platforms.systemReq.requirements.android.ram'), 
    disk: t('platforms.systemReq.requirements.android.disk'),
    network: t('platforms.systemReq.requirements.android.network')
  },
  {
    platform: t('platforms.systemReq.requirements.web.platform'),
    os: t('platforms.systemReq.requirements.web.os'),
    cpu: t('platforms.systemReq.requirements.web.cpu'),
    ram: t('platforms.systemReq.requirements.web.ram'),
    disk: t('platforms.systemReq.requirements.web.disk'),
    network: t('platforms.systemReq.requirements.web.network')
  }
];

// Troubleshooting data with translation support
const getTroubleshootingData = (t: any) => [
  {
    issue: t('platforms.troubleshooting.serverConnection.issue'),
    solutions: t('platforms.troubleshooting.serverConnection.solutions', { returnObjects: true })
  },
  {
    issue: t('platforms.troubleshooting.priceUpdates.issue'),
    solutions: t('platforms.troubleshooting.priceUpdates.solutions', { returnObjects: true })
  },
  {
    issue: t('platforms.troubleshooting.loginFailed.issue'),
    solutions: t('platforms.troubleshooting.loginFailed.solutions', { returnObjects: true })
  },
  {
    issue: t('platforms.troubleshooting.pushNotifications.issue'),
    solutions: t('platforms.troubleshooting.pushNotifications.solutions', { returnObjects: true })
  },
  {
    issue: t('platforms.troubleshooting.webTerminal.issue'),
    solutions: t('platforms.troubleshooting.webTerminal.solutions', { returnObjects: true })
  }
];

// FAQ data with translation support
const getFaqData = (t: any) => [
  {
    question: t('platforms.faq.items.free.question'),
    answer: t('platforms.faq.items.free.answer')
  },
  {
    question: t('platforms.faq.items.accountTypes.question'),
    answer: t('platforms.faq.items.accountTypes.answer')
  },
  {
    question: t('platforms.faq.items.eas.question'),
    answer: t('platforms.faq.items.eas.answer')
  },
  {
    question: t('platforms.faq.items.multiDevice.question'),
    answer: t('platforms.faq.items.multiDevice.answer')
  },
  {
    question: t('platforms.faq.items.serverDetails.question'),
    answer: t('platforms.faq.items.serverDetails.answer')
  }
];

// How-to cards with translation support
const getHowToCards = (t: any) => [
  {
    title: t('platforms.howTo.addSymbols.title'),
    steps: t('platforms.howTo.addSymbols.steps', { returnObjects: true })
  },
  {
    title: t('platforms.howTo.pendingOrders.title'),
    steps: t('platforms.howTo.pendingOrders.steps', { returnObjects: true })
  },
  {
    title: t('platforms.howTo.chartTemplate.title'),
    steps: t('platforms.howTo.chartTemplate.steps', { returnObjects: true })
  },
  {
    title: t('platforms.howTo.priceAlerts.title'),
    steps: t('platforms.howTo.priceAlerts.steps', { returnObjects: true })
  }
];

export default function Platforms() {
  const { t, i18n } = useTranslation();
  const { localizePath } = useLocalizedPath();
  const [detectedOS, setDetectedOS] = useState<string>('');
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [selectedServer, setSelectedServer] = useState('');
  const [loginData, setLoginData] = useState({ login: '', password: '' });
  const [openHowTo, setOpenHowTo] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Get translated data
  const deviceConfig = getDeviceConfig(t);
  const serverList = getServerList(t);
  const featureHighlights = getFeatureHighlights(t);
  const systemRequirements = getSystemRequirements(t);
  const troubleshootingData = useMemo(() => {
    const items = getTroubleshootingData(t).map((item: any) => ({
      issue: item.issue,
      solutions: Array.isArray(item.solutions)
        ? item.solutions
        : item.solutions
        ? [String(item.solutions)]
        : []
    }));

    if (items.some(d => !Array.isArray(d.solutions) || d.solutions.length === 0)) {
      const enBundle: any = i18n.getResourceBundle('en', 'common')?.platforms?.troubleshooting;
      if (enBundle) {
        return [
          { issue: enBundle.serverConnection.issue, solutions: enBundle.serverConnection.solutions },
          { issue: enBundle.priceUpdates.issue, solutions: enBundle.priceUpdates.solutions },
          { issue: enBundle.loginFailed.issue, solutions: enBundle.loginFailed.solutions },
          { issue: enBundle.pushNotifications.issue, solutions: enBundle.pushNotifications.solutions },
          { issue: enBundle.webTerminal.issue, solutions: enBundle.webTerminal.solutions }
        ];
      }
    }

    return items;
  }, [t, i18n.language]);

  const faqData = useMemo(() => {
    const items = getFaqData(t).filter((f: any) => f?.question && f?.answer);
    if (!items.length) {
      const enFaq: any = i18n.getResourceBundle('en', 'common')?.platforms?.faq?.items;
      if (enFaq) {
        return [
          { question: enFaq.free.question, answer: enFaq.free.answer },
          { question: enFaq.accountTypes.question, answer: enFaq.accountTypes.answer },
          { question: enFaq.eas.question, answer: enFaq.eas.answer },
          { question: enFaq.multiDevice.question, answer: enFaq.multiDevice.answer },
          { question: enFaq.serverDetails.question, answer: enFaq.serverDetails.answer }
        ];
      }
    }
    return items;
  }, [t, i18n.language]);

  const howToCards = getHowToCards(t);
  
  // RTL support
  const isRTL = i18n.language === 'ar';

  // Initialize when translations and OS detection are ready
  useEffect(() => {
    const initializePlatform = () => {
      const os = detectOS();
      setDetectedOS(os);
      setActiveDevice(os);
      setIsReady(true);
      
      // Track page view
      trackButtonClick({ buttonType: 'page-view', buttonLocation: 'mt5-platform' });
    };
    
    // Initialize immediately - don't wait for i18n
    if (!isReady) {
      initializePlatform();
    }
  }, [isReady]);

  // Force re-render when device changes to ensure currentDevice updates
  useEffect(() => {
    console.log('Active device changed to:', activeDevice);
  }, [activeDevice]);

  const handleDeviceChange = (device: string) => {
    console.log('Changing device from', activeDevice, 'to', device);
    setIsSwitchingDevice(true);
    setActiveDevice(device);
    trackButtonClick({ buttonType: 'mt5_tab_switch', buttonLocation: device });
    
    // Reset switching state after a short delay to allow content to update
    setTimeout(() => setIsSwitchingDevice(false), 300);
  };

  const handleDownload = (device: string) => {
    const config = deviceConfig[device as keyof typeof deviceConfig];
    if (device === 'web') {
      window.open(config.downloadUrl, '_blank');
    } else {
      window.open(config.downloadUrl, '_blank');
    }
    trackButtonClick({ buttonType: 'mt5_hero_download_click', buttonLocation: device });
  };

  const handleStepNext = (step: number) => {
    setSetupStep(step + 1);
    trackButtonClick({ buttonType: 'mt5_setup_step_next', buttonLocation: `step-${step}` });
  };

  const copyServerName = (serverName: string) => {
    navigator.clipboard.writeText(serverName);
    trackButtonClick({ buttonType: 'mt5_server_copy', buttonLocation: serverName });
  };

  const {
    motionProps,
    transition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.3, delay: 0.05 });

  // Add state to track if device is switching to reduce animations
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

  const buildReveal = (baseTransition: Transition, distance = 48) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "up", distance, transition: baseTransition }),
      prefersReducedMotion || isSwitchingDevice
    );
  const buildFade = (baseTransition: Transition) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "none", transition: baseTransition }),
      prefersReducedMotion || isSwitchingDevice
    );
  const buildStagger = (baseTransition: Transition, stagger = 0.12, offset = 0) =>
    createStaggerContainer({
      stagger,
      delayChildren: (baseTransition.delay ?? 0) + offset,
      enabled: !prefersReducedMotion && !isSwitchingDevice
    });

  const heroVariants = buildReveal(transition, 72);
  const heroFade = buildFade(transition);
  const heroStagger = buildStagger(transition, 0.1, 0.05);
  const tabsVariants = buildReveal(transition, 56);
  const tabsFade = buildFade(transition);
  const tabsStagger = buildStagger(transition, 0.14, 0.05);
  const cardReveal = buildReveal(transition, 32);
  const setupVariants = buildReveal(transition, 52);
  const setupFade = buildFade(transition);
  const setupStagger = buildStagger(transition, 0.1, 0.05);
  const featureVariants = buildReveal(transition, 48);
  const featureFade = buildFade(transition);
  const featureStagger = buildStagger(transition, 0.12, 0.05);
  const toolsVariants = buildReveal(transition, 44);
  const toolsFade = buildFade(transition);
  const toolsStagger = buildStagger(transition, 0.12, 0.05);
  const requirementsVariants = buildReveal(transition, 48);
  const requirementsFade = buildFade(transition);
  const howToVariants = buildReveal(transition, 48);
  const howToFade = buildFade(transition);
  const howToStagger = buildStagger(transition, 0.12, 0.05);
  const troubleshootVariants = buildReveal(transition, 44);
  const troubleshootFade = buildFade(transition);
  const troubleshootStagger = buildStagger(transition, 0.12, 0.05);
  const faqVariants = buildReveal(transition, 44);
  const faqFade = buildFade(transition);
  const faqStagger = buildStagger(transition, 0.12, 0.05);
  const ctaVariants = buildReveal(transition, 36);
  const ctaFade = buildFade(transition);

  // Add validation and fallback for currentDevice
  const currentDevice = useMemo(() => {
    if (!isReady || !activeDevice) {
      return null;
    }
    const device = deviceConfig[activeDevice as keyof typeof deviceConfig];
    if (!device) {
      console.warn(`Device config not found for: ${activeDevice}, falling back to windows`);
      return deviceConfig.windows;
    }
    return device;
  }, [deviceConfig, activeDevice, isReady]);

  // Show loading state until ready
  if (!isReady || !currentDevice) {
    return (
      <Layout>
        <div className="py-20 bg-gradient-to-b from-light-bg/50 to-background">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="flex justify-center gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 w-24 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* OS-Aware Hero */}
      <motion.section
        className="py-20 bg-gradient-to-b from-light-bg/50 to-background relative overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        {...motionProps}
        variants={heroVariants}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 hero-gradient opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        {/* Platform Technology Animations */}
        <PlatformAnimations />

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl" />

        <motion.div className="container relative z-10" variants={heroFade}>
          <motion.div className="mx-auto max-w-4xl text-center" variants={heroFade}>
            <motion.h1 className="font-poppins text-4xl lg:text-5xl font-bold tracking-tight mb-6" variants={heroFade}>
              {t('platforms.hero.title').split('MetaTrader 5').map((part, index) =>
                index === 0 ? part : (
                  <span key={index}>
                    <span className="gradient-text">MetaTrader 5</span>
                    {part}
                  </span>
                )
              )}
            </motion.h1>
            <motion.p className="mx-auto text-xl text-muted-foreground max-w-3xl mx-auto mb-8" variants={heroFade}>
              {t('platforms.hero.subtitle')}
            </motion.p>

            {/* Device Selector Chips */}
            <motion.div className={`mt-10 flex flex-wrap justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} variants={heroStagger}>
              {Object.entries(deviceConfig).map(([key, device]) => (
                <motion.div key={key} variants={cardReveal}>
                  <Button
                    variant={activeDevice === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDeviceChange(key)}
                    className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <device.icon className="h-4 w-4" />
                    {device.name}
                  </Button>
                </motion.div>
              ))}
            </motion.div>

            {/* Primary CTA */}
            <motion.div className="mt-10 mobile-flex items-center justify-center" variants={heroFade}>
              <Button
                size="mobile"
                className={`gradient-bg text-white shadow-primary gap-2 touch-feedback no-tap-highlight w-full sm:w-auto ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => handleDownload(activeDevice)}
              >
                <Download className="h-5 w-5" />
                {activeDevice === 'web' ? t('platforms.hero.launchButton') : `${t('platforms.hero.downloadButton')} ${currentDevice.name}`}
              </Button>

              {/* Secondary CTAs */}
              <div className={`flex flex-wrap justify-center gap-4 text-sm mt-4 sm:mt-0 ${isRTL ? 'sm:mr-4' : 'sm:ml-4'}`}>
                <Button variant="outline" size="mobile" className="border-primary text-primary hover:bg-primary hover:text-white touch-feedback no-tap-highlight w-full sm:w-auto" asChild>
                  <a href="#setup">{t('platforms.hero.connectButton')}</a>
                </Button>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div className="mt-20 md:mt-24 flex flex-wrap items-center justify-center gap-4 md:gap-8 lg:gap-10" variants={heroStagger}>
              <motion.div className={`flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px] ${isRTL ? 'flex-row-reverse' : ''}`} variants={cardReveal}>
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('platforms.hero.badges.lowLatency')}</span>
              </motion.div>

              <motion.div className={`flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px] ${isRTL ? 'flex-row-reverse' : ''}`} variants={cardReveal}>
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('platforms.hero.badges.secureAccess')}</span>
              </motion.div>

              <motion.div className={`flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px] ${isRTL ? 'flex-row-reverse' : ''}`} variants={cardReveal}>
                <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('platforms.hero.badges.multiDevice')}</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Device Tabs */}
      <motion.section className="py-16 border-b" {...motionProps} variants={tabsVariants}>
        <motion.div className="container" variants={tabsFade}>
          <Tabs value={activeDevice} onValueChange={handleDeviceChange} className="w-full">
            <motion.div variants={tabsFade}>
              <TabsList className="grid w-full grid-cols-5 mb-8">
                {Object.entries(deviceConfig).map(([key, device]) => (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    <device.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{device.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {Object.entries(deviceConfig).map(([key, device]) => {
              // Add validation for device data
              if (!device || !device.name) {
                console.warn(`Invalid device data for key: ${key}`);
                return null;
              }
              
              return (
                <TabsContent key={key} value={key} className="space-y-6">
                  <motion.div className="grid md:grid-cols-2 gap-8" variants={tabsStagger}>
                    {/* Download/Launch Block */}
                    <motion.div variants={cardReveal}>
                      <Card>
                        <CardHeader>
                          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <device.icon className="h-5 w-5" />
                            {t('platforms.tabs.title')} {device.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="text-sm text-muted-foreground space-y-1">
                             <div>{t('platforms.deviceSpecs.version')}: {device.specs?.version || 'N/A'}</div>
                             <div>{t('platforms.deviceSpecs.size')}: {device.specs?.size || 'N/A'}</div>
                             <div>{t('platforms.deviceSpecs.updated')}: {device.specs?.updated || 'N/A'}</div>
                           </div>

                          <Button
                            className={`w-full gradient-bg text-white gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                            onClick={() => handleDownload(key)}
                          >
                            {key === 'web' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                            {key === 'web' ? t('platforms.hero.launchButton') : `${t('platforms.hero.downloadButton')} ${device.name}`}
                          </Button>

                          {key !== 'web' && (
                            <p className="text-xs text-muted-foreground text-center">
                              If download doesn't start, <a href={device.downloadUrl} className="text-primary underline">click here</a>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Supported Features */}
                    <motion.div variants={cardReveal}>
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('platforms.features.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <span className="text-sm">{t('platforms.features.multiChart')}</span>
                               {device.features?.multiChart ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm">{t('platforms.features.oneClick')}</span>
                               {device.features?.oneClick ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm">{t('platforms.features.indicators')}</span>
                               {device.features?.indicators ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm">{t('platforms.features.expertAdvisors')}</span>
                               {device.features?.eas ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm">{t('platforms.features.alerts')}</span>
                               {device.features?.alerts ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </TabsContent>
              );
            }).filter(Boolean)}
          </Tabs>
        </motion.div>
      </motion.section>

      {/* Guided Setup Wizard */}
      <motion.section id="setup" className="py-16 bg-muted/20" {...motionProps} variants={setupVariants}>
        <motion.div className="container" variants={setupFade}>
          <motion.div className="text-center mb-12" variants={setupFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={setupFade}>
              {t('platforms.guidedSetup.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={setupFade}>
              {t('platforms.guidedSetup.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-4xl mx-auto" variants={setupFade}>
            <motion.div className="grid md:grid-cols-3 gap-6" variants={setupStagger}>
              {/* Step 1: Install/Launch */}
              <motion.div variants={cardReveal}>
                <Card className={setupStep === 1 ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                      <CardTitle className="text-lg">{t('platforms.guidedSetup.step1.title')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full gradient-bg text-white gap-2"
                      onClick={() => handleDownload(activeDevice)}
                    >
                      <Download className="h-4 w-4" />
                      {activeDevice === 'web' ? t('platforms.guidedSetup.step1.openWebButton') : `${t('platforms.guidedSetup.step1.downloadButton')} ${currentDevice.name}`}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {t('platforms.guidedSetup.step1.downloadNote')} <a href={currentDevice.downloadUrl} className="text-primary underline">{t('platforms.guidedSetup.step1.clickHere')}</a>
                    </p>
                    {setupStep === 1 && (
                      <Button variant="outline" className="w-full" onClick={() => handleStepNext(1)}>
                        {t('platforms.guidedSetup.step1.continue')} <ArrowRight className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 2: Connect to Server */}
              <motion.div variants={cardReveal}>
                <Card className={setupStep === 2 ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                      <CardTitle className="text-lg">{t('platforms.guidedSetup.step2.title')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="server-select">{t('platforms.guidedSetup.step2.serverLabel')}</Label>
                      <Select value={selectedServer} onValueChange={setSelectedServer}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('platforms.guidedSetup.step2.serverPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {serverList.map((server) => (
                            <SelectItem key={server.name} value={server.name}>
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                {server.name}
                                <Badge variant="secondary" className="ml-auto">{server.type}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedServer && (
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{selectedServer}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyServerName(selectedServer)}
                            className="h-auto p-1"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('platforms.guidedSetup.step2.serverNote')}
                    </p>
                    {setupStep === 2 && selectedServer && (
                      <Button variant="outline" className="w-full" onClick={() => handleStepNext(2)}>
                        {t('platforms.guidedSetup.step2.continue')} <ArrowRight className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Step 3: Log In & Verify */}
              <motion.div variants={cardReveal}>
                <Card className={setupStep === 3 ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                      <CardTitle className="text-lg">{t('platforms.guidedSetup.step3.title')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="login">{t('platforms.guidedSetup.step3.loginLabel')}</Label>
                        <Input
                          id="login"
                          placeholder={t('platforms.guidedSetup.step3.loginPlaceholder')}
                          value={loginData.login}
                          onChange={(e) => setLoginData({...loginData, login: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">{t('platforms.guidedSetup.step3.passwordLabel')}</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder={t('platforms.guidedSetup.step3.passwordPlaceholder')}
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('platforms.guidedSetup.step3.verifyItems.connection')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('platforms.guidedSetup.step3.verifyItems.marketWatch')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('platforms.guidedSetup.step3.verifyItems.timezone')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full" variant="outline" asChild>
                        <a href={localizePath("/products/account-types")}>
                          {t('platforms.guidedSetup.step3.compareAccounts')}
                        </a>
                      </Button>
                      <Button className="w-full" variant="outline" asChild>
                        <a href={localizePath("/products/trading-instruments")}>
                          {t('platforms.guidedSetup.step3.seeInstruments')}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div className="text-center mt-8" variants={setupFade}>
              <Button variant="link" asChild>
                <a href="#troubleshooting">{t('platforms.guidedSetup.troubleLink')}</a>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Feature Highlights */}
      <motion.section id="features" className="py-16" {...motionProps} variants={featureVariants}>
        <motion.div className="container" variants={featureFade}>
          <motion.div className="text-center mb-12" variants={featureFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={featureFade}>
              {t('platforms.highlights.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={featureFade}>
              {t('platforms.hero.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" variants={featureStagger}>
            {featureHighlights.map((feature, index) => (
              <motion.div key={index} variants={cardReveal}>
                <Card className="trading-card text-center p-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-bg mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Tools & Add-ons */}
      <motion.section className="py-12 border-y bg-muted/10" {...motionProps} variants={toolsVariants}>
        <motion.div className="container" variants={toolsFade}>
          <motion.div className="grid md:grid-cols-4 gap-4" variants={toolsStagger}>
            <motion.div variants={cardReveal}>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">{t('products.mt5.tools.economicCalendar')}</h4>
                <Button variant="link" size="sm" asChild>
                  <a href={localizePath('/products/trading-tools', { hash: 'economic-calendar' })}>
                    {t('products.mt5.tools.viewCalendar')}
                  </a>
                </Button>
              </Card>
            </motion.div>
            <motion.div variants={cardReveal}>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">{t('products.mt5.tools.riskCalculator')}</h4>
                <Button variant="link" size="sm" asChild>
                  <a href={localizePath('/products/trading-tools', { hash: 'trading-calculator' })}>
                    {t('products.mt5.tools.tryCalculator')}
                  </a>
                </Button>
              </Card>
            </motion.div>
            <motion.div variants={cardReveal}>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">{t('products.mt5.tools.educationHub')}</h4>
                <Button variant="link" size="sm" asChild>
                  <a href={localizePath('/education')}>
                    {t('products.mt5.tools.learnTrading')}
                  </a>
                </Button>
              </Card>
            </motion.div>
            <motion.div variants={cardReveal}>
              <Card className="text-center p-4 hover:shadow-md transition-shadow">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">{t('products.mt5.tools.paymentMethods')}</h4>
                <Button variant="link" size="sm" asChild>
                  <a href={localizePath('/products/payment-methods')}>
                    {t('products.mt5.tools.viewMethods')}
                  </a>
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* System Requirements */}
      <motion.section id="requirements" className="py-16 bg-muted/20" {...motionProps} variants={requirementsVariants}>
        <motion.div className="container" variants={requirementsFade}>
          <motion.div className="text-center mb-12" variants={requirementsFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={requirementsFade}>
              {t('platforms.systemReq.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={requirementsFade}>
              {t('platforms.systemReq.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-6xl mx-auto overflow-x-auto" variants={requirementsFade}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.platform')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.os')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.cpu')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.ram')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.disk')}</TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>{t('platforms.systemReq.network')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemRequirements.map((req, index) => (
                  <TableRow key={index}>
                    <TableCell className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{req.platform}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>{req.os}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>{req.cpu}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>{req.ram}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>{req.disk}</TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>{req.network}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* How-To Cards */}
      <motion.section id="howto" className="py-16" {...motionProps} variants={howToVariants}>
        <motion.div className="container" variants={howToFade}>
          <motion.div className="text-center mb-12" variants={howToFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={howToFade}>
              {t('platforms.howTo.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={howToFade}>
              {t('platforms.howTo.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto" variants={howToStagger}>
            {howToCards.map((card, index) => (
              <motion.div key={index} variants={cardReveal}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="trading-card cursor-pointer hover:shadow-md transition-all">
                      <CardContent className="p-6 text-center">
                        <HelpCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
                        <h3 className="font-medium text-sm">{card.title}</h3>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{card.title}</DialogTitle>
                      <DialogDescription>Follow these simple steps:</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {card.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm">{step}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="link" asChild>
                        <a href={localizePath("/education")}>Read more detailed guides →</a>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Troubleshooting */}
      <motion.section id="troubleshooting" className="py-16 bg-muted/20" {...motionProps} variants={troubleshootVariants} viewport={{ amount: 0.15, once: true }}>
        <motion.div className="container" variants={troubleshootFade}>
          <motion.div className="text-center mb-12" variants={troubleshootFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={troubleshootFade}>
              {t('platforms.troubleshooting.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={troubleshootFade}>
              {t('platforms.troubleshooting.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-4xl mx-auto" variants={troubleshootFade}>
            <motion.div variants={troubleshootStagger}>
              <Accordion type="single" collapsible>
                {troubleshootingData.map((item, index) => (
                  <MotionAccordionItem key={index} value={`troubleshoot-${index}`} variants={cardReveal}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0" />
                        {item.issue}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-8">
                        {Array.isArray(item.solutions) && item.solutions.length > 0 ? (
                          item.solutions.map((solution: any, solutionIndex: number) => (
                            <div key={solutionIndex} className="flex items-start gap-3">
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{solution}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm">No solutions available</div>
                        )}
                        <div className="mt-4 pt-4 border-t">
                          <Button variant="link" size="sm" asChild>
                            <a href={localizePath("/contact")}>
                              Contact Support →
                            </a>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </MotionAccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FAQs */}
      <motion.section className="py-16" {...motionProps} variants={faqVariants} viewport={{ amount: 0.15, once: true }}>
        <motion.div className="container" variants={faqFade}>
          <motion.div className="text-center mb-12" variants={faqFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={faqFade}>
              {t('platforms.faq.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={faqFade}>
              {t('platforms.faq.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-4xl mx-auto" variants={faqFade}>
            <motion.div variants={faqStagger}>
              <Accordion type="single" collapsible>
                {faqData.map((faq, index) => (
                  <MotionAccordionItem key={index} value={`faq-${index}`} variants={cardReveal}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </MotionAccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5" {...motionProps} variants={ctaVariants}>
        <motion.div className="container" variants={ctaFade}>
          <motion.div className="text-center max-w-2xl mx-auto" variants={ctaFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={ctaFade}>
              {t('platforms.cta.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground mb-8" variants={ctaFade}>
              {t('platforms.cta.subtitle')}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={ctaFade}>
              <Button
                size="lg"
                className="gradient-bg text-white shadow-primary gap-2"
                asChild
              >
                <a
                  href={AUTH_URLS.REGISTRATION}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackButtonClick({ buttonType: 'open-account', buttonLocation: 'platforms-cta' })}
                >
                  <Users className="h-5 w-5" />
                  {t('platforms.cta.primaryButton')}
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => handleDownload(activeDevice)}
              >
                <Download className="h-5 w-5" />
                {t('platforms.cta.secondaryButton')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}