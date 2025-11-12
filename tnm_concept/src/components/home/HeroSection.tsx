import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3, Monitor } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { useTranslation, Trans } from 'react-i18next';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, resolveMotionVariants } from "@/components/animation/variants";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import TradingAnimations from "./TradingAnimations";
import { SPACING } from "@/styles/spacing";


export function HeroSection() {
  const { t } = useTranslation(['common', 'translation']);
  const { localizePath } = useLocalizedPath();
  const isMobile = useIsMobile();
  
  // Use immediate animations for first load with mobile-specific settings
  const { motionProps, transition, prefersReducedMotion, elementRef, reducedMotionClassName } = useSectionAnimation({ 
    forceImmediate: true,
    delay: 0,
    duration: isMobile ? 0.4 : 0.6, // Faster animations on mobile
    ease: isMobile ? [0.25, 0.46, 0.45, 0.94] : [0.22, 1, 0.36, 1] // Smoother easing on mobile
  });
  
  // Mobile-optimized animation variants with enhanced performance
  const titleVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: isMobile ? 12 : 30, // Reduced from 15 to 12 for better mobile performance
      transition: { 
        ...transition, 
        // Faster, smoother animations for mobile
        duration: isMobile ? 0.35 : 0.6,
        // Add scale safeguards to prevent compression
        scale: { min: 0.95, max: 1.05 }
      }
    }),
    prefersReducedMotion
  );
  
  const subtitleVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: isMobile ? 8 : 20, // Reduced from 10 to 8 for smoother mobile experience
      transition: { 
        ...transition, 
        delay: isMobile ? 0.08 : 0.2, // Slightly faster delay for mobile
        duration: isMobile ? 0.35 : 0.6,
        scale: { min: 0.98, max: 1.02 }
      }
    }),
    prefersReducedMotion
  );
  
  const ctaVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: isMobile ? 10 : 20, 
      transition: { 
        ...transition, 
        delay: isMobile ? 0.2 : 0.4,
        scale: { min: 0.98, max: 1.02 }
      }
    }),
    prefersReducedMotion
  );
  
  const trustBadgesVariants = resolveMotionVariants(
    createRevealVariants({ 
      direction: "up", 
      distance: isMobile ? 10 : 20, 
      transition: { 
        ...transition, 
        delay: isMobile ? 0.3 : 0.6,
        scale: { min: 0.98, max: 1.02 }
      }
    }),
    prefersReducedMotion
  );

  return (
    <section className="relative min-h-[100dvh] md:min-h-[90vh] flex items-center justify-center overflow-hidden safe-area-inset-top safe-area-inset-bottom">
      {/* Simplified Background */}
      <div className="absolute inset-0 hero-gradient opacity-5" />
      
      {/* Trading Animations */}
      <TradingAnimations
        prefersReducedMotion={prefersReducedMotion}
        isMobile={isMobile}
      />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl" />
      
      <div className={`container relative z-10 ${SPACING.section.px} py-8 md:py-12 lg:py-16`}>
        <div className={`mx-auto max-w-4xl text-center ${SPACING.gap.section}`}>
          {/* Main Headline - Critical for LCP, animated on first load */}
          <motion.h1 
            ref={elementRef}
            className={cn("font-poppins text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight sm:leading-tight md:leading-tight", reducedMotionClassName)}
            {...motionProps}
            variants={titleVariants}
          >
            <Trans 
              i18nKey="hero.title"
              components={{
                primary: <span className="text-primary" />,
                accent: <span className="text-accent" />
              }}
            />
          </motion.h1>
          
          {/* Subheadline - Critical for LCP, animated on first load */}
          <motion.p 
            className={cn("mx-auto max-w-2xl text-lg font-medium leading-7 text-muted-foreground sm:text-xl md:text-2xl md:leading-8", reducedMotionClassName)}
            {...motionProps}
            variants={subtitleVariants}
          >
            {t('hero.subtitle')}
          </motion.p>
          
          {/* CTA Buttons - Animated on first load for smooth experience */}
          <motion.div 
            className={cn(`flex flex-col sm:flex-row ${SPACING.gap.medium} items-center justify-center`, reducedMotionClassName)}
            {...motionProps}
            variants={ctaVariants}
          >
            <Button 
              size="mobile" 
              className="gradient-bg text-white shadow-primary gap-2 touch-feedback no-tap-highlight w-full sm:w-auto"
              asChild
            >
              <a 
                href={AUTH_URLS.REGISTRATION} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick({ buttonType: 'start-trading-now', buttonLocation: 'hero-section' })}
              >
                {t('auth.startTradingNow')}
                <TrendingUp className="h-5 w-5" />
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="mobile"
              className="border-primary text-primary hover:bg-primary hover:text-white touch-feedback no-tap-highlight w-full sm:w-auto"
              asChild
            >
              <a 
                href={AUTH_URLS.DEMO} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => trackButtonClick({ buttonType: 'start-free-demo', buttonLocation: 'hero-section' })}
              >
                {t('auth.tryDemoAccount')}
              </a>
            </Button>
          </motion.div>
          
          {/* Trust Badges - Animated on first load */}
          <motion.div 
            className={cn("mt-8 md:mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-3 md:gap-6 lg:gap-8", reducedMotionClassName)}
            {...motionProps}
            variants={trustBadgesVariants}
          >
            <Link to={localizePath("/products")}>
              <div className="flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px]">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('hero.trustBadges.cmaRegulated')}</span>
              </div>
            </Link>
            
            <Link to={localizePath("/products/account-types")}>
              <div className="flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px]">
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('hero.trustBadges.zeroCommission')}</span>
              </div>
            </Link>
            
            <Link to={localizePath("/products/platforms")}>
              <div className="flex items-center gap-4 px-6 py-4 md:px-8 md:py-5 bg-card/50 border border-border/50 rounded-full hover:bg-card hover:border-border transition-all duration-300 hover:scale-105 min-h-[56px] md:min-h-[60px]">
                <Monitor className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">{t('hero.trustBadges.officialMT5')}</span>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}