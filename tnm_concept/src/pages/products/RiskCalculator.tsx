import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { loadTranslationNamespaces } from "@/i18n/dynamic-loader";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TradingCalculator } from "@/components/instruments/TradingCalculator";
import { RiskEducationSection } from "@/components/risk-calculator/RiskEducationSection";
import { HowToUseGuide } from "@/components/risk-calculator/HowToUseGuide";
import { UseCasesShowcase } from "@/components/risk-calculator/UseCasesShowcase";
import { Calculator, Shield, TrendingUp, Percent, ArrowRight, CheckCircle2, Users, Zap, Lock } from "lucide-react";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { SPACING } from "@/styles/spacing";

export default function RiskCalculator() {
  const { t, i18n, ready } = useTranslation(['risk-calculator', 'common']);

  // Verify and reload translations if missing
  useEffect(() => {
    const verifyTranslations = async () => {
      const hasRiskCalc = i18n.hasResourceBundle(i18n.language, 'risk-calculator');
      const hasCommon = i18n.hasResourceBundle(i18n.language, 'common');
      
      if (!hasRiskCalc || !hasCommon) {
        await loadTranslationNamespaces(['risk-calculator', 'common'], i18n.language);
      }
    };
    verifyTranslations();
  }, [i18n.language, i18n]);

  // Show loading state while translations are loading
  if (!ready) {
    return (
      <Layout title="Loading..." description="">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse text-muted-foreground">
              Loading translations...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const features = [
    {
      icon: TrendingUp,
      title: t('features.rrCalculation'),
      description: t('features.rrCalculationDesc')
    },
    {
      icon: Shield,
      title: t('features.multiAsset'),
      description: t('features.multiAssetDesc')
    },
    {
      icon: Calculator,
      title: t('features.realTimePip'),
      description: t('features.realTimePipDesc')
    },
    {
      icon: Percent,
      title: t('features.marginCalc'),
      description: t('features.marginCalcDesc')
    }
  ];

  return (
    <Layout
      title={t('seo.title')}
      description={t('seo.description')}
      keywords={t('seo.keywords')}
    >
      <SEOHead
        title={t('seo.title')}
        description={t('seo.description')}
        keywords={t('seo.keywords')}
      />
      <StructuredData
        type="website"
        title={t('seo.title')}
        description={t('seo.description')}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className={`container ${SPACING.section.px} ${SPACING.section.py} md:${SPACING.section.pyLarge}`}>
            <div className={`max-w-4xl mx-auto text-center ${SPACING.gap.section}`}>
              <div className="animate-fade-in">
                <Badge variant="secondary" className={SPACING.margin.heading}>
                  <Calculator className={`${SPACING.icon.xs} mr-2`} />
                  {t('hero.badge')}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text animate-fade-in">
                {t('hero.title')}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
                {t('hero.subtitle')}
              </p>

              <div className={`flex flex-wrap justify-center ${SPACING.gap.medium} animate-fade-in`}>
                <Badge variant="outline" className="text-sm py-2 px-4">
                  <Users className={`${SPACING.icon.sm} mr-2`} />
                  {t('hero.badges.users')}
                </Badge>
                <Badge variant="outline" className="text-sm py-2 px-4">
                  <Zap className={`${SPACING.icon.sm} mr-2`} />
                  {t('hero.badges.realtime')}
                </Badge>
                <Badge variant="outline" className="text-sm py-2 px-4">
                  <Lock className={`${SPACING.icon.sm} mr-2`} />
                  {t('hero.badges.free')}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Benefits Bar */}
        <section className="border-y bg-muted/30">
          <div className={`container ${SPACING.section.pySmall}`}>
            <div className={`grid grid-cols-1 md:grid-cols-3 ${SPACING.gap.medium} text-center`}>
              <div className={SPACING.stack.tight}>
                <p className="text-sm font-medium text-muted-foreground">{t('benefits.multiAsset')}</p>
              </div>
              <div className={SPACING.stack.tight}>
                <p className="text-sm font-medium text-muted-foreground">{t('benefits.dualMode')}</p>
              </div>
              <div className={SPACING.stack.tight}>
                <p className="text-sm font-medium text-muted-foreground">{t('benefits.aiPowered')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Calculator Section */}
        <section className={`container ${SPACING.section.py}`}>
          <div className="max-w-6xl mx-auto">
            <TradingCalculator />
            
            {/* Quick Features Bar */}
            <div className={`mt-8 flex flex-wrap ${SPACING.gap.small} justify-center`}>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2 className={`${SPACING.icon.xs} mr-2`} />
                {t('sidebar.feature1')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2 className={`${SPACING.icon.xs} mr-2`} />
                {t('sidebar.feature2')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2 className={`${SPACING.icon.xs} mr-2`} />
                {t('sidebar.feature3')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2 className={`${SPACING.icon.xs} mr-2`} />
                {t('sidebar.feature4')}
              </Badge>
            </div>
          </div>
        </section>

        {/* Educational Grid */}
        <RiskEducationSection />

        {/* How to Use Guide */}
        <HowToUseGuide />

        {/* Advanced Features Section */}
        <section className={`bg-muted/50 ${SPACING.section.py}`}>
          <div className="container">
            <div className={`text-center ${SPACING.margin.headingHuge}`}>
              <Badge variant="secondary" className={SPACING.margin.heading}>
                {t('advancedFeatures.badge')}
              </Badge>
              <h2 className={`text-3xl md:text-4xl font-bold ${SPACING.margin.headingLarge}`}>
                {t('advancedFeatures.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('advancedFeatures.subtitle')}
              </p>
            </div>

            <div className={`grid md:grid-cols-2 lg:grid-cols-4 ${SPACING.gap.large}`}>
              {features.map((feature, index) => (
                <Card key={index} className="hover-scale">
                  <CardContent className={`${SPACING.padding.card} ${SPACING.stack.normal}`}>
                    <div className={`${SPACING.icon.huge} rounded-lg gradient-bg flex items-center justify-center`}>
                      <feature.icon className={`${SPACING.icon.lg} text-white`} />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Showcase */}
        <UseCasesShowcase />

        {/* FAQ Section */}
        <section className={`container ${SPACING.section.py}`}>
          <div className="max-w-3xl mx-auto">
            <div className={`text-center ${SPACING.margin.headingHuge}`}>
              <Badge variant="secondary" className={SPACING.margin.heading}>
                {t('faq.badge')}
              </Badge>
              <h2 className={`text-3xl md:text-4xl font-bold ${SPACING.margin.headingLarge}`}>
                {t('faq.title')}
              </h2>
            </div>

            <Accordion type="single" collapsible className={SPACING.stack.comfortable}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {t(`faq.items.${index}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(`faq.items.${index}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`bg-gradient-to-br from-primary/10 via-background to-accent/10 ${SPACING.section.py}`}>
          <div className="container">
            <Card className="max-w-4xl mx-auto">
              <CardContent className={`p-8 md:p-12 text-center ${SPACING.stack.relaxed}`}>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('cta.title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('cta.subtitle')}
                </p>
                <div className={`flex flex-col sm:flex-row ${SPACING.gap.medium} justify-center`}>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={AUTH_URLS.DEMO}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackButtonClick({ buttonType: 'demo', buttonLocation: 'risk-calculator-cta' })}
                      className={SPACING.gap.iconButton}
                    >
                      {t('cta.demo')}
                      <ArrowRight className={SPACING.icon.sm} />
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    className="gradient-bg text-white shadow-primary"
                    asChild
                  >
                    <a
                      href={AUTH_URLS.REGISTRATION}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackButtonClick({ buttonType: 'get-started', buttonLocation: 'risk-calculator-cta' })}
                      className={SPACING.gap.iconButton}
                    >
                      {t('cta.live')}
                      <ArrowRight className={SPACING.icon.sm} />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
