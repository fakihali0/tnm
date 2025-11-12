import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingViewEconomicCalendar } from "@/components/home/LazyTradingViewWidgets";
import { AUTH_URLS, SUPPORT_LINKS, redirectToAuth } from "@/utils/auth-redirects";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import EducationAnimations from "@/components/education/EducationAnimations";
import { SPACING } from "@/styles/spacing";

import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Users, 
  Video, 
  FileText, 
  Download,
  Clock,
  PlayCircle
} from "lucide-react";

export default function Education() {
  const { t, i18n } = useTranslation('education');
  const { localizePath } = useLocalizedPath();

  const {
    motionProps: heroMotion,
    transition: heroTransition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.3, delay: 0.05 });
  const { motionProps: sectionsMotion, transition: sectionsTransition } = useSectionAnimation({
    amount: 0.25,
    delay: 0.08
  });

  const buildReveal = (transition: Transition, distance = 48) =>
    resolveMotionVariants(createRevealVariants({ direction: "up", distance, transition }), prefersReducedMotion);
  const buildFade = (transition: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction: "none", transition }), prefersReducedMotion);
  const buildStagger = (transition: Transition, stagger = 0.08) =>
    createStaggerContainer({
      stagger,
      delayChildren: transition.delay ?? 0,
      enabled: !prefersReducedMotion
    });

  const heroVariants = buildReveal(heroTransition, 64);
  const heroFade = buildFade(heroTransition);
  const sectionVariants = buildReveal(sectionsTransition, 56);
  const sectionFade = buildFade(sectionsTransition);
  const cardVariants = buildReveal(sectionsTransition, 32);
  const staggerContainer = buildStagger(sectionsTransition);

  const webinars = [
    {
      title: t('webinars.items.risk.title'),
      date: t('webinars.items.risk.date'),
      time: t('webinars.items.risk.time'),
      type: "Soon",
      instructor: t('webinars.items.risk.instructor'),
      duration: t('webinars.items.risk.duration')
    },
    {
      title: t('webinars.items.technical.title'),
      date: t('webinars.items.technical.date'),
      time: t('webinars.items.technical.time'),
      type: "Soon",
      instructor: t('webinars.items.technical.instructor'),
      duration: t('webinars.items.technical.duration')
    },
    {
      title: t('webinars.items.psychology.title'),
      date: t('webinars.items.psychology.date'),
      time: t('webinars.items.psychology.time'),
      type: "Soon",
      instructor: t('webinars.items.psychology.instructor'),
      duration: t('webinars.items.psychology.duration')
    }
  ];

  const resources = [
    {
      title: t('resources.items.guide.title'),
      description: t('resources.items.guide.description'),
      type: t('resources.items.guide.type'),
      pages: t('resources.items.guide.pages')
    },
    {
      title: t('resources.items.workbook.title'),
      description: t('resources.items.workbook.description'),
      type: t('resources.items.workbook.type'),
      pages: t('resources.items.workbook.pages')
    },
    {
      title: t('resources.items.templates.title'),
      description: t('resources.items.templates.description'),
      type: t('resources.items.templates.type'),
      pages: t('resources.items.templates.pages')
    }
  ];

  const articles = [
    {
      title: t('articles.items.mistakes.title'),
      excerpt: t('articles.items.mistakes.excerpt'),
      readTime: t('articles.items.mistakes.readTime'),
      category: t('articles.categories.beginner')
    },
    {
      title: t('articles.items.volatility.title'),
      excerpt: t('articles.items.volatility.excerpt'),
      readTime: t('articles.items.volatility.readTime'),
      category: t('articles.categories.strategy')
    },
    {
      title: t('articles.items.plan.title'),
      excerpt: t('articles.items.plan.excerpt'),
      readTime: t('articles.items.plan.readTime'),
      category: t('articles.categories.beginner')
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden flex items-center justify-center"
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        {...heroMotion}
        variants={heroVariants}
      >
        <EducationAnimations />
        <motion.div className="container relative z-10 py-8 md:py-12 lg:py-16" variants={heroFade}>
          <motion.div className="max-w-4xl mx-auto text-center" variants={heroFade}>
            <motion.div className="mb-8 md:mb-10" variants={heroFade}>
              <Badge variant="outline" className="mb-6 px-4 py-2 gap-2">
                <BookOpen className="h-4 w-4" />
                {t('badge')}
              </Badge>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 md:mb-8 gradient-text leading-[1.2] lg:leading-[1.1]" variants={heroFade}>
              {t('hero.title')}
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed" variants={heroFade}>
              {t('hero.subtitle')}
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-bg text-white shadow-primary hover:shadow-glow transition-all duration-300 gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t('hero.primaryCtaComingSoon')}
              </Button>
              <Button variant="outline" size="lg" className="gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t('hero.secondaryCtaComingSoon')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Upcoming Webinars */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('webinars.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('webinars.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {webinars.map((webinar, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg border-2 hover:border-primary/20 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={webinar.type === "Live" ? "default" : webinar.type === "Soon" ? "outline" : "secondary"}>
                        {webinar.type === "Live" ? <Calendar className="h-3 w-3 mr-1" /> : webinar.type === "Soon" ? <Clock className="h-3 w-3 mr-1" /> : <PlayCircle className="h-3 w-3 mr-1" />}
                        {webinar.type === "Live" ? t('webinars.live') : webinar.type === "Soon" ? t('webinars.soon') : t('webinars.recorded')}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {webinar.duration}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{webinar.title}</CardTitle>
                    <CardDescription>
                      <div>
                        {webinar.date}
                        {webinar.time !== t('webinars.recorded') &&
                          ` ${t('webinars.atTime', { time: webinar.time })}`
                        }
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                    <Button 
                      className="w-full" 
                      variant={webinar.type === "Live" ? "default" : "outline"}
                      disabled={webinar.type === "Soon"}
                    >
                      {webinar.type === "Live" ? t('webinars.registerNow') : webinar.type === "Soon" ? t('webinars.comingSoon') : t('webinars.watchRecording')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Educational Resources */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('resources.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('resources.subtitle')}
            </p>
          </div>
          
           <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {resources.map((resource, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{resource.type}</Badge>
                      <span className="text-sm text-muted-foreground">{resource.pages}</span>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                    <Button className="w-full gap-2" variant="outline" disabled>
                      <Clock className="h-4 w-4" />
                      {t('resources.ctaComingSoon')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Latest Articles */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('articles.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('articles.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {articles.map((article, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{article.category}</Badge>
                      <span className="text-sm text-muted-foreground">{article.readTime}</span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription>{article.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                    <Button className="w-full gap-2" variant="ghost" disabled>
                      <Clock className="h-4 w-4" />
                      {t('articles.ctaComingSoon')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto text-center" variants={sectionFade}>
          <h2 className="text-3xl font-bold font-poppins mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-bg text-white shadow-primary hover:shadow-glow transition-all duration-300 gap-2"
              onClick={() => redirectToAuth(AUTH_URLS.FUNDING, 'join-trading-program', 'education-cta')}
            >
              <Users className="h-5 w-5" />
              {t('cta.joinProgram')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={() => redirectToAuth(SUPPORT_LINKS.CONSULTATION, 'schedule-consultation', 'education-cta')}
            >
              <Calendar className="h-5 w-5" />
              {t('cta.scheduleConsultation')}
            </Button>
          </div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}