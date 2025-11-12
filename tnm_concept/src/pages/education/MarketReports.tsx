import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Calendar, TrendingUp, FileText, Download, BarChart3, Globe, Clock } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { MarketReportsHeroBackground } from "@/components/animation/HeroBackgrounds";
import { useAnimationSequence } from "@/hooks/useAnimationSequence";
import { SPACING } from "@/styles/spacing";

export default function MarketReports() {
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
  const asArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

  // Simplified to avoid missing translation keys
  const reportCategories = [];

  const marketReports = [
    {
      title: t('articles.items.mistakes.title'),
      date: "January 2024",
      type: "Guide",
      description: t('articles.items.mistakes.excerpt'),
      highlights: ["Key trading errors to avoid", "Risk management tips", "Psychology insights"],
      downloadSize: "2.5 MB",
      pages: "25 pages"
    },
    {
      title: t('articles.items.volatility.title'),
      date: "January 2024",
      type: "Analysis",
      description: t('articles.items.volatility.excerpt'),
      highlights: ["Market volatility patterns", "Trading strategies", "Risk assessment"],
      downloadSize: "3.2 MB",
      pages: "32 pages"
    },
    {
      title: t('articles.items.plan.title'),
      date: "January 2024",
      type: "Template",
      description: t('articles.items.plan.excerpt'),
      highlights: ["Trading plan framework", "Goal setting", "Performance tracking"],
      downloadSize: "1.8 MB",
      pages: "18 pages"
    }
  ];

  // Simplified to avoid missing translation keys
  const upcomingReports = [];

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative isolate overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5"
        dir={direction}
        {...heroMotion}
        variants={heroVariants}
      >
        <MarketReportsHeroBackground 
          prefersReducedMotion={prefersReducedMotion} 
          animationConfig={getBackgroundConfig()}
          delaySec={0.2}
        />
        {/* Background mask for better title contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-transparent z-5" />
        <motion.div className="container py-8 md:py-12 lg:py-16 relative z-20" variants={heroFade}>
          <motion.div className="max-w-4xl mx-auto text-center" variants={heroFade}>
            <motion.div className="mb-8" variants={heroFade}>
              <Badge variant="outline" className="mb-4 px-4 py-2 gap-2">
                <FileText className="h-4 w-4" />
                {t("badge")}
              </Badge>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 gradient-text leading-tight hero-title" variants={heroFade}>
              {t("articles.title")}
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" variants={heroFade}>
              {t("articles.subtitle")}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Educational Articles */}
      <motion.section className="py-16 bg-muted/20" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t("articles.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              {t("articles.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {marketReports.map((report, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="trading-card">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {report.date}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Highlights</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {report.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{report.pages}</span>
                      <span>{report.downloadSize}</span>
                    </div>

                    <Button className="w-full gap-2" variant="outline" disabled>
                      <Clock className="h-4 w-4" />
                      {t("articles.ctaComingSoon")}
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
                {t("articles.ctaComingSoon")}
              </Button>
              <Button variant="outline" size="lg" className="gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("articles.ctaComingSoon")}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}
