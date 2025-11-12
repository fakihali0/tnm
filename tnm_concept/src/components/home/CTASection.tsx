import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

export function CTASection() {
  const { t } = useTranslation();
  const {
    motionProps: sectionMotion,
    transition,
    prefersReducedMotion,
    elementRef
  } = useSectionAnimation({ amount: 0.4, delay: 0.1 });

  const containerVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 60, transition }),
    prefersReducedMotion
  );
  const cardVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 40, transition }),
    prefersReducedMotion
  );

  const localTransition = prefersReducedMotion ? transition : { ...transition, delay: 0 };
  const fadeIn = resolveMotionVariants(
    createRevealVariants({ direction: "none", transition: localTransition }),
    prefersReducedMotion
  );
  const itemVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 24, transition: localTransition }),
    prefersReducedMotion
  );

  const baseDelay = prefersReducedMotion ? 0 : transition.delay ?? 0;
  const leadStagger = createStaggerContainer({
    stagger: 0.12,
    delayChildren: baseDelay + 0.05,
    enabled: !prefersReducedMotion
  });
  const starStagger = createStaggerContainer({
    stagger: 0.05,
    delayChildren: baseDelay + 0.08,
    enabled: !prefersReducedMotion
  });
  const buttonStagger = createStaggerContainer({
    stagger: 0.1,
    delayChildren: baseDelay + 0.2,
    enabled: !prefersReducedMotion
  });

  const headingTransition = prefersReducedMotion
    ? transition
    : { ...transition, delay: baseDelay + 0.15 };
  const subtitleTransition = prefersReducedMotion
    ? transition
    : { ...transition, delay: baseDelay + 0.22 };
  const benefitsTransition = prefersReducedMotion
    ? transition
    : { ...transition, delay: baseDelay + 0.35 };

  return (
    <motion.section
      ref={elementRef}
      className="py-16 sm:py-24 relative overflow-hidden"
      {...sectionMotion}
      variants={containerVariants}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 hero-gradient opacity-5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative px-4 sm:px-6">
        <motion.div variants={cardVariants} transition={{ ...transition, delay: baseDelay }}>
          <Card className="max-w-4xl mx-auto p-6 sm:p-10 text-center shadow-glow border-primary/20">
            <motion.div className="mb-8" variants={leadStagger}>
              <motion.div className="flex justify-center items-center gap-1 mb-4" variants={starStagger}>
                {[...Array(5)].map((_, index) => (
                  <motion.span key={index} variants={fadeIn}>
                    <Star className="h-5 w-5 fill-primary text-primary" />
                  </motion.span>
                ))}
              </motion.div>
              <motion.p className="text-sm text-muted-foreground mb-6" variants={fadeIn}>
                {t('cta.testimonial')}
              </motion.p>
            </motion.div>

            <motion.h2
              className="font-poppins text-2xl font-bold mb-3 sm:text-3xl lg:text-4xl"
              variants={fadeIn}
              transition={headingTransition}
            >
              {t('cta.title')}
            </motion.h2>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto"
              variants={fadeIn}
              transition={subtitleTransition}
            >
              {t('cta.subtitle')}
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-3 items-center justify-center" variants={buttonStagger}>
              <motion.div className="w-full sm:w-auto" variants={itemVariants}>
                <Button
                  size="lg"
                  className="gradient-bg text-white shadow-primary gap-2 w-full sm:w-auto min-h-[48px]"
                  asChild
                >
                  <a
                    href={AUTH_URLS.REGISTRATION}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackButtonClick({ buttonType: 'start-trading-today', buttonLocation: 'cta-section' })}
                  >
                    <TrendingUp className="h-5 w-5" />
                    {t('auth.startTrading')}
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </a>
                </Button>
              </motion.div>
              <motion.div className="w-full sm:w-auto" variants={itemVariants}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto min-h-[48px]"
                  asChild
                >
                  <a
                    href={AUTH_URLS.DEMO}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackButtonClick({ buttonType: 'schedule-demo', buttonLocation: 'cta-section' })}
                  >
                    {t('auth.scheduleDemo')}
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div className="mt-6 text-xs sm:text-sm text-muted-foreground" variants={fadeIn} transition={benefitsTransition}>
              <p>{t('cta.benefits.noCreditCard')} • {t('cta.benefits.freeDemo')} • {t('cta.benefits.support')}</p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
}
