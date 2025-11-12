import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { SimplePaymentGrid } from "./SimplePaymentGrid";
import { 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Coins, 
  Calendar,
  BookOpen,
  Users,
  ArrowRight,
  Target,
  Video,
  FileText,
  Shield,
  Lock,
  CreditCard,
  HeadphonesIcon
} from "lucide-react";

export function SiteSummaryHub() {
  const { t, i18n } = useTranslation('common');
  const { localizePath } = useLocalizedPath();

  const primaryCards = [
    {
      icon: TrendingUp,
      title: t('nav.products'),
      description: t('siteSummary.cards.products.description'),
      cta: t('siteSummary.cards.products.cta'),
      href: "/products",
      eventId: "nav_summary_products"
    },
    {
      icon: BarChart3,
      title: t('nav.subPages.products.accountTypes'),
      description: t('siteSummary.cards.accountTypes.description'),
      cta: t('siteSummary.cards.accountTypes.cta'),
      href: "/products/account-types",
      eventId: "nav_summary_account_types"
    },
    {
      icon: Globe,
      title: t('nav.subPages.products.platforms'),
      description: t('siteSummary.cards.platforms.description'),
      cta: t('siteSummary.cards.platforms.cta'),
      href: "/products/platforms",
      eventId: "nav_summary_platforms"
    },
    {
      icon: Coins,
      title: t('nav.subPages.products.tradingTools'),
      description: t('siteSummary.cards.tradingTools.description'),
      cta: t('siteSummary.cards.tradingTools.cta'),
      href: "/products/trading-tools",
      eventId: "nav_summary_trading_tools"
    },
    {
      icon: BookOpen,
      title: t('nav.education'),
      description: t('siteSummary.cards.education.description'),
      cta: t('siteSummary.cards.education.cta'),
      href: "/education",
      eventId: "nav_summary_education"
    },
    {
      icon: Target,
      title: t('siteSummary.cards.funding.title'),
      description: t('siteSummary.cards.funding.description'),
      cta: t('siteSummary.cards.funding.cta'),
      href: "/get-funded",
      eventId: "nav_summary_get_funded"
    }
  ];

  const trustBadges = [
    {
      icon: Shield,
      title: t('common:trustBadges.regulated.title'),
      description: t('common:trustBadges.regulated.description')
    },
    {
      icon: Lock,
      title: t('common:trustBadges.security.title'),
      description: t('common:trustBadges.security.description')
    },
    {
      icon: CreditCard,
      title: t('common:trustBadges.payments.title'),
      description: t('common:trustBadges.payments.description')
    }
  ];

  const paymentMethods = [
    t('common:paymentMethods.visa'),
    t('common:paymentMethods.mastercard'),
    t('common:paymentMethods.bankTransfer'),
    t('common:paymentMethods.whishMoney'),
    t('common:paymentMethods.crypto'),
    t('common:paymentMethods.omt')
  ];

  const {
    motionProps: introMotion,
    transition: introTransition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.4, delay: 0.05 });
  const { motionProps: cardsMotion, transition: cardsTransition } = useSectionAnimation({ amount: 0.3, delay: 0.1 });
  const { motionProps: trustMotion, transition: trustTransition } = useSectionAnimation({ amount: 0.3, delay: 0.1 });
  const { motionProps: paymentsMotion, transition: paymentsTransition } = useSectionAnimation({ amount: 0.25, delay: 0.05 });
  const { motionProps: insightsMotion, transition: insightsTransition } = useSectionAnimation({ amount: 0.35, delay: 0.1 });
  const { motionProps: partnersMotion, transition: partnersTransition } = useSectionAnimation({ amount: 0.35, delay: 0.1 });

  const introVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 56, transition: introTransition }),
    prefersReducedMotion
  );
  const sectionVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 48, transition: cardsTransition }),
    prefersReducedMotion
  );
  const tightReveal = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 28, transition: cardsTransition }),
    prefersReducedMotion
  );
  const fadeIn = resolveMotionVariants(
    createRevealVariants({ direction: "none", transition: cardsTransition }),
    prefersReducedMotion
  );
  const trustVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 32, transition: trustTransition }),
    prefersReducedMotion
  );
  const paymentsVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 32, transition: paymentsTransition }),
    prefersReducedMotion
  );
  const insightsVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 36, transition: insightsTransition }),
    prefersReducedMotion
  );
  const partnersVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 40, transition: partnersTransition }),
    prefersReducedMotion
  );

  const cardStagger = createStaggerContainer({
    stagger: 0.12,
    delayChildren: cardsTransition.delay ?? 0,
    enabled: !prefersReducedMotion
  });
  const badgeStagger = createStaggerContainer({
    stagger: 0.1,
    delayChildren: trustTransition.delay ?? 0,
    enabled: !prefersReducedMotion
  });
  const insightsStagger = createStaggerContainer({
    stagger: 0.12,
    delayChildren: insightsTransition.delay ?? 0,
    enabled: !prefersReducedMotion
  });

  return (
    <div className="space-y-16">
      {/* Summary Hub - Intro Band */}
      <motion.section className="py-12 bg-muted/20" {...introMotion} variants={introVariants}>
        <motion.div className="container" variants={fadeIn}>
          <motion.div className="text-center max-w-3xl mx-auto" variants={fadeIn}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={fadeIn}>
              {t('common:siteSummary.intro.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground" variants={fadeIn}>
              {t('common:siteSummary.intro.description')}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Primary Grid - 6 Cards */}
      <motion.section className="py-16" {...cardsMotion} variants={sectionVariants}>
        <div className="container">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              containScroll: "trimSnaps",
              direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {primaryCards.map((card, index) => (
                <CarouselItem
                  key={index}
                  className="ps-2 md:ps-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
                >
                  <motion.div
                    variants={tightReveal}
                    transition={{
                      ...cardsTransition,
                      delay: (cardsTransition.delay ?? 0) + index * 0.08
                    }}
                  >
                    <Card className="trading-card group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full">
                    <Link
                      to={localizePath(card.href)}
                      className="block h-full"
                      aria-label={t('siteSummary.cards.navigate', { title: card.title })}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-bg mb-4 group-hover:scale-110 transition-transform duration-200">
                          <card.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="font-poppins text-lg">{card.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                        >
                          {card.cta}
                          <ArrowRight className="h-4 w-4 ms-2 transition-transform ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                        </Button>
                      </CardContent>
                    </Link>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </div>
            
            {/* Mobile Dots Navigation */}
            <div className="md:hidden">
              <CarouselDots totalSlides={primaryCards.length} className="mt-6" />
            </div>
          </Carousel>
        </div>
      </motion.section>

      {/* Trust & Compliance Row */}
      <motion.section className="py-12 bg-primary/5" {...trustMotion} variants={trustVariants}>
        <div className="container">
          <motion.div className="grid md:grid-cols-3 gap-8 items-center" variants={badgeStagger}>
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-center md:text-center gap-3"
                variants={trustVariants}
                transition={{
                  ...trustTransition,
                  delay: (trustTransition.delay ?? 0) + index * 0.08
                }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <badge.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-center md:items-center">
                  <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Payments Snapshot */}
      <motion.section className="py-16" {...paymentsMotion} variants={paymentsVariants}>
        <div className="container">
          <motion.div className="mx-auto max-w-[75rem]" variants={fadeIn}>
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-lg"
              variants={fadeIn}
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              <div className="relative px-6 py-10 sm:px-8 md:px-12 md:py-14">
                <div className="grid gap-10 md:grid-cols-[0.4fr_0.6fr] md:items-center">
                  <motion.div
                    className="flex flex-col gap-6 text-center md:text-left md:items-start"
                    variants={fadeIn}
                  >
                    <motion.h3 className="font-poppins text-2xl font-semibold tracking-tight" variants={fadeIn}>
                      {t('paymentMethods.title')}
                    </motion.h3>
                    <motion.p className="text-base text-muted-foreground leading-relaxed" variants={fadeIn}>
                      {t('paymentMethodsPage.hero.subtitle')}
                    </motion.p>
                    <motion.div className="flex justify-center md:justify-start" variants={fadeIn}>
                      <Button asChild size="lg" className="gap-2">
                        <Link to={localizePath("/products/payment-methods")}>
                          {t('paymentMethodsPage.hero.buttons.seeFeesLimits')}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="relative flex w-full items-center justify-center md:justify-end md:pl-4"
                    variants={fadeIn}
                  >
                    <SimplePaymentGrid className="w-full max-w-lg" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Latest Insights */}
      <motion.section className="py-16 bg-muted/20" {...insightsMotion} variants={insightsVariants}>
        <div className="container">
          <motion.div className="text-center mb-12" variants={fadeIn}>
            <motion.h2 className="font-poppins text-2xl font-bold mb-4" variants={fadeIn}>
              {t('common:insights.title')}
            </motion.h2>
            <motion.p className="text-muted-foreground" variants={fadeIn}>
              {t('common:insights.description')}
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6 mb-8" variants={insightsStagger}>
            <motion.div variants={insightsVariants} transition={{ ...insightsTransition, delay: insightsTransition.delay ?? 0 }}>
              <Card className="trading-card">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('common:insights.marketReport.category')}</span>
                  </div>
                  <CardTitle className="text-lg">{t('common:insights.marketReport.title')}</CardTitle>
                  <CardDescription>
                    {t('common:insights.marketReport.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={localizePath("/education/market-reports")}>
                      {t('common:insights.marketReport.cta')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={insightsVariants}
              transition={{
                ...insightsTransition,
                delay: (insightsTransition.delay ?? 0) + 0.12
              }}
            >
              <Card className="trading-card">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('common:insights.blog.category')}</span>
                  </div>
                  <CardTitle className="text-lg">{t('common:insights.blog.title')}</CardTitle>
                  <CardDescription>
                    {t('common:insights.blog.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={localizePath("/education/blogs")}>
                      {t('common:insights.blog.cta')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={insightsVariants}
              transition={{
                ...insightsTransition,
                delay: (insightsTransition.delay ?? 0) + 0.24
              }}
            >
              <Card className="trading-card">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('common:insights.webinar.category')}</span>
                  </div>
                  <CardTitle className="text-lg">{t('common:insights.webinar.title')}</CardTitle>
                  <CardDescription>
                    {t('common:insights.webinar.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={localizePath("/education/webinars")}>
                      {t('common:insights.webinar.cta')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div className="text-center" variants={fadeIn}>
            <Button variant="outline" size="lg" asChild>
              <Link to={localizePath("/education")}>
                {t('common:insights.seeAll')}
                <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Partners & Contact CTA Band */}
      <motion.section className="py-16" {...partnersMotion} variants={partnersVariants}>
        <div className="container">
          <motion.div className="grid md:grid-cols-2 gap-8" variants={cardStagger}>
            <motion.div
              variants={partnersVariants}
              transition={{ ...partnersTransition, delay: partnersTransition.delay ?? 0 }}
            >
              <Card className="trading-card bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full gradient-bg mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-poppins">{t('common:partnersCta.partners.title')}</CardTitle>
                  <CardDescription>
                    {t('common:partnersCta.partners.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gradient-bg text-white" asChild>
                    <Link to={localizePath("/partners")}>
                      {t('common:partnersCta.partners.cta')}
                      <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={partnersVariants}
              transition={{
                ...partnersTransition,
                delay: (partnersTransition.delay ?? 0) + 0.12
              }}
            >
              <Card className="trading-card bg-gradient-to-br from-secondary/5 to-secondary/10">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                    <HeadphonesIcon className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <CardTitle className="font-poppins">{t('common:partnersCta.contact.title')}</CardTitle>
                  <CardDescription>
                    {t('common:partnersCta.contact.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={localizePath("/contact")}>
                      {t('common:partnersCta.contact.cta')}
                      <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}