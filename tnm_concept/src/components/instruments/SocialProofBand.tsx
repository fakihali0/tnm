import { Star, Users, Globe, Shield } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer } from "@/components/animation/variants";
import { AnimatedStat } from "@/components/ui/animated-stat";
import { SPACING } from "@/styles/spacing";

export function SocialProofBand() {
  const { t } = useTranslation('common');
  
  // Animation setup
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation({
    amount: 0.3,
    once: true,
    delay: 0.2
  });
  
  const cardVariants = createRevealVariants({ direction: "up", distance: 30 });
  const containerVariants = createStaggerContainer({ stagger: 0.1, delayChildren: 0.3 });
  
  const stats = [
    {
      icon: Users,
      target: 1000,
      suffix: "+",
      label: t("socialProof.stats.activeTraders"),
    },
    {
      icon: Globe,
      target: 10,
      suffix: "+",
      label: t("socialProof.stats.countries"),
    },
    {
      icon: Star,
      target: 4.8,
      suffix: "/5",
      decimals: 1,
      label: t("socialProof.stats.clientRating"),
    },
    {
      icon: Shield,
      value: "CMA",
      label: t("socialProof.stats.regulated"),
    },
  ];

  return (
    <motion.div 
      className="border-y bg-muted/20"
      {...motionProps}
      variants={containerVariants}
      transition={transition}
    >
      <div className="container py-6">
        <motion.div 
          className={`grid grid-cols-2 md:grid-cols-4 ${SPACING.gap.card} text-center`}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className={SPACING.stack.compact}
              variants={cardVariants}
              transition={transition}
            >
              <div className="w-8 h-8 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <stat.icon className={`${SPACING.icon.sm} text-primary`} />
              </div>
              <div className="font-bold text-lg text-foreground">
                {stat.target !== undefined ? (
                  <AnimatedStat 
                    target={stat.target} 
                    suffix={stat.suffix} 
                    decimals={stat.decimals} 
                  />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}