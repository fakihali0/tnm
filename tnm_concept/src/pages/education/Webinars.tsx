import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, PlayCircle, Video, Users } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { WebinarsHeroBackground } from "@/components/animation/HeroBackgrounds";
import { useAnimationSequence } from "@/hooks/useAnimationSequence";
import { SPACING } from "@/styles/spacing";

export default function Webinars() {
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

  const webinars = [
    {
      title: t('webinars.items.risk.title'),
      date: t('webinars.items.risk.date'),
      time: t('webinars.items.risk.time'),
      type: "Soon",
      instructor: t('webinars.items.risk.instructor'),
      duration: t('webinars.items.risk.duration'),
      description: "Learn fundamental risk management principles for trading success."
    },
    {
      title: t('webinars.items.technical.title'),
      date: t('webinars.items.technical.date'),
      time: t('webinars.items.technical.time'),
      type: "Soon",
      instructor: t('webinars.items.technical.instructor'),
      duration: t('webinars.items.technical.duration'),
      description: "Master technical analysis tools and chart patterns."
    },
    {
      title: t('webinars.items.psychology.title'),
      date: t('webinars.items.psychology.date'),
      time: t('webinars.items.psychology.time'),
      type: "Soon",
      instructor: t('webinars.items.psychology.instructor'),
      duration: t('webinars.items.psychology.duration'),
      description: "Develop the right mindset and discipline for trading."
    }
  ];

  const upcomingSeries = [
    {
      title: "Trading Fundamentals Series",
      sessions: "6 sessions",
      startDate: t("webinars.comingSoon"),
      level: "Beginner",
      description: "Complete foundation course for new traders."
    },
    {
      title: "Advanced Technical Analysis",
      sessions: "8 sessions",
      startDate: t("webinars.comingSoon"),
      level: "Advanced",
      description: "Deep dive into advanced chart patterns and indicators."
    },
    {
      title: "Cryptocurrency Trading",
      sessions: "4 sessions",
      startDate: t("webinars.comingSoon"),
      level: "Intermediate",
      description: "Learn to trade digital assets effectively."
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative isolate overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5"
        dir={direction}
        {...heroMotion}
        variants={heroVariants}
      >
        <WebinarsHeroBackground 
          prefersReducedMotion={prefersReducedMotion} 
          animationConfig={getBackgroundConfig()}
          delaySec={0.2}
        />
        {/* Background mask for better title contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-transparent z-5" />
        <motion.div className="container py-8 md:py-12 lg:py-16 relative z-20" variants={heroFade}>
          <motion.div className="max-w-4xl mx-auto text-center" variants={heroFade}>
            <motion.div className={SPACING.margin.headingXLarge} variants={heroFade}>
              <Badge variant="outline" className={`${SPACING.margin.heading} px-4 py-2 ${SPACING.gap.small}`}>
                <Video className="h-4 w-4" />
                {t("badge")}
              </Badge>
            </motion.div>
            <motion.h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold font-poppins ${SPACING.margin.headingLarge} gradient-text leading-tight hero-title`} variants={heroFade}>
              {t("webinars.title")}
            </motion.h1>
            <motion.p className={`text-lg md:text-xl lg:text-2xl text-muted-foreground ${SPACING.margin.headingXLarge} leading-relaxed`} variants={heroFade}>
              {t("webinars.subtitle")}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Upcoming Webinars */}
      <motion.section className={SPACING.section.py} {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className={`text-center ${SPACING.margin.headingHuge}`} variants={sectionFade}>
            <motion.h2 className={`font-poppins text-3xl font-bold ${SPACING.margin.heading}`} variants={sectionFade}>
              {t("webinars.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              {t("webinars.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className={`grid ${SPACING.gap.card} md:grid-cols-2 lg:grid-cols-3`} variants={staggerContainer}>
            {webinars.map((webinar, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg border-2 hover:border-primary/20 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={webinar.type === "Live" ? "default" : webinar.type === "Soon" ? "outline" : "secondary"}>
                        {webinar.type === "Live" ? <Calendar className="h-3 w-3 mr-1" /> : webinar.type === "Soon" ? <Clock className="h-3 w-3 mr-1" /> : <PlayCircle className="h-3 w-3 mr-1" />}
                        {webinar.type === "Live" ? t("webinars.live") : webinar.type === "Soon" ? t("webinars.soon") : t("webinars.recorded")}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {webinar.duration}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{webinar.title}</CardTitle>
                    <CardDescription>
                      <div className="mb-2">
                        {webinar.date} {webinar.time !== t("webinars.status.recorded") && webinar.time !== "مسجل" && `at ${webinar.time}`}
                      </div>
                      <div className="text-sm">Instructor: {webinar.instructor}</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground mb-4">{webinar.description}</p>
                    <Button
                      className="w-full"
                      variant={webinar.type === "Live" ? "default" : "outline"}
                      disabled={webinar.type === "Soon"}
                    >
                      {webinar.type === "Live" ? t("webinars.registerNow") : webinar.type === "Soon" ? t("webinars.comingSoon") : t("webinars.watchRecording")}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Webinar Series */}
      <motion.section className={`${SPACING.section.py} bg-muted/20`} {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className={`text-center ${SPACING.margin.headingHuge}`} variants={sectionFade}>
            <motion.h2 className={`font-poppins text-3xl font-bold ${SPACING.margin.heading}`} variants={sectionFade}>
              Webinar Series
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              Join our comprehensive webinar series for structured learning.
            </motion.p>
          </motion.div>

          <motion.div className={`grid ${SPACING.gap.card} md:grid-cols-2 lg:grid-cols-3`} variants={staggerContainer}>
            {upcomingSeries.map((series, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="trading-card">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{series.level}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        {series.sessions}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{series.title}</CardTitle>
                    <CardDescription>
                      Starts: {series.startDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{series.description}</p>
                    <Button className="w-full" variant="outline" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      {t("webinars.comingSoon")}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section className={SPACING.section.py} {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center max-w-2xl mx-auto" variants={sectionFade}>
            <motion.h2 className={`font-poppins text-3xl font-bold ${SPACING.margin.heading}`} variants={sectionFade}>
              {t("cta.title")}
            </motion.h2>
            <motion.p className={`text-lg text-muted-foreground ${SPACING.margin.headingXLarge}`} variants={sectionFade}>
              {t("cta.subtitle")}
            </motion.p>
            <motion.div className={`flex flex-col sm:flex-row ${SPACING.gap.medium} justify-center`} variants={sectionFade}>
              <Button size="lg" className="gradient-bg text-white shadow-primary gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("webinars.comingSoon")}
              </Button>
              <Button variant="outline" size="lg" className="gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("webinars.comingSoon")}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}
