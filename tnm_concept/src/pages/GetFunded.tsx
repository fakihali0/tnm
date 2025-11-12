import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AUTH_URLS, trackButtonClick, scrollToSection } from "@/utils/auth-redirects";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { TradingDashboardBackground } from "@/components/get-funded/TradingDashboardBackground";
import { SocialProofBand } from "@/components/instruments/SocialProofBand";
import { AnimatedStat } from "@/components/ui/animated-stat";

import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Target, 
  CheckCircle, 
  Users, 
  BarChart3,
  Trophy,
  Clock,
  Zap
} from "lucide-react";
import { SPACING } from "@/styles/spacing";

export default function GetFunded() {
  const { t } = useTranslation('getfunded');
  const { localizePath } = useLocalizedPath();
  const fundingTiers = [
    {
      name: t('tiers.tiers.beginners.name'),
      capital: t('tiers.amounts.capital', { amount: '$10,000' }),
      profit: t('tiers.amounts.profit', { amount: '$1,000' }),
      split: t('tiers.amounts.split', { percentage: '80%' }),
      fee: t('tiers.amounts.fee', { amount: '$90' }),
      features: [
        t('tiers.tiers.beginners.features.dailyLoss'),
        t('tiers.tiers.beginners.features.totalLoss'),
        t('tiers.tiers.beginners.features.minDays'),
        t('tiers.tiers.beginners.features.profitTarget'),
        t('tiers.tiers.beginners.features.leverage'),
        t('tiers.tiers.beginners.features.majorPairs'),
        t('tiers.tiers.beginners.features.commodities')
      ],
      popular: false
    },
    {
      name: t('tiers.tiers.professional.name'),
      capital: t('tiers.amounts.capital', { amount: '$100,000' }),
      profit: t('tiers.amounts.profit', { amount: '$10,000' }),
      split: t('tiers.amounts.split', { percentage: '80%' }),
      fee: t('tiers.amounts.fee', { amount: '$499' }),
      features: [
        t('tiers.tiers.professional.features.dailyLoss'),
        t('tiers.tiers.professional.features.totalLoss'),
        t('tiers.tiers.professional.features.minDays'),
        t('tiers.tiers.professional.features.profitTarget'),
        t('tiers.tiers.professional.features.leverage'),
        t('tiers.tiers.professional.features.majorPairs'),
        t('tiers.tiers.professional.features.commodities')
      ],
      popular: true
    },
    {
      name: t('tiers.tiers.maven.name'),
      capital: t('tiers.amounts.capital', { amount: '$200,000' }),
      profit: t('tiers.amounts.profit', { amount: '$20,000' }),
      split: t('tiers.amounts.split', { percentage: '90%' }),
      fee: t('tiers.amounts.fee', { amount: '$899' }),
      features: [
        t('tiers.tiers.maven.features.dailyLoss'),
        t('tiers.tiers.maven.features.totalLoss'),
        t('tiers.tiers.maven.features.minDays'),
        t('tiers.tiers.maven.features.profitTarget'),
        t('tiers.tiers.maven.features.leverage'),
        t('tiers.tiers.maven.features.majorPairs'),
        t('tiers.tiers.maven.features.commodities')
      ],
      popular: false
    }
  ];

  const steps = [
    {
      step: "1",
      title: t('process.steps.step1.title'),
      description: t('process.steps.step1.description'),
      icon: Target
    },
    {
      step: "2",
      title: t('process.steps.step2.title'),
      description: t('process.steps.step2.description'),
      icon: BarChart3
    },
    {
      step: "3",
      title: t('process.steps.step3.title'),
      description: t('process.steps.step3.description'),
      icon: DollarSign
    },
    {
      step: "4",
      title: t('process.steps.step4.title'),
      description: t('process.steps.step4.description'),
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: t('success.testimonials.ali.name'),
      title: t('success.testimonials.ali.title'),
      quote: t('success.testimonials.ali.quote'),
      profit: "$30,000",
      timeframe: t('success.timeframes.month', { count: 1 })
    },
    {
      name: t('success.testimonials.cezar.name'),
      title: t('success.testimonials.cezar.title'),
      quote: t('success.testimonials.cezar.quote'),
      profit: "$1,000",
      timeframe: t('success.timeframes.week', { count: 1 })
    },
    {
      name: t('success.testimonials.alamin.name'),
      title: t('success.testimonials.alamin.title'),
      quote: t('success.testimonials.alamin.quote'),
      profit: "$4,500",
      timeframe: t('success.timeframes.weeks', { count: 3 })
    }
  ];


  const {
    motionProps: heroMotion,
    transition: heroTransition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.3, delay: 0.05 });
  const { motionProps: sectionsMotion, transition: sectionsTransition } = useSectionAnimation({ amount: 0.25, delay: 0.08 });

  const buildReveal = (transition: Transition, distance = 48) =>
    resolveMotionVariants(createRevealVariants({ direction: "up", distance, transition }), prefersReducedMotion);
  const buildFade = (transition: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction: "none", transition }), prefersReducedMotion);
  const buildStagger = (transition: Transition, stagger = 0.08) =>
    createStaggerContainer({
      stagger,
      delayChildren: transition.delay ?? 0,
      enabled: !prefersReducedMotion
    });

  const heroVariants = buildReveal(heroTransition, 64);
  const heroFade = buildFade(heroTransition);
  const sectionVariants = buildReveal(sectionsTransition, 56);
  const sectionFade = buildFade(sectionsTransition);
  const cardVariants = buildReveal(sectionsTransition, 32);
  const staggerContainer = buildStagger(sectionsTransition);

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className={`relative isolate overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center ${SPACING.padding.containerLarge} bg-gradient-to-br from-background via-background to-primary/5`}
        {...heroMotion}
        variants={heroVariants}
      >
        <TradingDashboardBackground prefersReducedMotion={prefersReducedMotion} />
        <motion.div className={`relative z-10 max-w-7xl mx-auto text-center py-8 md:py-12 lg:py-16`} variants={heroFade}>
          <div className={SPACING.margin.headingXLarge}>
            <Badge variant="outline" className="mb-4 px-4 py-2 gap-2">
              <DollarSign className="h-4 w-4" />
              {t('badge.propTradingProgram')}
            </Badge>
          </div>
          <motion.h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold font-poppins ${SPACING.margin.headingLarge} gradient-text leading-tight`} variants={heroFade}>
            {t('hero.title')}
          </motion.h1>
          <motion.p className={`text-lg md:text-xl lg:text-2xl text-muted-foreground ${SPACING.margin.headingXLarge} leading-relaxed`} variants={heroFade}>
            {t('hero.subtitle')}
          </motion.p>
          <div className={`flex flex-col sm:flex-row ${SPACING.gap.medium} justify-center`}>
            <Button 
              size="lg" 
              className="gradient-bg text-white shadow-primary hover:shadow-glow transition-all duration-300 gap-2"
              asChild
            >
              <a 
                href={AUTH_URLS.FUNDING} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick({ buttonType: 'start-challenge-today', buttonLocation: 'get-funded-hero' })}
              >
                <Zap className="h-5 w-5" />
                {t('hero.startChallenge')}
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => scrollToSection('success-stories', 'view-success-stories', 'get-funded-hero')}
            >
              <Users className="h-5 w-5" />
              {t('hero.viewStories')}
            </Button>
          </div>
        </motion.div>
      </motion.section>

      {/* Social Proof */}
      <SocialProofBand />

      {/* Funding Process */}
      <motion.section
        className={`${SPACING.section.py} ${SPACING.padding.containerLarge}`}
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className={`text-center ${SPACING.margin.headingHuge}`}>
            <h2 className={`text-3xl font-bold font-poppins ${SPACING.margin.heading}`}>{t('process.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('process.subtitle')}
            </p>
          </div>
          
          <motion.div className={`grid ${SPACING.gap.xlarge} md:grid-cols-2 lg:grid-cols-4`} variants={staggerContainer}>
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={cardVariants}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Funding Tiers */}
      <motion.section
        className={`${SPACING.section.py} ${SPACING.padding.containerLarge} bg-muted/30`}
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className={`text-center ${SPACING.margin.headingHuge}`}>
            <h2 className={`text-3xl font-bold font-poppins ${SPACING.margin.heading}`}>{t('tiers.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('tiers.subtitle')}
            </p>
          </div>
          
          <motion.div className={`grid ${SPACING.gap.xlarge} md:grid-cols-2 lg:grid-cols-3`} variants={staggerContainer}>
            {fundingTiers.map((tier, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card 
                  className={`relative group hover:shadow-lg ${
                    tier.popular ? 'border-primary shadow-lg scale-105' : 'border-2 hover:border-primary/20'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white px-4 py-1">
                        <Trophy className="h-3 w-3 mr-1" />
                        {t('tiers.mostPopular')}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-primary">{tier.capital}</div>
                      <div className="text-sm text-muted-foreground">{t('tiers.tradingCapital')}</div>
                    </div>
                    <CardDescription className="space-y-1">
                      <div>{t('tiers.unlimitedDays')}</div>
                      <div>{t('tiers.profitSplit')} <span className="font-semibold text-foreground">{t('tiers.upTo90')}</span></div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                     <div className="text-center">
                       <div className="text-3xl font-bold text-primary">{tier.fee}</div>
                       <div className="text-sm text-muted-foreground">{t('tiers.evaluationFee')}</div>
                     </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full ${tier.popular ? 'gradient-bg text-white shadow-primary' : ''}`} 
                      variant={tier.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <a 
                        href={AUTH_URLS.FUNDING} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => trackButtonClick({ buttonType: `start-${tier.name.toLowerCase()}-challenge`, buttonLocation: 'funding-tiers' })}
                        >
                          {t('tiers.startChallenge')} {tier.name}
                        </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Success Stories */}
      <motion.section
        id="success-stories"
        className="py-16 px-4 sm:px-6 lg:px-8 scroll-mt-24"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('success.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('success.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.title}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        +$<AnimatedStat 
                          target={parseInt(testimonial.profit.replace(/[^\d]/g, ''))} 
                          suffix=""
                          duration={2}
                        />
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <blockquote className="text-sm italic">
                      "{testimonial.quote}"
                    </blockquote>
                     <div className="flex items-center text-sm text-muted-foreground gap-1">
                       <Clock className="h-4 w-4" />
                       {t('success.profitsIn')} {testimonial.timeframe}
                     </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Risk Management */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('risk.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('risk.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            <motion.div variants={cardVariants}>
              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>{t('risk.dailyLimit.title')}</CardTitle>
                  <CardDescription>{t('risk.dailyLimit.description')}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
            
            <motion.div variants={cardVariants}>
              <Card className="text-center">
                <CardHeader>
                  <Target className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>{t('risk.totalLimit.title')}</CardTitle>
                  <CardDescription>{t('risk.totalLimit.description')}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
            
            <motion.div variants={cardVariants}>
              <Card className="text-center">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>{t('risk.profitTargets.title')}</CardTitle>
                  <CardDescription>{t('risk.profitTargets.description')}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto text-center" variants={sectionFade}>
          <h2 className="text-3xl font-bold font-poppins mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-bg text-white shadow-primary hover:shadow-glow transition-all duration-300 gap-2"
              asChild
            >
              <a 
                href={AUTH_URLS.FUNDING} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick({ buttonType: 'start-your-challenge', buttonLocation: 'get-funded-cta' })}
              >
                <DollarSign className="h-5 w-5" />
                {t('cta.startChallenge')}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              asChild
            >
              <Link to={localizePath("/contact", { hash: "contact-form" })}>
                <Users className="h-5 w-5" />
                {t('cta.talkToExpert')}
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}