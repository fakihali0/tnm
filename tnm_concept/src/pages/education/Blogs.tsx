import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, User, ArrowRight, TrendingUp, BookOpen, Target } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { BlogsHeroBackground } from "@/components/animation/HeroBackgrounds";
import { useAnimationSequence } from "@/hooks/useAnimationSequence";
import { SPACING } from "@/styles/spacing";

export default function Blogs() {
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

  const blogPosts = [
    {
      titleKey: "mistakes.title",
      excerptKey: "mistakes.excerpt", 
      authorKey: "Sarah Johnson",
      date: "January 10, 2024",
      readTime: "8 min read",
      categoryKey: "beginner",
      tags: ["Beginner", "Risk Management", "Psychology"],
      featured: true
    },
    {
      titleKey: "volatility.title",
      excerptKey: "volatility.excerpt",
      authorKey: "Ahmed Al-Rashid",
      date: "January 8, 2024", 
      readTime: "12 min read",
      categoryKey: "strategy",
      tags: ["Intermediate", "Volatility", "Strategy"],
      featured: true
    },
    {
      titleKey: "plan.title",
      excerptKey: "plan.excerpt",
      authorKey: "Maria Rodriguez",
      date: "January 5, 2024",
      readTime: "15 min read",
      categoryKey: "beginner",
      tags: ["Beginner", "Planning", "Strategy"],
      featured: true
    },
    {
      titleKey: "ai.title",
      excerptKey: "ai.excerpt",
      authorKey: "David Chen",
      date: "January 3, 2024",
      readTime: "10 min read",
      categoryKey: "technology",
      tags: ["AI", "Automation", "Future"],
      featured: true
    },
    {
      titleKey: "news.title",
      excerptKey: "news.excerpt",
      authorKey: "Emma Thompson",
      date: "December 28, 2023",
      readTime: "7 min read",
      categoryKey: "news",
      tags: ["News Trading", "Events", "Strategy"],
      featured: false
    },
    {
      titleKey: "mindset.title",
      excerptKey: "mindset.excerpt",
      authorKey: "John Wilson",
      date: "December 25, 2023",
      readTime: "9 min read",
      categoryKey: "psychology",
      tags: ["Psychology", "Mindset", "Success"],
      featured: false
    },
    {
      titleKey: "indicators.title",
      excerptKey: "indicators.excerpt",
      authorKey: "Lisa Park",
      date: "December 22, 2023",
      readTime: "14 min read",
      categoryKey: "technical",
      tags: ["Technical Analysis", "Indicators", "Charts"],
      featured: false
    },
    {
      titleKey: "blockchain.title",
      excerptKey: "blockchain.excerpt",
      authorKey: "Dr. Robert Taylor",
      date: "December 20, 2023",
      readTime: "11 min read",
      categoryKey: "technology",
      tags: ["Crypto", "Blockchain", "Digital Assets"],
      featured: false
    },
    {
      titleKey: "position.title",
      excerptKey: "position.excerpt",
      authorKey: "Alex Kumar",
      date: "December 18, 2023",
      readTime: "13 min read",
      categoryKey: "risk",
      tags: ["Risk Management", "Position Sizing", "Strategy"],
      featured: false
    },
    {
      titleKey: "backtest.title",
      excerptKey: "backtest.excerpt",
      authorKey: "Jennifer Lee",
      date: "December 15, 2023",
      readTime: "8 min read",
      categoryKey: "strategy",
      tags: ["Backtesting", "Strategy", "Analysis"],
      featured: false
    },
    {
      titleKey: "correlation.title",
      excerptKey: "correlation.excerpt",
      authorKey: "Michael Brown",
      date: "December 12, 2023",
      readTime: "12 min read",
      categoryKey: "analysis",
      tags: ["Correlations", "Currency Pairs", "Analysis"],
      featured: false
    },
    {
      titleKey: "scalping.title",
      excerptKey: "scalping.excerpt",
      authorKey: "Sophie Martinez",
      date: "December 10, 2023",
      readTime: "6 min read",
      categoryKey: "strategy",
      tags: ["Scalping", "Short-term", "Quick Profits"],
      featured: false
    }
  ];

  const categories = [
    { 
      nameKey: "strategy", 
      count: "4", 
      color: "bg-purple-100 text-purple-800" 
    },
    { 
      nameKey: "analysis", 
      count: "3", 
      color: "bg-blue-100 text-blue-800" 
    },
    { 
      nameKey: "beginner", 
      count: "3", 
      color: "bg-green-100 text-green-800" 
    },
    { 
      nameKey: "risk", 
      count: "2", 
      color: "bg-red-100 text-red-800" 
    },
    { 
      nameKey: "technical", 
      count: "2", 
      color: "bg-orange-100 text-orange-800" 
    },
    { 
      nameKey: "psychology", 
      count: "2", 
      color: "bg-pink-100 text-pink-800" 
    },
    { 
      nameKey: "automation", 
      count: "1", 
      color: "bg-indigo-100 text-indigo-800" 
    },
    { 
      nameKey: "news", 
      count: "1", 
      color: "bg-yellow-100 text-yellow-800" 
    },
    { 
      nameKey: "technology", 
      count: "2", 
      color: "bg-teal-100 text-teal-800" 
    }
  ];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative isolate overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5"
        dir={direction}
        {...heroMotion}
        variants={heroVariants}
      >
        <BlogsHeroBackground 
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
                <BookOpen className="h-4 w-4" />
                {t("badge")}
              </Badge>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 gradient-text leading-tight hero-title" variants={heroFade}>
              {t("blogs.title")}
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" variants={heroFade}>
              {t("blogs.subtitle")}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Blog Categories */}
      <motion.section className="py-16" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t('blogs.categories.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              {t('blogs.categories.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" variants={staggerContainer}>
            {categories.map((category, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <Badge className={`mb-2 ${category.color}`}>
                      {category.count} articles
                    </Badge>
                    <h3 className="font-semibold text-sm">
                      {t(`blogs.categories.${category.nameKey}`)}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Featured Posts */}
      <motion.section className="py-16 bg-muted/20" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t('blogs.featured.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              Essential reads for traders
            </motion.p>
          </motion.div>

          <motion.div className="grid gap-8 md:grid-cols-2" variants={staggerContainer}>
            {featuredPosts.map((post, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="trading-card group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                        {t('blogs.featured.badge')}
                      </Badge>
                      <Badge variant="outline">
                        {t(`blogs.categories.${post.categoryKey}`) || post.categoryKey}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {t(`blogs.posts.${post.titleKey}`)}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {t(`blogs.posts.${post.excerptKey}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.authorKey}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </div>
                    </div>

                    <Button className="w-full gap-2" variant="outline" disabled>
                      <Clock className="h-4 w-4" />
                      {t("blogs.newsletter.comingSoon")}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Recent Posts */}
      <motion.section className="py-16" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t('blogs.recent.title')}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={sectionFade}>
              Latest insights and analysis
            </motion.p>
          </motion.div>

          <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {regularPosts.map((post, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="trading-card group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {t(`blogs.categories.${post.categoryKey}`) || post.categoryKey}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {t(`blogs.posts.${post.titleKey}`)}
                    </CardTitle>
                    <CardDescription>
                      {t(`blogs.posts.${post.excerptKey}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{post.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.authorKey}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </div>
                    </div>

                    <Button className="w-full gap-2" variant="ghost" disabled>
                      <Clock className="h-4 w-4" />
                      {t("blogs.newsletter.comingSoon")}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Newsletter CTA */}
      <motion.section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5" {...sectionsMotion} variants={sectionVariants}>
        <motion.div className="container" variants={sectionFade}>
          <motion.div className="text-center max-w-2xl mx-auto" variants={sectionFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={sectionFade}>
              {t("blogs.newsletter.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground mb-8" variants={sectionFade}>
              {t("blogs.newsletter.subtitle")}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={sectionFade}>
              <Button size="lg" className="gradient-bg text-white shadow-primary gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("blogs.newsletter.subscribe")}
              </Button>
              <Button variant="outline" size="lg" className="gap-2" disabled>
                <Clock className="h-5 w-5" />
                {t("blogs.newsletter.comingSoon")}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}
