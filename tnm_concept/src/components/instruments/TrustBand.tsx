import React from "react";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { SPACING } from "@/styles/spacing";

export function TrustBand() {
  const { t } = useTranslation();
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation();

  // Animation factory functions
  const buildReveal = (direction: "up" | "down" | "left" | "right" = "up", distance = 40, customTransition?: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction, distance, transition: customTransition }), prefersReducedMotion);

  const buildStagger = (stagger = 0.15, delayChildren = 0) =>
    resolveMotionVariants(createStaggerContainer({ stagger, delayChildren }), prefersReducedMotion);

  // Animation variants
  const itemVariants = buildReveal("up", 30, transition);
  const itemContainer = buildStagger(0.1, 0.2);

  const trustItems = [
    {
      icon: Shield,
      title: t("trustBand.regulated.title"),
      description: t("trustBand.regulated.description")
    },
    {
      icon: Lock,
      title: t("trustBand.security.title"),
      description: t("trustBand.security.description")
    },
    {
      icon: AlertTriangle,
      title: t("trustBand.riskWarning.title"),
      description: t("trustBand.riskWarning.description")
    }
  ];

  return (
    <motion.section 
      className="py-8 bg-muted/10 border-t"
      {...motionProps}
      variants={buildReveal("up", 20, transition)}
    >
      <div className="container">
        <motion.div 
          className={`grid md:grid-cols-3 ${SPACING.gap.card} text-center md:text-left justify-items-center md:justify-items-start`}
          variants={itemContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3, once: true }}
        >
          {trustItems.map((item, index) => (
            <motion.div 
              key={index} 
              className={`flex items-center ${SPACING.gap.button} hover:bg-background/50 p-3 rounded-lg transition-colors`}
              variants={itemVariants}
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                whileHover={{ 
                  scale: 1.1,
                  backgroundColor: "hsl(var(--primary) / 0.2)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <item.icon className={`${SPACING.icon.sm} text-primary`} />
              </motion.div>
              <div className="leading-tight">
                <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}