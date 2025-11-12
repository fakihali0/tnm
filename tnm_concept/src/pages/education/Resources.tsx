import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Download, BookOpen, FileText, Video, HeadphonesIcon, Clock } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { ResourcesHeroBackground } from "@/components/animation/HeroBackgrounds";
import { useAnimationSequence } from "@/hooks/useAnimationSequence";
import { SPACING } from "@/styles/spacing";

export default function Resources() {
  const { t } = useTranslation("education");

  // Initialize animation sequencing
  const animationSequence = useAnimationSequence({
    enableSequencing: false,
    backgroundDelay: 100,
    contentDelay: 400,
    staggerDelay: 200
  });
  const { getBackgroundConfig, getContentConfig, getStaggerConfig } = animationSequence;

  const {
    motionProps: heroMotion,
    transition: heroTransition,
    prefersReducedMotion
  } = useSectionAnimation({
    amount: 0.3,
    delay: 0.2,
    forceImmediate: true
  });
  const { motionProps: sectionsMotion, transition: sectionsTransition } = useSectionAnimation({
    amount: 0.25,
    delay: 0.4
  });

  const buildReveal = (transition: Transition, distance = 48) =>
    resolveMotionVariants(createRevealVariants({ direction: "up", distance, transition }), prefersReducedMotion);
  const buildFade = (transition: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction: "none", transition }), prefersReducedMotion);
  const buildStagger = (transition: Transition, stagger?: number) => {
    const staggerConfig = getStaggerConfig();
    return createStaggerContainer({
      stagger: stagger ?? staggerConfig.stagger,
      delayChildren: staggerConfig.delayChildren,
      enabled: !prefersReducedMotion && staggerConfig.shouldAnimate
    });
  };

  const heroVariants = buildReveal(heroTransition, 64);
  const heroFade = buildFade(heroTransition);
  const sectionVariants = buildReveal(sectionsTransition, 56);
  const sectionFade = buildFade(sectionsTransition);
  const cardVariants = buildReveal(sectionsTransition, 32);
  const staggerContainer = buildStagger(sectionsTransition);

  const direction = t("dir") === "rtl" ? "rtl" : "ltr";

  const resources = [
    {
      title: t('resources.items.guide.title'),
      description: t('resources.items.guide.description'),
      type: t('resources.items.guide.type'),
      pages: t('resources.items.guide.pages'),
      category: "guide",
      icon: BookOpen
    },
    {
      title: t('resources.items.workbook.title'),
      description: t('resources.items.workbook.description'),
      type: t('resources.items.workbook.type'),
      pages: t('resources.items.workbook.pages'),
      category: "workbook",
      icon: FileText
    },
    {
      title: t('resources.items.templates.title'),
      description: t('resources.items.templates.description'),
      type: t('resources.items.templates.type'),
      pages: t('resources.items.templates.pages'),
      category: "templates",
      icon: Download
    }
  ];

  // Simplified to avoid missing translation keys
  const additionalResources = [];

  // Simplified to avoid missing translation keys
  const resourceCategories = [];

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5"
        dir={direction}
        {...heroMotion}
        variants={heroVariants}
      >
        <ResourcesHeroBackground 
          prefersReducedMotion={prefersReducedMotion} 
          animationConfig={getBackgroundConfig()}
          delaySec={1.2}
        />
        <motion.div className="container py-8 md:py-12 lg:py-16" variants={heroFade}>
          <motion.div className="max-w-4xl mx-auto text-center" variants={heroFade}>
            <motion.div className="mb-8" variants={heroFade}>
              <Badge variant="outline" className="mb-4 px-4 py-2 gap-2">
                <BookOpen className="h-4 w-4" />
                {t("badge")}
              </Badge>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 gradient-text leading-tight" variants={heroFade}>
              {t("resources.title")}
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" variants={heroFade}>
              {t("resources.subtitle")}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Educational Resources */}
      <motion.section className="py-16 bg-muted/20" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t("resources.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              {t("resources.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {resources.map((resource, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
                        <resource.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline">{resource.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">{resource.pages}</span>
                      <Badge variant="secondary">Free</Badge>
                    </div>
                    <Button className="w-full gap-2" variant="outline" disabled>
                      <Clock className="h-4 w-4" />
                      {t("resources.ctaComingSoon")}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center max-w-2xl mx-auto" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t("cta.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground mb-8" variants={sectionFade}>
              {t("cta.subtitle")}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={sectionFade}>
              <Button size="lg" className="gradient-bg text-white shadow-primary gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("resources.ctaComingSoon")}
              </Button>
              <Button variant="outline" size="lg" className="gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("resources.ctaComingSoon")}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}
