import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { useTranslationValidation } from "@/hooks/useTranslationValidation";
import { Link } from "react-router-dom";
import { ArrowRight, Award, CheckCircle2, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AnimatedStat } from "@/components/ui/animated-stat";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useAnimationSequence } from "@/hooks/useAnimationSequence";
import { useMobileOptimizations, useMobileAnimationConfig } from "@/hooks/useMobileOptimizations";
import {
  createRevealVariants,
  createStaggerContainer,
  resolveMotionVariants
} from "@/components/animation/variants";
import { AdvancedBackground } from "@/components/animation/AdvancedBackground";
import { EnhancedCard } from "@/components/animation/EnhancedCard";
import { AnimatedText, TypewriterText } from "@/components/animation/AnimatedText";
import { MagneticButton } from "@/components/animation/MagneticButton";
import { SPACING } from "@/styles/spacing";

export function ExperienceSection() {
  const { t, i18n } = useTranslation('common');
  const { safeT } = useTranslationValidation();
  const { localizePath } = useLocalizedPath();

  // Reload common namespace when language changes (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      i18n.reloadResources(i18n.language, 'common');
    }
  }, [i18n.language, i18n]);

  // Mobile optimizations
  const {
    reducedAnimations,
    optimizedTouchTargets,
    hapticFeedback,
    triggerHapticFeedback
  } = useMobileOptimizations();

  const mobileAnimationConfig = useMobileAnimationConfig();

  const {
    motionProps: sectionMotion,
    transition,
    prefersReducedMotion,
    elementRef
  } = useSectionAnimation({ amount: 0.4, delay: 0.08 });

  const {
    sequenceState,
    getBackgroundConfig,
    getContentConfig,
    getStaggerConfig
  } = useAnimationSequence({
    backgroundDelay: 0,
    contentDelay: mobileAnimationConfig.enableComplexAnimations ? 0.3 : 0.1,
    staggerDelay: mobileAnimationConfig.enableComplexAnimations ? 0.6 : 0.2
  });

  const baseDelay = transition.delay ?? 0;
  const shouldReduceAnimations = prefersReducedMotion || reducedAnimations;
  const isRTL = (typeof document !== "undefined" && document.documentElement.dir === "rtl") || i18n.language?.startsWith("ar");

  const sectionVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: mobileAnimationConfig.enableComplexAnimations ? 60 : 30, 
      transition: { ...transition, duration: mobileAnimationConfig.duration }
    }),
    shouldReduceAnimations
  );

  const textVariants = resolveMotionVariants(
    createRevealVariants({
      direction: "up",
      distance: mobileAnimationConfig.enableComplexAnimations ? 36 : 20,
      transition: shouldReduceAnimations ? transition : { 
        ...transition, 
        delay: baseDelay + (mobileAnimationConfig.enableComplexAnimations ? 0.05 : 0.02),
        duration: mobileAnimationConfig.duration
      }
    }),
    shouldReduceAnimations
  );

  const bulletContainer = createStaggerContainer({
    stagger: mobileAnimationConfig.stagger,
    delayChildren: shouldReduceAnimations ? 0 : baseDelay + (mobileAnimationConfig.enableComplexAnimations ? 0.2 : 0.1),
    enabled: !shouldReduceAnimations
  });

  const bulletVariants = resolveMotionVariants(
    createRevealVariants({
      direction: "up",
      distance: mobileAnimationConfig.enableComplexAnimations ? 20 : 12,
      transition: shouldReduceAnimations ? transition : { 
        ...transition, 
        delay: 0,
        duration: mobileAnimationConfig.duration
      }
    }),
    shouldReduceAnimations
  );

  const badgeVariants = resolveMotionVariants(
    createRevealVariants({
      direction: "up",
      distance: mobileAnimationConfig.enableComplexAnimations ? 30 : 16,
      transition: shouldReduceAnimations ? transition : { 
        ...transition, 
        delay: baseDelay,
        duration: mobileAnimationConfig.duration
      }
    }),
    shouldReduceAnimations
  );

  const ctaVariants = resolveMotionVariants(
    createRevealVariants({
      direction: "up",
      distance: mobileAnimationConfig.enableComplexAnimations ? 28 : 16,
      transition: shouldReduceAnimations ? transition : { 
        ...transition, 
        delay: baseDelay + (mobileAnimationConfig.enableComplexAnimations ? 0.32 : 0.15),
        duration: mobileAnimationConfig.duration
      }
    }),
    shouldReduceAnimations
  );

  const highlightsContainer = createStaggerContainer({
    stagger: mobileAnimationConfig.enableComplexAnimations ? 0.18 : 0.1,
    delayChildren: shouldReduceAnimations ? 0 : baseDelay + (mobileAnimationConfig.enableComplexAnimations ? 0.15 : 0.08),
    enabled: !shouldReduceAnimations
  });

  const highlightVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: mobileAnimationConfig.enableComplexAnimations ? 28 : 16, 
      transition: { ...transition, duration: mobileAnimationConfig.duration }
    }),
    shouldReduceAnimations
  );

  const bulletItems = t("common:experienceSection.bullets", {
    returnObjects: true
  }) as string[];

  const bullets = Array.isArray(bulletItems) ? bulletItems : [];

  const highlights = [
    {
      key: "experience",
      icon: Timer,
      title: t("common:experienceSection.highlights.experience.title"),
      description: t("common:experienceSection.highlights.experience.description"),
      gradient: "from-primary/5 via-primary/10 to-primary/20",
      accent: "bg-primary text-primary-foreground",
      float: {
        y: [-12, 6, -12],
        rotate: [-3, 3, -3],
        duration: 12,
        delay: 0
      }
    },
    {
      key: "funded",
      icon: Award,
      title: t("common:experienceSection.highlights.funded.title"),
      description: t("common:experienceSection.highlights.funded.description"),
      gradient: "from-secondary/5 via-secondary/10 to-secondary/20",
      accent: "bg-secondary text-secondary-foreground",
      float: {
        y: [10, -8, 10],
        rotate: [2, -2, 2],
        duration: 14,
        delay: 0.6
      }
    }
  ];

  return (
    <motion.section
      ref={elementRef}
      className={`relative overflow-hidden ${SPACING.section.py}`}
      {...sectionMotion}
      variants={sectionVariants}
    >
      <AdvancedBackground prefersReducedMotion={prefersReducedMotion} />

      <div className={`container relative ${SPACING.section.px}`}>
        <div className={`grid ${SPACING.gap.xlarge} sm:${SPACING.gap.section} lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center`}>
          <motion.div className={`${SPACING.gap.section} ${isRTL ? 'max-w-full overflow-hidden' : ''}`} variants={textVariants}>
            {/* Animated Badge */}
            <motion.div variants={badgeVariants}>
               <motion.div
                 className="w-fit"
                 animate={shouldReduceAnimations || reducedAnimations ? {} : { 
                   scale: [1, 1.02, 1]
                 }}
                 transition={{ 
                   duration: 2.5, 
                   repeat: shouldReduceAnimations ? 0 : Infinity, 
                   ease: "easeInOut" 
                 }}
               >
                  <Badge variant="no-border" className="rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm overflow-hidden border-0 ring-0 focus:ring-0 bg-clip-padding">
                    ✨ {safeT("common:experienceSection.badge", "Licensed Broker")}
                  </Badge>
               </motion.div>
            </motion.div>

            {/* Enhanced Title with Statistics */}
            <motion.div className="space-y-3 sm:space-y-4" variants={textVariants}>
              <h2 className="font-poppins text-2xl sm:text-3xl font-bold leading-tight md:text-4xl">
                <AnimatedText 
                  text={t("common:experienceSection.title")}
                  variant="title"
                  prefersReducedMotion={shouldReduceAnimations}
                  delay={mobileAnimationConfig.enableComplexAnimations ? 0.2 : 0.1}
                />
              </h2>
              
              {/* Statistics showcase */}
              <motion.div 
                className={`flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 lg:gap-6 mt-3 sm:mt-4 ${
                  isRTL ? 'max-w-full' : ''
                }`}
                initial={{ opacity: 0, y: shouldReduceAnimations ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: mobileAnimationConfig.enableComplexAnimations ? 0.8 : 0.4, 
                  duration: mobileAnimationConfig.duration 
                }}
              >
                 <div className="text-center flex-shrink-0 min-w-[85px] sm:min-w-[100px] lg:min-w-[120px] max-w-[95px] sm:max-w-[110px] lg:max-w-none">
                   <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                     <AnimatedStat target={5} suffix="+" duration={mobileAnimationConfig.enableComplexAnimations ? 2 : 0.8} />
                   </div>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-tight break-words">{safeT("common:experienceSection.stats.yearsExperience", "Years Experience")}</div>
                  </div>
                  <div className="text-center flex-shrink-0 min-w-[85px] sm:min-w-[100px] lg:min-w-[120px] max-w-[95px] sm:max-w-[110px] lg:max-w-none">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                      <AnimatedStat target={1000} suffix="+" duration={mobileAnimationConfig.enableComplexAnimations ? 2.5 : 1.0} />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-tight break-words">{safeT("common:experienceSection.stats.activeTraders", "Active Traders")}</div>
                  </div>
                  <div className="text-center flex-shrink-0 min-w-[85px] sm:min-w-[100px] lg:min-w-[120px] max-w-[95px] sm:max-w-[110px] lg:max-w-none">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                      <AnimatedStat target={10} suffix="M+" prefix="$" duration={mobileAnimationConfig.enableComplexAnimations ? 3 : 1.2} />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-tight break-words">{safeT("common:experienceSection.stats.volumeTraded", "Volume Traded")}</div>
                 </div>
              </motion.div>
            </motion.div>

            {/* Enhanced Description */}
            <motion.div variants={textVariants}>
              <TypewriterText
                text={t("common:experienceSection.description")}
                className="text-base sm:text-lg text-muted-foreground"
                prefersReducedMotion={shouldReduceAnimations}
                delay={mobileAnimationConfig.enableComplexAnimations ? 1.2 : 0.6}
                speed={mobileAnimationConfig.enableComplexAnimations ? 30 : 20}
              />
            </motion.div>

            {/* Enhanced Bullet Points with RTL-aware Connecting Lines */}
            <motion.div className="relative" variants={bulletContainer}>
              <motion.ul dir={isRTL ? 'rtl' : 'ltr'} className="list-none space-y-3 sm:space-y-4 pl-0">
                {bullets.map((bullet, index) => (
                  <motion.li 
                    key={index} 
className={`relative flex items-center gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground group ${
                      optimizedTouchTargets ? 'py-2' : ''
                    }`}
                    variants={bulletVariants}
                    whileHover={shouldReduceAnimations ? {} : { 
                      x: isRTL ? -(mobileAnimationConfig.enableComplexAnimations ? 8 : 4) : (mobileAnimationConfig.enableComplexAnimations ? 8 : 4)
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: mobileAnimationConfig.enableComplexAnimations ? 300 : 200, 
                      damping: 20 
                    }}
                    onHoverStart={() => hapticFeedback && triggerHapticFeedback('light')}
                  >
                    {/* Animated Check Icon with RTL positioning */}
                    <motion.span 
                      className={`relative z-10 flex items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 group-hover:bg-primary/20 transition-colors duration-300 flex-shrink-0 ${
                        optimizedTouchTargets ? 'h-8 w-8 min-w-[2rem]' : 'h-6 w-6 sm:h-7 sm:w-7 min-w-[1.5rem] sm:min-w-[1.75rem]'
                      }`}
                      animate={shouldReduceAnimations ? {} : {
                        scale: mobileAnimationConfig.enableComplexAnimations ? [1, 1.1, 1] : [1, 1.05, 1],
                        rotate: mobileAnimationConfig.enableComplexAnimations ? [0, 360, 0] : [0, 180, 0]
                      }}
                      transition={{ 
                        duration: mobileAnimationConfig.enableComplexAnimations ? 2 : 1.5, 
                        repeat: Infinity, 
                        ease: mobileAnimationConfig.ease,
                        delay: index * (mobileAnimationConfig.enableComplexAnimations ? 0.5 : 0.3)
                      }}
                    >
                      <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ 
                          duration: mobileAnimationConfig.enableComplexAnimations ? 0.8 : 0.5, 
                          delay: (mobileAnimationConfig.enableComplexAnimations ? 1.5 : 0.8) + index * (mobileAnimationConfig.enableComplexAnimations ? 0.2 : 0.1)
                        }}
                      >
                        <CheckCircle2 className={optimizedTouchTargets ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} />
                      </motion.div>
                    </motion.span>

                    {/* Animated Text */}
                    <span className={`group-hover:text-foreground transition-colors duration-300 flex-1 leading-tight ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>
                      <AnimatedText 
                        text={bullet}
                        prefersReducedMotion={shouldReduceAnimations}
                        delay={(mobileAnimationConfig.enableComplexAnimations ? 1.8 : 1.0) + index * (mobileAnimationConfig.enableComplexAnimations ? 0.1 : 0.05)}
                      />
                    </span>

                    {/* RTL-aware Connecting Lines - Show on desktop only */}
                    {index < bullets.length - 1 && (
                      <motion.div
                        className={`absolute z-0 w-0.5 bg-gradient-to-b from-primary/40 to-primary/10 hidden sm:block ${
                          optimizedTouchTargets 
                            ? (isRTL ? 'right-4 top-8 h-8' : 'left-4 top-8 h-8') 
                            : (isRTL ? 'right-3 sm:right-3.5 top-6 sm:top-7 h-6 sm:h-8' : 'left-3 sm:left-3.5 top-6 sm:top-7 h-6 sm:h-8')
                        }`}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ 
                          scaleY: 1, 
                          opacity: 0.8
                        }}
                        transition={{ 
                          duration: 0.5,
                          delay: (mobileAnimationConfig.enableComplexAnimations ? 2.2 : 1.4) + index * 0.1
                        }}
                        style={{ originY: 0 }}
                      />
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Enhanced CTA Button */}
            <motion.div className="flex" variants={ctaVariants}>
              <MagneticButton 
                variant="default"
                size={optimizedTouchTargets ? "lg" : "default"}
                className={`border-primary/40 text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 ${
                  optimizedTouchTargets ? 'min-h-[48px] px-6 py-3' : ''
                }`}
                prefersReducedMotion={shouldReduceAnimations}
                asChild
              >
                <Link 
                  to={localizePath("/contact")}
                  onClick={() => hapticFeedback && triggerHapticFeedback('light')}
                >
                  {t("common:experienceSection.cta.secondary")}
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Enhanced Highlights Section */}
          <motion.div variants={highlightVariants} className="relative">
             {/* Simplified ambient glow - desktop only */}
             {!shouldReduceAnimations && !reducedAnimations && mobileAnimationConfig.enableComplexAnimations && (
               <motion.div
                 className="absolute inset-0 -z-10 hidden sm:block"
                 animate={{ 
                   opacity: [0.2, 0.4, 0.2]
                 }}
                 transition={{ 
                   duration: 6, 
                   repeat: Infinity, 
                   ease: "easeInOut"
                 }}
               >
                 <div className="mx-auto h-full max-w-sm rounded-full bg-primary/5 blur-2xl" />
               </motion.div>
             )}

             {/* Simplified floating badge - desktop only */}
             {!shouldReduceAnimations && !reducedAnimations && mobileAnimationConfig.enableComplexAnimations && (
               <motion.div
                 className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 z-20 bg-gradient-to-r from-primary to-accent text-white px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-lg hidden sm:block"
                 animate={{
                   y: [-3, 3, -3]
                 }}
                 transition={{ 
                   duration: 3, 
                   repeat: Infinity, 
                   ease: "easeInOut" 
                 }}
                >
                  🏆 {safeT("common:experienceSection.badge", "Licensed Broker")}
                </motion.div>
             )}

            <motion.div
              className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2"
              variants={highlightsContainer}
            >
               {highlights.map((highlight, index) => (
                 <EnhancedCard
                   key={highlight.key}
                   icon={highlight.icon}
                   title={highlight.title}
                   description={highlight.description}
                   gradient={highlight.gradient}
                   accent={highlight.accent}
                   floatAnimation={mobileAnimationConfig.enableComplexAnimations && !reducedAnimations ? highlight.float : undefined}
                   prefersReducedMotion={shouldReduceAnimations || reducedAnimations}
                   variants={highlightVariants}
                   isMobile={reducedAnimations}
                 />
               ))}
            </motion.div>

            {/* Progress indicator */}
            {!shouldReduceAnimations && mobileAnimationConfig.enableComplexAnimations && (
              <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-6 sm:mt-8"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ 
                  delay: mobileAnimationConfig.enableComplexAnimations ? 3 : 1.5, 
                  duration: mobileAnimationConfig.duration, 
                  ease: mobileAnimationConfig.ease 
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
