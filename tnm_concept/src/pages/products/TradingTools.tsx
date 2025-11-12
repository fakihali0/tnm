import { Layout } from "@/components/layout/Layout";
import { motion, type Transition } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import { TradingViewEconomicCalendar, TradingViewStockHeatmap, TradingViewForexCrossRates } from "@/components/home/LazyTradingViewWidgets";
import { TradingViewErrorBoundary } from "@/components/error/TradingViewErrorBoundary";
import TradingToolsAnimations from "@/components/products/TradingToolsAnimations";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { getScrollBehavior } from "@/utils/scroll";
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, Calculator, Clock, ExternalLink } from "lucide-react";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { SPACING } from "@/styles/spacing";

const tradingWidgets = [
  {
    title: "Economic Calendar",
    description: "Stay informed about important economic events and market-moving news",
    icon: Calendar,
    component: "economic-calendar"
  },
  {
    title: "Market Heat Map",
    description: "Visualize market performance across different sectors and currencies",
    icon: TrendingUp,
    component: "heat-map"
  },
  {
    title: "Forex Cross Rates",
    description: "Real-time currency exchange rates for major forex pairs",
    icon: BarChart3,
    component: "forex-cross-rates"
  }
];

export default function TradingTools() {
  const { t } = useTranslation('tools');

  const {
    motionProps,
    transition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.35, delay: 0.05 });

  const buildReveal = (baseTransition: Transition, distance = 48) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "up", distance, transition: baseTransition }),
      prefersReducedMotion
    );
  const buildFade = (baseTransition: Transition) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "none", transition: baseTransition }),
      prefersReducedMotion
    );
  const buildStagger = (baseTransition: Transition, stagger = 0.12, offset = 0) =>
    createStaggerContainer({
      stagger,
      delayChildren: (baseTransition.delay ?? 0) + offset,
      enabled: !prefersReducedMotion
    });

  const heroVariants = buildReveal(transition, 72);
  const heroFade = buildFade(transition);
  const heroStagger = buildStagger(transition, 0.12, 0.05);
  const introVariants = buildReveal(transition, 56);
  const introFade = buildFade(transition);
  const introStagger = buildStagger(transition, 0.14, 0.05);
  const widgetVariants = buildReveal(transition, 48);
  const widgetFade = buildFade(transition);
  const widgetStagger = buildStagger(transition, 0.12, 0.05);
  const ctaVariants = buildReveal(transition, 40);
  const ctaFade = buildFade(transition);
  const cardReveal = buildReveal(transition, 32);

  // Handle auto-scroll to section on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
        }, 100);
      }
    }
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-b from-light-bg/50 to-background"
        dir={t('dir') === 'rtl' ? 'rtl' : 'ltr'}
        {...motionProps}
        variants={heroVariants}
      >
        <div className="pointer-events-none absolute inset-0 hero-gradient opacity-10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <div className="pointer-events-none absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 transform bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
        {!prefersReducedMotion && <TradingToolsAnimations />}
        <motion.div className="container relative z-10 py-8 md:py-12 lg:py-16" variants={heroFade}>
          <motion.div className="mx-auto max-w-4xl text-center" variants={heroFade}>
            <motion.h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight" variants={heroFade}>
              <span className="gradient-text">{t('tools.hero.title')}</span>
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" variants={heroFade}>
              {t('tools.hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mb-10" variants={heroFade}>
              <Button
                size="lg"
                className="gradient-bg text-white shadow-primary gap-2"
                onClick={() => {
                  trackButtonClick({ buttonType: 'explore-tools', buttonLocation: 'hero' });
                  document.getElementById('tools-intro')?.scrollIntoView({ behavior: getScrollBehavior() });
                }}
              >
                {t('tools.hero.primaryCta')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => {
                  trackButtonClick({ buttonType: 'jump-widgets', buttonLocation: 'hero' });
                  document.getElementById('economic-calendar')?.scrollIntoView({ behavior: getScrollBehavior() });
                }}
              >
                {t('tools.hero.secondaryCta')}
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground" variants={heroStagger}>
              <motion.div className="flex items-center gap-2" variants={cardReveal}>
                <Clock className="h-4 w-4 text-primary" />
                {t('tools.hero.badges.liveData')}
              </motion.div>
              <motion.div className="flex items-center gap-2" variants={cardReveal}>
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('tools.hero.badges.lightweight')}
              </motion.div>
              <motion.div className="flex items-center gap-2" variants={cardReveal}>
                <BarChart3 className="h-4 w-4 text-primary" />
                {t('tools.hero.badges.mobileFriendly')}
              </motion.div>
              <motion.div className="flex items-center gap-2" variants={cardReveal}>
                <Calculator className="h-4 w-4 text-primary" />
                {t('tools.hero.badges.noSignin')}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Tools Intro Carousel */}
      <motion.section id="tools-intro" className="py-16" {...motionProps} variants={introVariants}>
        <motion.div className="container" variants={introFade}>
          <motion.div className="max-w-6xl mx-auto" variants={introFade}>
            <motion.div variants={introFade}>
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  breakpoints: {
                    '(min-width: 768px)': {
                      slidesToScroll: 1,
                    },
                    '(min-width: 1024px)': {
                      slidesToScroll: 1,
                    }
                  }
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {/* Economic Calendar */}
                  <CarouselItem className="ps-2 md:ps-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div variants={cardReveal}>
                      <Card
                        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 h-full"
                        onClick={() => {
                          trackButtonClick({ buttonType: 'card-open-calendar', buttonLocation: 'tools-intro' });
                          document.getElementById('economic-calendar')?.scrollIntoView({ behavior: getScrollBehavior() });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            trackButtonClick({ buttonType: 'card-open-calendar', buttonLocation: 'tools-intro' });
                            document.getElementById('economic-calendar')?.scrollIntoView({ behavior: getScrollBehavior() });
                          }
                        }}
                        aria-label={t('tools.cards.economicCalendar.useNow')}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="font-poppins text-lg">{t('tools.cards.economicCalendar.title')}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {t('tools.cards.economicCalendar.description')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors">
                            {t('tools.cards.economicCalendar.useNow')} →
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                  {/* Heat Map */}
                  <CarouselItem className="ps-2 md:ps-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div variants={cardReveal}>
                      <Card
                        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 h-full"
                        onClick={() => {
                          trackButtonClick({ buttonType: 'card-open-heatmap', buttonLocation: 'tools-intro' });
                          document.getElementById('heat-map')?.scrollIntoView({ behavior: getScrollBehavior() });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            trackButtonClick({ buttonType: 'card-open-heatmap', buttonLocation: 'tools-intro' });
                            document.getElementById('heat-map')?.scrollIntoView({ behavior: getScrollBehavior() });
                          }
                        }}
                        aria-label={t('tools.cards.heatMap.useNow')}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="font-poppins text-lg">{t('tools.cards.heatMap.title')}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {t('tools.cards.heatMap.description')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors">
                            {t('tools.cards.heatMap.useNow')} →
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                  {/* Forex Cross Rates */}
                  <CarouselItem className="ps-2 md:ps-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div variants={cardReveal}>
                      <Card
                        className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 h-full"
                        onClick={() => {
                          trackButtonClick({ buttonType: 'card-open-forex', buttonLocation: 'tools-intro' });
                          document.getElementById('forex-cross-rates')?.scrollIntoView({ behavior: getScrollBehavior() });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            trackButtonClick({ buttonType: 'card-open-forex', buttonLocation: 'tools-intro' });
                            document.getElementById('forex-cross-rates')?.scrollIntoView({ behavior: getScrollBehavior() });
                          }
                        }}
                        aria-label={t('tools.cards.forexCrossRates.useNow')}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="font-poppins text-lg">{t('tools.cards.forexCrossRates.title')}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {t('tools.cards.forexCrossRates.description')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-primary text-sm font-medium group-hover:text-primary/80 transition-colors">
                            {t('tools.cards.forexCrossRates.useNow')} →
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselDots totalSlides={3} className="mt-8" />
              </Carousel>
            </motion.div>
            <motion.div className="mt-12 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto" variants={introStagger}>
              <motion.div variants={cardReveal}>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  💡 {t('tools.tips.calendar')}
                </Badge>
              </motion.div>
              <motion.div variants={cardReveal}>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  💡 {t('tools.tips.risk')}
                </Badge>
              </motion.div>
              <motion.div variants={cardReveal}>
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  💡 {t('tools.tips.heatmap')}
                </Badge>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Economic Calendar Widget */}
      <motion.section id="economic-calendar" className="py-16 bg-muted/20 scroll-mt-24" {...motionProps} variants={widgetVariants}>
        <motion.div className="container" variants={widgetFade}>
          <motion.div className="text-center mb-12" variants={widgetFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={widgetFade}>
              {t('tools.widgets.economicCalendar.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={widgetFade}>
              {t('tools.widgets.economicCalendar.description')}
            </motion.p>
          </motion.div>
          <motion.div className="flex justify-center" variants={widgetFade}>
            <TradingViewErrorBoundary>
              <TradingViewEconomicCalendar />
            </TradingViewErrorBoundary>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Market Heat Map Widget */}
      <motion.section id="heat-map" className="py-16 scroll-mt-24" {...motionProps} variants={widgetVariants}>
        <motion.div className="container" variants={widgetFade}>
          <motion.div className="text-center mb-12" variants={widgetFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={widgetFade}>
              {t('tools.widgets.heatMap.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={widgetFade}>
              {t('tools.widgets.heatMap.description')}
            </motion.p>
          </motion.div>
          <motion.div className="flex justify-center" variants={widgetFade}>
            <TradingViewErrorBoundary>
              <TradingViewStockHeatmap />
            </TradingViewErrorBoundary>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Forex Cross Rates Widget */}
      <motion.section id="forex-cross-rates" className="py-16 bg-muted/20 scroll-mt-24" {...motionProps} variants={widgetVariants}>
        <motion.div className="container" variants={widgetFade}>
          <motion.div className="text-center mb-12" variants={widgetFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={widgetFade}>
              {t('tools.widgets.forexCrossRates.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={widgetFade}>
              {t('tools.widgets.forexCrossRates.description')}
            </motion.p>
          </motion.div>
          <motion.div className="flex justify-center" variants={widgetFade}>
            <TradingViewErrorBoundary>
              <TradingViewForexCrossRates />
            </TradingViewErrorBoundary>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5" {...motionProps} variants={ctaVariants}>
        <motion.div className="container" variants={ctaFade}>
          <motion.div className="text-center max-w-2xl mx-auto" variants={ctaFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={ctaFade}>
              {t('tools.cta.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground mb-8" variants={ctaFade}>
              {t('tools.cta.subtitle')}
            </motion.p>
            <motion.div variants={ctaFade}>
              <Button
                size="lg"
                className="gradient-bg text-white shadow-primary gap-2"
                asChild
              >
                <a
                  href={AUTH_URLS.REGISTRATION}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackButtonClick({ buttonType: 'open-account', buttonLocation: 'trading-tools-cta' })}
                >
                  {t('tools.cta.button')}
                  <ExternalLink className="h-5 w-5" aria-label={t('tools.cta.external')} />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}
