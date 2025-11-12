import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import { AUTH_URLS, redirectToAuth, trackButtonClick } from "@/utils/auth-redirects";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useEffect } from "react";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { ensureLanguage, getLanguageFromPath } from "@/i18n";
import TradingToolsAnimations from "@/components/products/TradingToolsAnimations";
import { SPACING } from "@/styles/spacing";

import { 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Coins, 
  Download, 
  Calculator,
  Calendar,
  ArrowRight,
  Check,
  Monitor,
  Laptop,
  Smartphone,
  Play,
  Shield,
  Zap
} from "lucide-react";

const instruments = [
  {
    icon: TrendingUp,
    key: "forex"
  },
  {
    icon: BarChart3,
    key: "indices"
  },
  {
    icon: Globe,
    key: "commodities"
  },
  {
    icon: Coins,
    key: "crypto"
  }
];

const accountTypes = [
  {
    name: "zero",
    minDeposit: "$0",
    spread: "From 1 pip",
    leverage: "1:200",
    popular: true
  },
  {
    name: "raw",
    minDeposit: "$0",
    spread: "From 0.0 pips",
    leverage: "1:200",
    popular: false
  }
];

export default function Products() {
  const { t, i18n } = useTranslation('common');
  const { localizePath } = useLocalizedPath();
  const asArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);
  const getArray = (key: string): string[] => {
    const lng = i18n.language || 'en';
    const namespaces: Array<'translation' | 'common'> = ['translation', 'common'];
    for (const ns of namespaces) {
      const val = i18n.getResource(lng, ns, key);
      if (Array.isArray(val)) return val as string[];
    }
    for (const ns of namespaces) {
      const val = i18n.getResource('en', ns, key);
      if (Array.isArray(val)) return val as string[];
    }
    return asArray(t(key, { returnObjects: true }));
  };

  // Animation setup
  const {
    motionProps: heroMotion,
    transition: heroTransition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.4, delay: 0.05 });
  
  const { motionProps: instrumentsMotion, transition: instrumentsTransition } = useSectionAnimation({
    amount: 0.35,
    delay: 0.1
  });
  
  const { motionProps: accountsMotion, transition: accountsTransition } = useSectionAnimation({
    amount: 0.3,
    delay: 0.15
  });
  
  const { motionProps: platformMotion, transition: platformTransition } = useSectionAnimation({
    amount: 0.25,
    delay: 0.2
  });
  
  const { motionProps: toolsMotion, transition: toolsTransition } = useSectionAnimation({
    amount: 0.3,
    delay: 0.25
  });

  const buildReveal = (transition: Transition, distance = 48) =>
    resolveMotionVariants(createRevealVariants({ direction: "up", distance, transition }), prefersReducedMotion);
  const buildFade = (transition: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction: "none", transition }), prefersReducedMotion);
  const buildStagger = (transition: Transition, stagger = 0.12) =>
    createStaggerContainer({
      stagger,
      delayChildren: transition.delay ?? 0,
      enabled: !prefersReducedMotion
    });

  // Animation variants
  const heroVariants = buildReveal(heroTransition, 64);
  const heroFade = buildFade(heroTransition);
  const instrumentsVariants = buildReveal(instrumentsTransition, 56);
  const instrumentsFade = buildFade(instrumentsTransition);
  const instrumentCardVariants = buildReveal(instrumentsTransition, 32);
  const instrumentStagger = buildStagger(instrumentsTransition);
  const accountsVariants = buildReveal(accountsTransition, 48);
  const accountsFade = buildFade(accountsTransition);
  const accountCardVariants = buildReveal(accountsTransition, 32);
  const accountStagger = buildStagger(accountsTransition);
  const platformVariants = buildReveal(platformTransition, 40);
  const platformFade = buildFade(platformTransition);
  const platformStagger = buildStagger(platformTransition, 0.08);
  const toolsVariants = buildReveal(toolsTransition, 32);
  const toolsFade = buildFade(toolsTransition);
  const toolsStagger = buildStagger(toolsTransition, 0.1);

  // Ensure language matches URL for this page
  useEffect(() => {
    const expected = getLanguageFromPath(window.location.pathname);
    void ensureLanguage(expected).catch(() => {});
  }, [i18n]);

  return (
    <div dir={i18n.language === "ar" ? "rtl" : "ltr"} key={i18n.language}>
      <Layout>
      {/* Hero Section */}
      <motion.section
        className="min-h-[90vh] flex items-center justify-center overflow-hidden relative"
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        {...heroMotion}
        variants={heroVariants}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 hero-gradient opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        {/* Floating Blur Elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
        
        {/* Background Animations */}
        <TradingToolsAnimations />

        <motion.div className="container relative z-10" variants={heroFade}>
          <motion.div className="mx-auto max-w-5xl text-center space-y-8" variants={heroFade}>
            <motion.h1 
              className="font-poppins text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight" 
              variants={createRevealVariants({ direction: "up", distance: 80 })}
            >
              <Trans 
                i18nKey="products.hero.title"
                components={{
                  gradient: <span className="gradient-text" />
                }}
              />
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed" 
              variants={createRevealVariants({ direction: "up", distance: 60 })}
            >
              {t('products.hero.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className={`flex flex-col sm:flex-row justify-center items-center pt-8 ${SPACING.gap.medium}`}
              variants={createRevealVariants({ direction: "up", distance: 40 })}
            >
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg font-semibold gradient-bg text-white shadow-primary hover:shadow-primary/50 transition-all duration-300"
                asChild
              >
                <a 
                  href={AUTH_URLS.REGISTRATION} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackButtonClick({ buttonType: 'open-account', buttonLocation: 'products-hero' })}
                >
                  {t('auth.startTrading')}
                  <ArrowRight className={`ms-2 ${SPACING.icon.md}`} />
                </a>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-8 text-lg font-semibold border-2 hover:bg-primary/5"
                asChild
              >
                <a 
                  href={AUTH_URLS.DEMO} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => trackButtonClick({ buttonType: 'demo-account', buttonLocation: 'products-hero' })}
                >
                  <Play className={`mr-2 ${SPACING.icon.md}`} />
                  {t('auth.tryDemoAccount')}
                </a>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              className="pt-12"
              variants={createRevealVariants({ direction: "up", distance: 20 })}
            >
              <motion.div className={`flex flex-wrap justify-center items-center opacity-80 ${SPACING.gap.xlarge}`}>
                <motion.div className={`flex items-center text-sm font-medium ${SPACING.gap.button}`}>
                  <div className={`flex items-center justify-center rounded-full bg-primary/10 ${SPACING.icon.xl}`}>
                    <TrendingUp className={`text-primary ${SPACING.icon.sm}`} />
                  </div>
                  <span>{t('products.hero.trustBadges.instruments', { defaultValue: '150+ Instruments' })}</span>
                </motion.div>
                
                <motion.div className={`flex items-center text-sm font-medium ${SPACING.gap.button}`}>
                  <div className={`flex items-center justify-center rounded-full bg-accent/10 ${SPACING.icon.xl}`}>
                    <Zap className={`text-accent ${SPACING.icon.sm}`} />
                  </div>
                  <span>{t('products.hero.trustBadges.commission', { defaultValue: 'Zero Commission' })}</span>
                </motion.div>
                
                <motion.div className={`flex items-center text-sm font-medium ${SPACING.gap.button}`}>
                  <div className={`flex items-center justify-center rounded-full bg-primary/10 ${SPACING.icon.xl}`}>
                    <Shield className={`text-primary ${SPACING.icon.sm}`} />
                  </div>
                  <span>{t('products.hero.trustBadges.platform', { defaultValue: 'Advanced Platform' })}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Trading Instruments */}
      <motion.section
        className="py-16 scroll-mt-24"
        id="instruments"
        {...instrumentsMotion}
        variants={instrumentsVariants}
      >
        <motion.div className="container" variants={instrumentsFade}>
          <motion.h2 className="font-poppins text-3xl font-bold text-center mb-12" variants={instrumentsFade}>
            {t('products.instruments.title')}
          </motion.h2>
          
          {/* Desktop Grid */}
          <motion.div className={`hidden md:grid grid-cols-2 lg:grid-cols-4 ${SPACING.gap.large}`} variants={instrumentStagger}>
            {instruments.map((instrument, index) => (
              <motion.div key={index} variants={instrumentCardVariants}>
                <Card className="trading-card">
                  <CardHeader className="text-center">
                    <div className={`mx-auto flex items-center justify-center rounded-full gradient-bg ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                      <instrument.icon className={`text-white ${SPACING.icon.xl}`} />
                    </div>
                    <CardTitle className="font-poppins">{t(`products.instruments.items.${instrument.key}.title`)}</CardTitle>
                    <CardDescription>{t(`products.instruments.items.${instrument.key}.description`)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex flex-wrap justify-center ${SPACING.gap.small}`}>
                      {getArray(`products.instruments.items.${instrument.key}.pairs`).map((pair, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs min-w-[60px] justify-center">
                          {pair}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile Carousel */}
          <motion.div className="block md:hidden" variants={instrumentsFade}>
            <Carousel className="w-full" opts={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {instruments.map((instrument, index) => (
                  <CarouselItem key={index} className="ps-2 md:ps-4 basis-[85%]">
                  <motion.div variants={instrumentCardVariants}>
                    <Card className="trading-card">
                      <CardHeader className="text-center">
                        <div className={`mx-auto flex items-center justify-center rounded-full gradient-bg ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                          <instrument.icon className={`text-white ${SPACING.icon.xl}`} />
                        </div>
                        <CardTitle className="font-poppins">{t(`products.instruments.items.${instrument.key}.title`)}</CardTitle>
                        <CardDescription>{t(`products.instruments.items.${instrument.key}.description`)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className={`flex flex-wrap justify-center ${SPACING.gap.small}`}>
                          {getArray(`products.instruments.items.${instrument.key}.pairs`).map((pair, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs min-w-[60px] justify-center">
                              {pair}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselDots totalSlides={instruments.length} />
            </Carousel>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Account Types */}
      <motion.section 
        className="py-16 bg-muted/20"
        id="accounts"
        {...accountsMotion}
        variants={accountsVariants}
      >
        <motion.div className="container" variants={accountsFade}>
          <motion.div className="text-center mb-12" variants={accountsFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={accountsFade}>
              {t('products.accountTypes.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={accountsFade}>
              {t('products.accountTypes.subtitle')}
            </motion.p>
          </motion.div>
          
          {/* Desktop Grid */}
          <motion.div className={`hidden md:grid grid-cols-2 max-w-4xl mx-auto ${SPACING.gap.xlarge}`} variants={accountStagger}>
            {accountTypes.map((account, index) => (
              <motion.div key={index} variants={accountCardVariants}>
                <Card 
                  className={`trading-card relative h-full flex flex-col ${
                    account.popular ? 'ring-2 ring-primary shadow-primary' : ''
                  }`}
                >
                  {account.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-bg text-white px-4 py-1">
                      {t(`products.accountTypes.${account.name}.popular`)}
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="font-poppins text-2xl">{t(`products.accountTypes.${account.name}.name`)}</CardTitle>
                  </CardHeader>
                  <CardContent className={`flex-1 flex flex-col ${SPACING.stack.relaxed}`}>
                    <div className={`grid grid-cols-3 text-sm ${SPACING.gap.large}`}>
                      <div className="text-center space-y-1">
                        <div className="text-muted-foreground text-xs font-medium">
                          {t(`products.accountTypes.${account.name}.minDeposit`)}
                        </div>
                        <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.minDepositValue`, { defaultValue: account.minDeposit })}</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-muted-foreground text-xs font-medium">{t(`products.accountTypes.${account.name}.spread`)}</div>
                        <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.spreadValue`, { defaultValue: account.spread })}</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-muted-foreground text-xs font-medium">{t(`products.accountTypes.${account.name}.leverage`)}</div>
                        <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.leverageValue`, { defaultValue: account.leverage })}</div>
                      </div>
                    </div>
                    
                    <div className={`flex-1 ${SPACING.stack.normal}`}>
                      {asArray(t(`products.accountTypes.${account.name}.features`, { returnObjects: true })).map((feature, idx) => (
                        <div key={idx} className={`flex items-start ${SPACING.gap.button}`}>
                          <Check className={`text-primary flex-shrink-0 mt-0.5 ${SPACING.icon.sm}`} />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 mt-auto">
                      <Button 
                        className={`w-full ${SPACING.gap.small} ${account.popular ? 'gradient-bg text-white shadow-primary' : ''}`}
                        variant={account.popular ? 'default' : 'outline'}
                        size="lg"
                        asChild
                      >
                         <a 
                           href={AUTH_URLS.REGISTRATION} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className={`flex items-center justify-center ${SPACING.gap.small}`}
                           onClick={() => trackButtonClick({ buttonType: 'open-account', buttonLocation: `products-${account.name}` })}
                         >
                           {t('products.accountTypes.buttons.openAccount')}
                           <ArrowRight className={SPACING.icon.sm} />
                         </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile Carousel */}
          <motion.div className="block md:hidden max-w-4xl mx-auto" variants={accountsFade}>
            <Carousel className="w-full" opts={{ align: "center", containScroll: "trimSnaps", direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
              <CarouselContent className="-mx-2 pt-8 pb-8">
                {accountTypes.map((account, index) => (
                  <CarouselItem key={index} className="basis-[90%] px-2">
                    <motion.div variants={accountCardVariants}>
                      <Card className={`trading-card relative h-full flex flex-col ${
                        account.popular ? 'ring-2 ring-primary shadow-primary' : ''
                      }`}>
                        {account.popular && (
                          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 gradient-bg text-white px-4 py-1">
                            {t(`products.accountTypes.${account.name}.popular`)}
                          </Badge>
                        )}
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="font-poppins text-2xl">{t(`products.accountTypes.${account.name}.name`)}</CardTitle>
                        </CardHeader>
                        <CardContent className={`flex-1 flex flex-col ${SPACING.stack.relaxed}`}>
                          <div className={`grid grid-cols-3 text-sm ${SPACING.gap.medium}`}>
                            <div className="text-center space-y-1">
                              <div className="text-muted-foreground text-xs font-medium">
                                {t(`products.accountTypes.${account.name}.minDeposit`)}
                              </div>
                              <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.minDepositValue`, { defaultValue: account.minDeposit })}</div>
                            </div>
                            <div className="text-center space-y-1">
                              <div className="text-muted-foreground text-xs font-medium">{t(`products.accountTypes.${account.name}.spread`)}</div>
                              <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.spreadValue`, { defaultValue: account.spread })}</div>
                            </div>
                            <div className="text-center space-y-1">
                              <div className="text-muted-foreground text-xs font-medium">{t(`products.accountTypes.${account.name}.leverage`)}</div>
                              <div className="font-semibold text-base">{t(`products.accountTypes.${account.name}.leverageValue`, { defaultValue: account.leverage })}</div>
                            </div>
                          </div>
                          
                          <div className={`flex-1 ${SPACING.stack.normal}`}>
                            {asArray(t(`products.accountTypes.${account.name}.features`, { returnObjects: true })).map((feature, idx) => (
                              <div key={idx} className={`flex items-start ${SPACING.gap.button}`}>
                                <Check className={`text-primary flex-shrink-0 mt-0.5 ${SPACING.icon.sm}`} />
                                <span className="text-sm leading-relaxed">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 mt-auto">
                            <Button 
                              className={`w-full ${SPACING.gap.small} ${account.popular ? 'gradient-bg text-white shadow-primary' : ''}`}
                              variant={account.popular ? 'default' : 'outline'}
                              size="mobile"
                              asChild
                            >
                              <a 
                                href={AUTH_URLS.REGISTRATION} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={() => trackButtonClick({ buttonType: 'open-account', buttonLocation: `products-${account.name}` })}
                              >
                                {t('products.accountTypes.buttons.openAccount')}
                                <ArrowRight className={SPACING.icon.sm} />
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className={`flex justify-center mt-6 ${SPACING.gap.medium}`}>
                <CarouselPrevious className="relative translate-x-0 translate-y-0" />
                <CarouselNext className="relative translate-x-0 translate-y-0" />
              </div>
            </Carousel>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* MetaTrader 5 Platform */}
      <motion.section 
        className="py-16 scroll-mt-24"
        id="platform"
        {...platformMotion}
        variants={platformVariants}
      >
        <motion.div className="container" variants={platformFade}>
          <motion.div className="max-w-4xl mx-auto" variants={platformFade}>
            <motion.div className="text-center mb-12" variants={platformFade}>
              <motion.h2 className="font-poppins text-3xl font-bold mb-6" variants={platformFade}>
                <Trans 
                  i18nKey="products.mt5.title"
                  components={{
                    gradient: <span className="gradient-text" />
                  }}
                />
              </motion.h2>
              <motion.p className="text-lg text-muted-foreground mb-8" variants={platformFade}>
                {t('products.mt5.subtitle')}
              </motion.p>
            </motion.div>

            {/* Core Features */}
            <motion.div className="mb-12" variants={platformFade}>
              <motion.h3 className="font-poppins text-xl font-semibold mb-6 text-center" variants={platformFade}>
                {t('products.mt5.coreFeatures.title')}
              </motion.h3>
              <motion.div className={`grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto ${SPACING.gap.xlarge}`} variants={platformStagger}>
                <motion.div className={`p-6 rounded-lg border border-border bg-card/50 ${SPACING.stack.comfortable}`} variants={platformFade}>
                  {asArray(t('products.mt5.coreFeatures.list1', { returnObjects: true })).map((feature, idx) => (
                    <div key={idx} className={`flex items-start ${SPACING.gap.button}`}>
                      <Check className={`text-primary flex-shrink-0 mt-0.5 ${SPACING.icon.md}`} />
                      <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.div className={`p-6 rounded-lg border border-border bg-card/50 ${SPACING.stack.comfortable}`} variants={platformFade}>
                  {asArray(t('products.mt5.coreFeatures.list2', { returnObjects: true })).map((feature, idx) => (
                    <div key={idx} className={`flex items-start ${SPACING.gap.button}`}>
                      <Check className={`text-primary flex-shrink-0 mt-0.5 ${SPACING.icon.md}`} />
                      <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Trading Instruments */}
            <motion.div className="mb-12" variants={platformFade}>
              <motion.h3 className="font-poppins text-xl font-semibold mb-6 text-center" variants={platformFade}>
                {t('products.mt5.instruments.title')}
              </motion.h3>
              {/* Desktop Grid */}
              <motion.div className={`hidden md:grid grid-cols-2 lg:grid-cols-4 ${SPACING.gap.large}`} variants={platformStagger}>
                <motion.div className="text-center p-4 rounded-lg bg-muted/20" variants={platformFade}>
                  <TrendingUp className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.forex.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.forex.description')}</p>
                </motion.div>
                <motion.div className="text-center p-4 rounded-lg bg-muted/20" variants={platformFade}>
                  <BarChart3 className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.indices.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.indices.description')}</p>
                </motion.div>
                <motion.div className="text-center p-4 rounded-lg bg-muted/20" variants={platformFade}>
                  <Globe className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.commodities.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.commodities.description')}</p>
                </motion.div>
                <motion.div className="text-center p-4 rounded-lg bg-muted/20" variants={platformFade}>
                  <Coins className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.crypto.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.crypto.description')}</p>
                </motion.div>
              </motion.div>

              {/* Mobile Carousel */}
              <motion.div className="block md:hidden" variants={platformFade}>
                <Carousel className="w-full" opts={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-4 rounded-lg bg-muted/20">
                        <TrendingUp className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.forex.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.forex.description')}</p>
                      </div>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-4 rounded-lg bg-muted/20">
                        <BarChart3 className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.indices.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.indices.description')}</p>
                      </div>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-4 rounded-lg bg-muted/20">
                        <Globe className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.commodities.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.commodities.description')}</p>
                      </div>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-4 rounded-lg bg-muted/20">
                        <Coins className={`text-primary mx-auto mb-3 ${SPACING.icon.xl}`} />
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.instruments.crypto.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.instruments.crypto.description')}</p>
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselDots totalSlides={4} />
                </Carousel>
              </motion.div>
            </motion.div>

            {/* Platform Benefits */}
            <motion.div className="mb-12" variants={platformFade}>
              <motion.h3 className="font-poppins text-xl font-semibold mb-6 text-center" variants={platformFade}>
                {t('products.mt5.benefits.title')}
              </motion.h3>
              {/* Desktop Grid */}
              <motion.div className={`hidden md:grid grid-cols-3 ${SPACING.gap.large}`} variants={platformStagger}>
                <motion.div className="text-center p-6 rounded-lg bg-muted/20" variants={platformFade}>
                  <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                    <TrendingUp className={`text-white ${SPACING.icon.xl}`} />
                  </div>
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.execution.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.execution.description')}</p>
                </motion.div>
                <motion.div className="text-center p-6 rounded-lg bg-muted/20" variants={platformFade}>
                  <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                    <Globe className={`text-white ${SPACING.icon.xl}`} />
                  </div>
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.security.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.security.description')}</p>
                </motion.div>
                <motion.div className="text-center p-6 rounded-lg bg-muted/20" variants={platformFade}>
                  <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                    <BarChart3 className={`text-white ${SPACING.icon.xl}`} />
                  </div>
                  <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.analytics.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.analytics.description')}</p>
                </motion.div>
              </motion.div>

              {/* Mobile Carousel */}
              <motion.div className="block md:hidden" variants={platformFade}>
                <Carousel className="w-full" opts={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-6 rounded-lg bg-muted/20">
                        <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                          <TrendingUp className={`text-white ${SPACING.icon.xl}`} />
                        </div>
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.execution.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.execution.description')}</p>
                      </div>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-6 rounded-lg bg-muted/20">
                        <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                          <Globe className={`text-white ${SPACING.icon.xl}`} />
                        </div>
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.security.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.security.description')}</p>
                      </div>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <div className="text-center p-6 rounded-lg bg-muted/20">
                        <div className={`mx-auto gradient-bg rounded-full flex items-center justify-center ${SPACING.margin.heading} ${SPACING.icon.huge}`}>
                          <BarChart3 className={`text-white ${SPACING.icon.xl}`} />
                        </div>
                        <h4 className={`font-semibold ${SPACING.margin.paragraph}`}>{t('products.mt5.benefits.analytics.title')}</h4>
                        <p className="text-sm text-muted-foreground">{t('products.mt5.benefits.analytics.description')}</p>
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselDots totalSlides={3} />
                </Carousel>
              </motion.div>
            </motion.div>

            {/* Technical Specifications */}
            <motion.div className="mb-12" variants={platformFade}>
              <motion.h3 className="font-poppins text-xl font-semibold mb-6 text-center" variants={platformFade}>
                {t('products.mt5.specifications.title')}
              </motion.h3>
              <motion.div className={`grid grid-cols-2 md:grid-cols-4 text-center ${SPACING.gap.large}`} variants={platformStagger}>
                <motion.div variants={platformFade}>
                  <div className="text-2xl font-bold gradient-text">80+</div>
                  <div className="text-sm text-muted-foreground">{t('products.mt5.specifications.indicators')}</div>
                </motion.div>
                <motion.div variants={platformFade}>
                  <div className="text-2xl font-bold gradient-text">21</div>
                  <div className="text-sm text-muted-foreground">{t('products.mt5.specifications.timeframes')}</div>
                </motion.div>
                <motion.div variants={platformFade}>
                  <div className="text-2xl font-bold gradient-text">6</div>
                  <div className="text-sm text-muted-foreground">{t('products.mt5.specifications.orderTypes')}</div>
                </motion.div>
                <motion.div variants={platformFade}>
                  <div className="text-2xl font-bold gradient-text">4</div>
                  <div className="text-sm text-muted-foreground">{t('products.mt5.specifications.executionTypes')}</div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Download Buttons */}
            <motion.div className="text-center" variants={platformFade}>
              <motion.div className="mb-6" variants={platformFade}>
                <h4 className="text-lg font-semibold text-foreground mb-2">{t('products.mt5.download.title')}</h4>
                <p className="text-muted-foreground">{t('products.mt5.download.subtitle')}</p>
              </motion.div>
              {/* Desktop Grid */}
              <motion.div className={`hidden md:grid grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto ${SPACING.gap.medium}`} variants={platformStagger}>
                <motion.div variants={platformFade}>
                  <Button 
                    size="lg" 
                    className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col ${SPACING.gap.small}`}
                    onClick={() => redirectToAuth(AUTH_URLS.MT5_WINDOWS, 'download-mt5-windows', 'products-mt5-platform')}
                  >
                    <Monitor className={SPACING.icon.lg} />
                    <span>{t('products.mt5.download.windows')}</span>
                  </Button>
                </motion.div>
                <motion.div variants={platformFade}>
                  <Button 
                    size="lg" 
                    className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col ${SPACING.gap.small}`}
                    onClick={() => redirectToAuth(AUTH_URLS.MT5_MACOS, 'download-mt5-macos', 'products-mt5-platform')}
                  >
                    <Laptop className={SPACING.icon.lg} />
                    <span>{t('products.mt5.download.macos')}</span>
                  </Button>
                </motion.div>
                <motion.div variants={platformFade}>
                  <Button 
                    size="lg" 
                    className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col ${SPACING.gap.small}`}
                    onClick={() => redirectToAuth(AUTH_URLS.MT5_IOS, 'download-mt5-ios', 'products-mt5-platform')}
                  >
                    <Smartphone className={SPACING.icon.lg} />
                    <span>{t('products.mt5.download.ios')}</span>
                  </Button>
                </motion.div>
                <motion.div variants={platformFade}>
                  <Button 
                    size="lg" 
                    className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col ${SPACING.gap.small}`}
                    onClick={() => redirectToAuth(AUTH_URLS.MT5_ANDROID, 'download-mt5-android', 'products-mt5-platform')}
                  >
                    <Smartphone className={SPACING.icon.lg} />
                    <span>{t('products.mt5.download.android')}</span>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Mobile Carousel */}
              <motion.div className="block md:hidden max-w-4xl mx-auto" variants={platformFade}>
                <Carousel className="w-full" opts={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <Button 
                        size="lg" 
                        className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col w-full ${SPACING.gap.small}`}
                        onClick={() => redirectToAuth(AUTH_URLS.MT5_WINDOWS, 'download-mt5-windows', 'products-mt5-platform')}
                      >
                        <Monitor className={SPACING.icon.lg} />
                        <span>{t('products.mt5.download.windows')}</span>
                      </Button>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <Button 
                        size="lg" 
                        className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col w-full ${SPACING.gap.small}`}
                        onClick={() => redirectToAuth(AUTH_URLS.MT5_MACOS, 'download-mt5-macos', 'products-mt5-platform')}
                      >
                        <Laptop className={SPACING.icon.lg} />
                        <span>{t('products.mt5.download.macos')}</span>
                      </Button>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <Button 
                        size="lg" 
                        className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col w-full ${SPACING.gap.small}`}
                        onClick={() => redirectToAuth(AUTH_URLS.MT5_IOS, 'download-mt5-ios', 'products-mt5-platform')}
                      >
                        <Smartphone className={SPACING.icon.lg} />
                        <span>{t('products.mt5.download.ios')}</span>
                      </Button>
                    </CarouselItem>
                    <CarouselItem className="ps-2 md:ps-4 basis-[85%]">
                      <Button 
                        size="lg" 
                        className={`gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto flex-col w-full ${SPACING.gap.small}`}
                        onClick={() => redirectToAuth(AUTH_URLS.MT5_ANDROID, 'download-mt5-android', 'products-mt5-platform')}
                      >
                        <Smartphone className={SPACING.icon.lg} />
                        <span>{t('products.mt5.download.android')}</span>
                      </Button>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselDots totalSlides={4} />
                </Carousel>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Trading Tools */}
      <motion.section 
        className="py-16 bg-muted/20"
        id="tools"
        {...toolsMotion}
        variants={toolsVariants}
      >
        <motion.div className="container" variants={toolsFade}>
          <motion.div className="text-center mb-12" variants={toolsFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={toolsFade}>
              {t('products.tradingTools.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={toolsFade}>
              {t('products.tradingTools.subtitle')}
            </motion.p>
          </motion.div>
          
          <motion.div className={`grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto ${SPACING.gap.xlarge}`} variants={toolsStagger}>
            <motion.div variants={toolsFade}>
              <Card className="trading-card">
                <CardHeader>
                  <div className={`flex items-start ${SPACING.gap.medium}`}>
                    <div className="flex-shrink-0 mt-1">
                      <Calculator className={`text-primary ${SPACING.icon.xl}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="font-poppins">{t('products.tradingTools.riskCalculator.title')}</CardTitle>
                      <CardDescription>{t('products.tradingTools.riskCalculator.description')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`text-muted-foreground ${SPACING.margin.headingLarge}`}>
                    {t('products.tradingTools.riskCalculator.content')}
                  </p>
                  <Button variant="outline" className={`w-full ${SPACING.gap.small}`} asChild>
                    <Link to={localizePath("/products/risk-calculator")}>
                      {t('products.tradingTools.riskCalculator.cta')}
                      <ArrowRight className={SPACING.icon.sm} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={toolsFade}>
              <Card className="trading-card">
                <CardHeader>
                  <div className={`flex items-start ${SPACING.gap.medium}`}>
                    <div className="flex-shrink-0 mt-1">
                      <Calendar className={`text-primary ${SPACING.icon.xl}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="font-poppins">{t('products.tradingTools.economicCalendar.title', { ns: 'common' })}</CardTitle>
                      <CardDescription>{t('products.tradingTools.economicCalendar.description', { ns: 'common' })}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`text-muted-foreground ${SPACING.margin.headingLarge}`}>
                    {t('products.tradingTools.economicCalendar.content', { ns: 'common' })}
                  </p>
                  <Button variant="outline" className={`w-full ${SPACING.gap.small}`} asChild>
                    <Link to={localizePath("/products/trading-tools", { hash: "economic-calendar" })}>
                      {t('products.tradingTools.economicCalendar.cta', { ns: 'common' })}
                      <ArrowRight className={SPACING.icon.sm} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
      </Layout>
    </div>
  );
}