import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, TrendingUp, Shield, DollarSign, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { SPACING } from "@/styles/spacing";

export function OverviewSection() {
  const { t } = useTranslation(['common','translation']);
  const { localizePath } = useLocalizedPath();

  const explanations = [
    {
      icon: DollarSign,
      title: t('overviewSection.howPricingWorks.title'),
      description: t('overviewSection.howPricingWorks.description'),
      details: t('overviewSection.howPricingWorks.details')
    },
    {
      icon: TrendingUp,
      title: t('overviewSection.leverageRisk.title'),
      description: t('overviewSection.leverageRisk.description'),
      details: t('overviewSection.leverageRisk.details')
    },
    {
      icon: Clock,
      title: t('overviewSection.swapCosts.title'),
      description: t('overviewSection.swapCosts.description'),
      details: t('overviewSection.swapCosts.details')
    }
  ];

  return (
    <section id="overview" className="py-16 bg-muted/20">
      <div className="container">
        <div className={`text-center ${SPACING.margin.headingHuge}`}>
          <h2 className={`font-poppins text-2xl font-bold ${SPACING.margin.heading}`}>
            {t('overviewSection.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('overviewSection.subtitle')}
          </p>
        </div>

        <div className={`grid md:grid-cols-3 ${SPACING.gap.card}`}>
          {explanations.map((item, index) => (
            <Card key={index} className="trading-card">
              <CardHeader>
                <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ${SPACING.margin.heading}`}>
                  <item.icon className={`${SPACING.icon.lg} text-primary`} />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  {item.description}
                </p>
              </CardHeader>
              <CardContent>
                <p className={`text-sm text-muted-foreground ${SPACING.margin.heading}`}>
                  {item.details}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={localizePath("/education")}>
                    <Info className={`${SPACING.icon.xs} mr-2`} />
                    {t('overviewSection.learnMore')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}