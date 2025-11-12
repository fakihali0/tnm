import { Layout } from "@/components/layout/Layout";
import { motion, type Transition } from "framer-motion";
import { PaymentMethodsHero } from "@/components/payments/PaymentMethodsHero";
import { SimpleComparisonTable } from "@/components/payments/SimpleComparisonTable";
import { FeeEstimator } from "@/components/payments/FeeEstimator";
import { FeatureErrorBoundary } from "@/components/error/FeatureErrorBoundary";
import { TrustBand } from "@/components/instruments/TrustBand";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { paymentMethodsData } from "@/data/paymentMethods";
import { trackButtonClick } from "@/utils/auth-redirects";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { MotionAccordionItem } from "@/components/ui/motion-accordion-item";
import { SPACING } from "@/styles/spacing";

const PaymentMethodsContent = () => {
  const { t, i18n } = useTranslation('common');

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

  const heroVariants = buildReveal(transition, 64);
  const heroFade = buildFade(transition);
  const comparisonVariants = buildReveal(transition, 52);
  const comparisonFade = buildFade(transition);
  const estimatorVariants = buildReveal(transition, 48);
  const estimatorFade = buildFade(transition);
  const troubleshootingVariants = buildReveal(transition, 44);
  const troubleshootingFade = buildFade(transition);
  const faqVariants = buildReveal(transition, 44);
  const faqFade = buildFade(transition);
  const accordionStagger = buildStagger(transition, 0.12, 0.05);
  const accordionItemVariants = buildReveal(transition, 24);
  const trustVariants = buildReveal(transition, 36);

  // Get troubleshooting and FAQ data with robust fallbacks
  const troubleshootingData = useMemo(() => {
    const data = t('paymentMethodsPage.troubleshooting.items', { returnObjects: true });
    if (Array.isArray(data) && data.length > 0) return data;
    
    // Fallback to English if current language fails
    const enData = i18n.getResourceBundle('en', 'common')?.paymentMethodsPage?.troubleshooting?.items;
    return Array.isArray(enData) ? enData : [];
  }, [t, i18n.language]);

  const faqData = useMemo(() => {
    const data = t('paymentMethodsPage.faq.items', { returnObjects: true });
    if (Array.isArray(data) && data.length > 0) return data;
    
    // Fallback to English if current language fails
    const enData = i18n.getResourceBundle('en', 'common')?.paymentMethodsPage?.faq?.items;
    return Array.isArray(enData) ? enData : [];
  }, [t, i18n.language]);

  return (
    <Layout>
      <motion.section className="w-full" {...motionProps} variants={heroVariants}>
        <motion.div variants={heroFade}>
          <PaymentMethodsHero />
        </motion.div>
      </motion.section>

      <div className="container py-12 space-y-16">
        {/* Quick Comparison */}
        <motion.section {...motionProps} variants={comparisonVariants}>
          <motion.div variants={comparisonFade}>
            <SimpleComparisonTable methods={paymentMethodsData} />
          </motion.div>
        </motion.section>

        {/* Fee Estimator */}
        <motion.section id="fee-estimator" {...motionProps} variants={estimatorVariants}>
          <motion.div variants={estimatorFade}>
            <FeeEstimator methods={paymentMethodsData} />
          </motion.div>
        </motion.section>

        {/* Troubleshooting */}
        <motion.section 
          id="troubleshooting" 
          className="w-full max-w-4xl section-align-start"
          {...motionProps} 
          variants={troubleshootingVariants}
          viewport={{ amount: 0.15, once: true }}
        >
          <motion.h2 className="text-3xl font-bold mb-6" variants={troubleshootingFade}>
            {t('paymentMethodsPage.troubleshooting.title')}
          </motion.h2>
          <motion.div variants={accordionStagger}>
            <Accordion type="single" collapsible className="w-full">
              {troubleshootingData && troubleshootingData.length > 0 ? troubleshootingData.map((item, index) => (
                <MotionAccordionItem 
                  key={`troubleshoot-${index}-${item.question?.slice(0, 20)}`} 
                  value={`troubleshoot-${index}`} 
                  variants={accordionItemVariants}
                  className="w-full"
                >
                  <AccordionTrigger
                    className="ltr:text-left rtl:text-right"
                    onClick={() => trackButtonClick({ buttonType: 'pm_troubleshoot_toggle', buttonLocation: 'troubleshooting' })}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </MotionAccordionItem>
              )) : (
                <div className="text-muted-foreground">No troubleshooting items available</div>
              )}
            </Accordion>
          </motion.div>
        </motion.section>

        {/* FAQs */}
        <motion.section 
          id="faqs" 
          className="w-full max-w-4xl section-align-start"
          {...motionProps} 
          variants={faqVariants}
          viewport={{ amount: 0.15, once: true }}
        >
          <motion.h2 className="text-3xl font-bold mb-6" variants={faqFade}>
            {t('paymentMethodsPage.faq.title')}
          </motion.h2>
          <motion.div variants={accordionStagger}>
            <Accordion type="single" collapsible className="w-full">
              {faqData && faqData.length > 0 ? faqData.map((item, index) => (
                <MotionAccordionItem 
                  key={`faq-${index}-${item.question?.slice(0, 20)}`} 
                  value={`faq-${index}`} 
                  variants={accordionItemVariants}
                  className="w-full"
                >
                  <AccordionTrigger
                    className="ltr:text-left rtl:text-right"
                    onClick={() => trackButtonClick({ buttonType: 'pm_faq_toggle', buttonLocation: 'faqs' })}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </MotionAccordionItem>
              )) : (
                <div className="text-muted-foreground">No FAQ items available</div>
              )}
            </Accordion>
          </motion.div>
        </motion.section>
      </div>

      {/* Trust Band */}
      <motion.section {...motionProps} variants={trustVariants}>
        <TrustBand />
      </motion.section>
    </Layout>
  );
};

const PaymentMethods = () => (
  <FeatureErrorBoundary featureName="Payment Methods">
    <PaymentMethodsContent />
  </FeatureErrorBoundary>
);

export default PaymentMethods;