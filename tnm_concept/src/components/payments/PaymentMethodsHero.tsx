import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CreditCard, Clock, ArrowRight, Eye, FileText, ChevronRight, Home } from "lucide-react";
import { AUTH_URLS, trackButtonClick, scrollToSection } from "@/utils/auth-redirects";
import { Trans, useTranslation } from "react-i18next";
import { getLocalizedPath } from "@/i18n";
import i18n from "i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

export function PaymentMethodsHero() {
  const { t } = useTranslation("common");
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation();

  // Animation factory functions
  const buildReveal = (direction: "up" | "down" | "left" | "right" = "up", distance = 40, customTransition?: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction, distance, transition: customTransition }), prefersReducedMotion);

  const buildFade = (customTransition?: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction: "none", transition: customTransition }), prefersReducedMotion);

  const buildStagger = (stagger = 0.15, delayChildren = 0) =>
    resolveMotionVariants(createStaggerContainer({ stagger, delayChildren }), prefersReducedMotion);

  // Animation variants
  const heroVariants = buildReveal("up", 50, { ...transition, duration: 0.7 });
  const trustBadgeVariants = buildReveal("up", 30, { ...transition, delay: 0.2 });
  const trustBadgeContainer = buildStagger(0.1, 0.3);
  const ctaVariants = buildReveal("up", 20, { ...transition, delay: 0.4 });
  const ctaContainer = buildStagger(0.1, 0.5);
  const iconVariants = buildReveal("right", 40, { ...transition, delay: 0.6 });
  const iconContainer = buildStagger(0.15, 0.7);

  const trustBadges = [
    {
      icon: Lock,
      title: t('paymentMethodsPage.hero.trustBadges.encrypted.title'),
      description: t('paymentMethodsPage.hero.trustBadges.encrypted.description')
    },
    {
      icon: Shield,
      title: t('paymentMethodsPage.hero.trustBadges.compliance.title'), 
      description: t('paymentMethodsPage.hero.trustBadges.compliance.description')
    },
    {
      icon: FileText,
      title: t('paymentMethodsPage.hero.trustBadges.transparent.title'),
      description: t('paymentMethodsPage.hero.trustBadges.transparent.description')
    },
    {
      icon: Clock,
      title: t('paymentMethodsPage.hero.trustBadges.support.title'),
      description: t('paymentMethodsPage.hero.trustBadges.support.description')
    }
  ];

  const handleAnalyticsEvent = (eventName: string, data?: Record<string, unknown>) => {
    trackButtonClick({ 
      buttonType: eventName, 
      buttonLocation: 'payment-methods-hero',
      ...data 
    });
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b bg-muted/20">
        <div className="container py-3">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span>{t('paymentMethodsPage.hero.breadcrumb.products')}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{t('paymentMethodsPage.hero.breadcrumb.paymentMethods')}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background relative overflow-hidden"
        {...motionProps}
        variants={heroVariants}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div 
                className="space-y-4" 
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                variants={heroVariants}
              >
                <h1 className="font-poppins text-4xl lg:text-5xl font-bold tracking-tight">
                  <Trans
                    t={t}
                    i18nKey="paymentMethodsPage.hero.title"
                    components={[<span className="gradient-text" />]}
                  />
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {t('paymentMethodsPage.hero.subtitle')}
                </p>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                className="grid grid-cols-2 gap-4"
                variants={trustBadgeContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.3, once: true }}
              >
                {trustBadges.map((badge, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border hover:bg-background/70 transition-colors"
                    variants={trustBadgeVariants}
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <badge.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <div className="font-medium text-sm">{badge.title}</div>
                      <div className="text-xs text-muted-foreground">{badge.description}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div 
                className="flex flex-col sm:flex-row flex-wrap gap-4"
                variants={ctaContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.3, once: true }}
              >
                <motion.div variants={ctaVariants}>
                  <Button 
                    size="mobile" 
                    className="gradient-bg text-white shadow-primary gap-2 w-full sm:w-auto"
                    asChild
                  >
                    <a 
                      href={AUTH_URLS.LOGIN} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleAnalyticsEvent('pm_hero_deposit_click')}
                    >
                      {t('paymentMethodsPage.hero.buttons.depositNow')}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
                <motion.div variants={ctaVariants}>
                  <Button 
                    size="mobile" 
                    variant="outline" 
                    className="gap-2 w-full sm:w-auto"
                    asChild
                  >
                    <a 
                      href={AUTH_URLS.LOGIN} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleAnalyticsEvent('pm_hero_withdraw_click')}
                    >
                      {t('paymentMethodsPage.hero.buttons.withdrawFunds')}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
                <motion.div variants={ctaVariants}>
                  <Button 
                    size="mobile" 
                    variant="ghost" 
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => scrollToSection('fee-estimator', 'pm_hero_fees_click', 'payment-methods-hero')}
                  >
                    {t('paymentMethodsPage.hero.buttons.seeFeesLimits')}
                    <Eye className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Right side - Payment icons illustration */}
            <motion.div 
              className="relative"
              variants={iconVariants}
            >
              <motion.div 
                className="grid grid-cols-3 gap-4 max-w-md mx-auto"
                variants={iconContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.3, once: true }}
              >
                <motion.div 
                  className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl border hover:scale-105 transition-transform cursor-pointer"
                  variants={iconVariants}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <CreditCard className="h-8 w-8 text-primary mx-auto" />
                  <div className="text-xs text-center mt-2 text-muted-foreground">{t('paymentMethodsPage.hero.paymentIcons.cards')}</div>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-accent/10 to-primary/10 p-6 rounded-xl border hover:scale-105 transition-transform cursor-pointer"
                  variants={iconVariants}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Shield className="h-8 w-8 text-accent mx-auto" />
                  <div className="text-xs text-center mt-2 text-muted-foreground">{t('paymentMethodsPage.hero.paymentIcons.secure')}</div>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl border hover:scale-105 transition-transform cursor-pointer"
                  variants={iconVariants}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Clock className="h-8 w-8 text-primary mx-auto" />
                  <div className="text-xs text-center mt-2 text-muted-foreground">{t('paymentMethodsPage.hero.paymentIcons.fast')}</div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}