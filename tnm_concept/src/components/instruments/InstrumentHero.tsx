import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, ArrowRight } from "lucide-react";
import { MarketOverviewWidget } from "./MarketOverviewWidget";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, resolveMotionVariants } from "@/components/animation/variants";
import { SPACING } from "@/styles/spacing";

interface InstrumentHeroProps {
  onSearch: (query: string) => void;
  onFilterByCategory: (category: string) => void;
  activeCategory: string;
  categoryCounts: { [key: string]: number };
}

export function InstrumentHero({ 
  onSearch, 
  onFilterByCategory, 
  activeCategory, 
  categoryCounts 
}: InstrumentHeroProps) {
  const { t } = useTranslation(['common','translation']);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // Stable sparkline data for EURUSD example
  const heroSparklineData = useMemo(() => {
    const seed = "EURUSD".split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (index: number) => (Math.sin(seed + index) + 1) / 2;
    return Array.from({ length: 20 }, (_, i) => 30 + random(i) * 40);
  }, []);

  const categories = [
    { key: "all", label: t('instruments.categories.all') },
    { key: "forex", label: t('instruments.categories.forex') },
    { key: "indices", label: t('instruments.categories.indices') },
    { key: "commodities", label: t('instruments.categories.commodities') },
    { key: "crypto", label: t('instruments.categories.crypto') }
  ];

  // Use immediate animations for first load
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation({ 
    forceImmediate: true,
    delay: 0 
  });
  
  const titleVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 30 }),
    prefersReducedMotion
  );
  
  const subtitleVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 20, transition: { ...transition, delay: 0.2 } }),
    prefersReducedMotion
  );
  
  const searchVariants = resolveMotionVariants(
    createRevealVariants({ direction: "up", distance: 20, transition: { ...transition, delay: 0.4 } }),
    prefersReducedMotion
  );
  
  const widgetVariants = resolveMotionVariants(
    createRevealVariants({ direction: "left", distance: 30, transition: { ...transition, delay: 0.6 } }),
    prefersReducedMotion
  );

  return (
    <section className="py-16 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/30"></div>
        <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-accent/20"></div>
        <div className="absolute bottom-20 left-1/3 w-16 h-16 rounded-full bg-primary/40"></div>
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={SPACING.gap.xlarge}>
            <div className={SPACING.stack.comfortable}>
              <motion.h1 
                className="font-poppins text-4xl lg:text-5xl font-bold tracking-tight"
                {...motionProps}
                variants={titleVariants}
              >
                {t('instruments.hero.title')}
              </motion.h1>
              <motion.p 
                className="text-lg text-muted-foreground leading-relaxed"
                {...motionProps}
                variants={subtitleVariants}
              >
                {t('instruments.hero.subtitle')}
              </motion.p>
            </div>

            {/* Search Bar */}
            <motion.div
              {...motionProps}
              variants={searchVariants}
            >
              <Card className={SPACING.padding.cardSmall}>
                <form onSubmit={handleSearchSubmit} className={SPACING.stack.comfortable}>
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${SPACING.icon.sm} text-muted-foreground`} />
                    <Input
                      type="text"
                      placeholder={t('instruments.hero.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-3"
                    />
                  </div>
                  
                  {/* Quick Filter Tabs */}
                  <div className={`flex flex-wrap ${SPACING.gap.small}`}>
                    {categories.map((category) => {
                      const count = categoryCounts[category.key] || 0;
                      if (category.key !== "all" && count === 0) return null;
                      
                      return (
                        <Badge
                          key={category.key}
                          variant={activeCategory === category.key ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => onFilterByCategory(category.key)}
                        >
                          {category.label} {count > 0 && `(${count})`}
                        </Badge>
                      );
                    })}
                  </div>
                </form>
              </Card>
            </motion.div>

          </div>

          {/* Right Market Overview Widget */}
          <motion.div 
            className="hidden lg:block"
            {...motionProps}
            variants={widgetVariants}
          >
            <MarketOverviewWidget />
          </motion.div>
        </div>
      </div>
    </section>
  );
}