import { useState } from "react";
import { motion, type Transition } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { getScrollBehavior } from "@/utils/scroll";
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { SPACING } from "@/styles/spacing";
import { 
  ArrowRight, 
  Check, 
  Shield,
  Zap, 
  Globe, 
  Clock,
  TrendingUp,
  DollarSign,
  Calculator,
  FileText,
  Copy,
  Download,
  HelpCircle,
  ChevronDown,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lock
} from "lucide-react";
import { QuickCostWidget } from "@/components/instruments/QuickCostWidget";
import { SocialProofBand } from "@/components/instruments/SocialProofBand";
import { TestimonialCard } from "@/components/instruments/TestimonialCard";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

const getAccountData = (t: any) => {
  const toArray = (v: any) => Array.isArray(v) ? v : (v != null ? [String(v)] : []);
  const zeroWho = t("accountTypes.accounts.zero.whoIsItFor", { returnObjects: true });
  const rawWho = t("accountTypes.accounts.raw.whoIsItFor", { returnObjects: true });
  return ({
    zero: {
      name: t("accountTypes.accounts.zero.name"),
      tagline: t("accountTypes.accounts.zero.tagline"),
      typicalSpread: t("accountTypes.accounts.zero.typicalSpread"),
      commission: t("accountTypes.accounts.zero.commission"),
      maxLeverage: t("accountTypes.accounts.zero.maxLeverage"),
      stopOut: t("accountTypes.accounts.zero.stopOut"),
      marginCall: t("accountTypes.accounts.zero.marginCall"),
      minLot: t("accountTypes.accounts.zero.minLot"),
      stepLot: t("accountTypes.accounts.zero.stepLot"),
      hedging: true,
      eas: true,
      scalping: false,
      whoIsItFor: toArray(zeroWho)
    },
    raw: {
      name: t("accountTypes.accounts.raw.name"),
      tagline: t("accountTypes.accounts.raw.tagline"),
      typicalSpread: t("accountTypes.accounts.raw.typicalSpread"),
      commission: t("accountTypes.accounts.raw.commission"),
      maxLeverage: t("accountTypes.accounts.raw.maxLeverage"),
      stopOut: t("accountTypes.accounts.raw.stopOut"),
      marginCall: t("accountTypes.accounts.raw.marginCall"),
      minLot: t("accountTypes.accounts.raw.minLot"),
      stepLot: t("accountTypes.accounts.raw.stepLot"),
      hedging: true,
      eas: true,
      scalping: false,
      whoIsItFor: toArray(rawWho)
    }
  });
};

const getComparisonData = (t: any) => [
  { feature: t("accountTypes.comparison.features.typicalSpread"), zero: t("accountTypes.accounts.zero.typicalSpread"), raw: t("accountTypes.accounts.raw.typicalSpread") },
  { feature: t("accountTypes.comparison.features.commissionPerLot"), zero: t("accountTypes.accounts.zero.commission"), raw: t("accountTypes.accounts.raw.commission") },
  { feature: t("accountTypes.comparison.features.maxLeverage"), zero: "1:200", raw: "1:200" },
  { feature: t("accountTypes.comparison.features.minStepLot"), zero: "0.01", raw: "0.01" },
  { feature: t("accountTypes.comparison.features.stopOutLevel"), zero: "0%", raw: "0%" },
  { feature: t("accountTypes.comparison.features.marginCallLevel"), zero: "30%", raw: "30%" },
  { feature: t("accountTypes.comparison.features.executionType"), zero: t("accountTypes.comparison.values.auto"), raw: t("accountTypes.comparison.values.auto") },
  { feature: t("accountTypes.comparison.features.hedging"), zero: "✓", raw: "✓" },
  { feature: t("accountTypes.comparison.features.expertAdvisors"), zero: "✓", raw: "✓" },
  { feature: t("accountTypes.comparison.features.baseCurrencies"), zero: t("accountTypes.comparison.values.usd"), raw: t("accountTypes.comparison.values.usd") },
  { feature: t("accountTypes.comparison.features.swapCharges"), zero: t("accountTypes.comparison.values.free"), raw: t("accountTypes.comparison.values.free") }
];



export default function AccountTypes() {
  const { t: tOrig, i18n } = useTranslation('common');
  const { localizePath } = useLocalizedPath();

  const {
    motionProps,
    transition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.35, delay: 0.05 });

  const buildReveal = (baseTransition: Transition, distance = 48) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "up", distance, transition: baseTransition }),
      prefersReducedMotion
    );
  const buildFade = (baseTransition: Transition) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "none", transition: baseTransition }),
      prefersReducedMotion
    );
  const buildStagger = (baseTransition: Transition, stagger = 0.12, offset = 0) =>
    createStaggerContainer({
      stagger,
      delayChildren: (baseTransition.delay ?? 0) + offset,
      enabled: !prefersReducedMotion
    });

  const heroVariants = buildReveal(transition, 72);
  const heroFade = buildFade(transition);
  const highlightsStagger = buildStagger(transition, 0.08, 0.05);
  const highlightItemVariants = buildReveal(transition, 28);
  const cardSectionVariants = buildReveal(transition, 56);
  const cardSectionFade = buildFade(transition);
  const cardGridStagger = buildStagger(transition, 0.16, 0.08);
  const cardReveal = buildReveal(transition, 36);
  const comparisonVariants = buildReveal(transition, 48);
  const comparisonFade = buildFade(transition);
  const faqVariants = buildReveal(transition, 44);
  const faqFade = buildFade(transition);
  const testimonialVariants = buildReveal(transition, 40);
  const testimonialFade = buildFade(transition);
  const testimonialStagger = buildStagger(transition, 0.12, 0.05);
  const testimonialCardVariants = buildReveal(transition, 32);
  const socialProofVariants = buildReveal(transition, 24);
  
  // Enhanced translation function with multi-namespace lookup and runtime validation
  const t = (key: string, opts?: any): any => {
    const translatedKey = key.startsWith('accountTypes.') ? `products.${key}` : key;
    const result = tOrig(translatedKey, { ns: ['common', 'translation'], ...opts });

    // Check if translation failed (returns key as-is)
    if (result === translatedKey && translatedKey.includes('products.accountTypes')) {
      // Human-friendly fallback from last key segment
      const keyParts = key.split('.');
      return keyParts[keyParts.length - 1].replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase());
    }

    return result;
  };
  
  const [selectedAccount, setSelectedAccount] = useState<'zero' | 'raw'>('zero');
  const [orderSize, setOrderSize] = useState(1.0);
  const [activeAccordion, setActiveAccordion] = useState<string>("");

  const accountData = getAccountData(t);
  const comparisonData = getComparisonData(t);
  
  // Safe FAQ data handling
  const faqDataRaw = t('accountTypes.faq.items', { returnObjects: true });
  const faqData = Array.isArray(faqDataRaw) ? faqDataRaw : [];

  const calculateCost = (accountType: 'zero' | 'raw', lots: number) => {
    if (accountType === 'zero') {
      return (lots * 12).toFixed(2);
    } else {
      return (lots * 1 + lots * 5.00).toFixed(2);
    }
  };

  const calculateBreakEven = () => {
    return {
      breakEvenPoint: 0,
      zeroCommissionCost: 12,
      rawCost: 6,
      savings: 6
    };
  };

  const getRecommendation = (lotsPerMonth: number) => {
    const monthlyZeroCost = lotsPerMonth * 12;
    const monthlyRawCost = lotsPerMonth * 6;
    const monthlySavings = monthlyZeroCost - monthlyRawCost;
    
    if (lotsPerMonth < 30) {
      return {
        recommended: 'zero' as const,
        reason: 'Zero Commission is perfect for your trading volume - simple, transparent pricing',
        monthlySavings: 0,
        confidence: 'high'
      };
    } else if (lotsPerMonth < 50) {
      return {
        recommended: 'zero' as const,
        reason: 'Zero Commission still recommended - simplicity often beats small cost differences',
        monthlySavings: 0,
        confidence: 'medium'
      };
    } else {
      return {
        recommended: 'raw' as const,
        reason: 'At your high trading volume, Raw account offers meaningful savings',
        monthlySavings,
        confidence: 'high'
      };
    }
  };

  const handleAnalyticsEvent = (eventName: string, data?: any) => {
    // Using existing analytics pattern
    trackButtonClick({ 
      buttonType: eventName, 
      buttonLocation: 'account-types',
      ...data 
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background relative overflow-hidden"
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        {...motionProps}
        variants={heroVariants}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <motion.div className="container relative" variants={heroFade}>
          <motion.div className="grid lg:grid-cols-2 gap-12 items-center" variants={heroFade}>
            <motion.div className="space-y-8" variants={heroFade}>
              <motion.div className="space-y-4" variants={heroFade}>
                <motion.h1 className="font-poppins text-4xl lg:text-5xl font-bold tracking-tight" variants={heroFade}>
                  {t("accountTypes.heroTitle")}
                </motion.h1>
                <motion.p className="text-xl text-muted-foreground leading-relaxed" variants={heroFade}>
                  {t("accountTypes.heroSubtitle")}
                </motion.p>
              </motion.div>

              {/* Quick Highlights */}
              <motion.div className="grid grid-cols-2 gap-4" variants={highlightsStagger}>
                <motion.div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border" variants={highlightItemVariants}>
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("accountTypes.highlights.transparentPricing.title")}</div>
                    <div className="text-xs text-muted-foreground">{t("accountTypes.highlights.transparentPricing.description")}</div>
                  </div>
                </motion.div>
                <motion.div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border" variants={highlightItemVariants}>
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("accountTypes.highlights.fastExecution.title")}</div>
                    <div className="text-xs text-muted-foreground">{t("accountTypes.highlights.fastExecution.description")}</div>
                  </div>
                </motion.div>
                <motion.div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border" variants={highlightItemVariants}>
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("accountTypes.highlights.localGlobalPayments.title")}</div>
                    <div className="text-xs text-muted-foreground">{t("accountTypes.highlights.localGlobalPayments.description")}</div>
                  </div>
                </motion.div>
                <motion.div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border" variants={highlightItemVariants}>
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t("accountTypes.highlights.markets247.title")}</div>
                    <div className="text-xs text-muted-foreground">{t("accountTypes.highlights.markets247.description")}</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* CTAs */}
              <motion.div className="flex flex-wrap gap-4" variants={heroFade}>
                <Button
                  size="lg"
                  className="gradient-bg text-white shadow-primary gap-2"
                  asChild
                >
                  <a
                    href={AUTH_URLS.REGISTRATION}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleAnalyticsEvent('acct_hero_cta_open')}
                  >
                    {t("accountTypes.buttons.openAccount")}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    handleAnalyticsEvent('acct_compare_view');
                    document.getElementById('compare')?.scrollIntoView({ behavior: getScrollBehavior() });
                  }}
                >
                  {t("accountTypes.buttons.compareSideBySide")}
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="gap-2"
                  asChild
                >
                  <Link to={localizePath("/products/trading-instruments")}>
                    {t("accountTypes.buttons.seeInstruments")}
                    <TrendingUp className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div className="relative" variants={heroFade}>
              <QuickCostWidget />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Social Proof */}
      <motion.section {...motionProps} variants={socialProofVariants}>
        <SocialProofBand />
      </motion.section>

      {/* Plan Cards */}
      <motion.section className="py-16" {...motionProps} variants={cardSectionVariants}>
        <motion.div className="container" variants={cardSectionFade}>
          <motion.div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto" variants={cardGridStagger}>
            {(['zero', 'raw'] as const).map((accountKey) => {
              const account = accountData[accountKey];
              return (
                <motion.div key={accountKey} variants={cardReveal}>
                  <Card
                    className="trading-card relative hover-scale transition-all duration-200 hover:shadow-xl hover:shadow-primary/10"
                  >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline" 
                      className={accountKey === 'zero' ? 'gradient-bg text-white' : ''}
                    >
                      {account.name}
                    </Badge>
                     {accountKey === 'zero' && (
                       <Badge variant="secondary" className="text-xs">
                         {t("accountTypes.accounts.zero.popular")}
                       </Badge>
                     )}
                  </div>
                  <div>
                    <CardTitle className="font-poppins text-2xl">{account.name}</CardTitle>
                    <CardDescription className="text-lg mt-2">{account.tagline}</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-3 rounded-lg bg-muted/30">
                       <div className="text-sm text-muted-foreground">{t("accountTypes.labels.typicalSpread")}</div>
                       <div className="font-bold text-lg">{account.typicalSpread}</div>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/30">
                       <div className="text-sm text-muted-foreground">{t("accountTypes.labels.commission")}</div>
                       <div className="font-bold text-lg">{account.commission}</div>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/30">
                       <div className="text-sm text-muted-foreground">{t("accountTypes.labels.maxLeverage")}</div>
                       <div className="font-bold text-lg">{account.maxLeverage}</div>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/30">
                       <div className="text-sm text-muted-foreground">{t("accountTypes.labels.minLot")}</div>
                       <div className="font-bold text-lg">{account.minLot}</div>
                     </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                       <span>{t("accountTypes.labels.hedging")} {account.hedging ? '✓' : '—'}</span>
                       <span className="text-muted-foreground">|</span>
                       <span>{t("accountTypes.labels.eas")} {account.eas ? '✓' : '—'}</span>
                    </div>
                  </div>

                  {/* Who is it for */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">{t("accountTypes.labels.whoIsItFor")}</h4>
                    <ul className="space-y-2">
                      {(Array.isArray(account.whoIsItFor) ? account.whoIsItFor : []).map((point, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      className={`flex-1 gap-2 ${accountKey === 'zero' ? 'gradient-bg text-white shadow-primary' : ''}`}
                      variant={accountKey === 'zero' ? 'default' : 'outline'}
                      asChild
                    >
                      <a 
                        href={AUTH_URLS.REGISTRATION} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => handleAnalyticsEvent('acct_card_open', { accountType: accountKey })}
                      >
                         {t("accountTypes.labels.openAccount")}
                         <ArrowRight className="h-4 w-4" />
                       </a>
                    </Button>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleAnalyticsEvent('acct_specs_drawer_open', { accountType: accountKey })}
                        >
                          <FileText className="h-4 w-4" />
                          {t("accountTypes.buttons.fullSpecs")}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl">
                         <SheetHeader>
                          <SheetTitle>{t("accountTypes.modal.accountDetails")}</SheetTitle>
                          <SheetDescription>
                            {t("accountTypes.modal.completeSpecifications")}
                          </SheetDescription>
                        </SheetHeader>
                        
                        <Tabs defaultValue="pricing" className="mt-6">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="pricing">{t("accountTypes.modal.tabs.pricing")}</TabsTrigger>
                            <TabsTrigger value="conditions">{t("accountTypes.modal.tabs.conditions")}</TabsTrigger>
                            <TabsTrigger value="instruments">{t("accountTypes.modal.tabs.instruments")}</TabsTrigger>
                            <TabsTrigger value="platform">{t("accountTypes.modal.tabs.platform")}</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="pricing" className="space-y-4 mt-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg border">
                                  <div className="text-sm text-muted-foreground">{t("accountTypes.modal.specs.typicalSpread")}</div>
                                  <div className="font-bold text-lg">{account.typicalSpread}</div>
                                </div>
                                <div className="p-4 rounded-lg border">
                                  <div className="text-sm text-muted-foreground">{t("accountTypes.modal.specs.commission")}</div>
                                  <div className="font-bold text-lg">{account.commission}</div>
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-muted/30">
                                <h4 className="font-medium mb-2">{t("accountTypes.modal.pricingModel.title")}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {accountKey === 'zero' 
                                    ? t("accountTypes.modal.pricingModel.zero")
                                    : t("accountTypes.modal.pricingModel.raw")
                                  }
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="conditions" className="space-y-4 mt-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg border">
                                  <div className="text-muted-foreground">{t("accountTypes.modal.conditions.maxLeverage")}</div>
                                  <div className="font-medium">{account.maxLeverage}</div>
                                </div>
                                <div className="p-3 rounded-lg border">
                                  <div className="text-muted-foreground">{t("accountTypes.modal.conditions.minStepLot")}</div>
                                  <div className="font-medium">{account.minLot}</div>
                                </div>
                                <div className="p-3 rounded-lg border">
                                  <div className="text-muted-foreground">{t("accountTypes.modal.conditions.stopOutLevel")}</div>
                                  <div className="font-medium">{account.stopOut}</div>
                                </div>
                                <div className="p-3 rounded-lg border">
                                  <div className="text-muted-foreground">{t("accountTypes.modal.conditions.marginCall")}</div>
                                  <div className="font-medium">{account.marginCall}</div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="instruments" className="space-y-4 mt-6">
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                {t("accountTypes.modal.instruments.description")}
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={localizePath("/products/trading-instruments")}>
                                  {t("accountTypes.modal.instruments.viewAll")}
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="platform" className="space-y-4 mt-6">
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                {t("accountTypes.modal.platform.description")}
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={localizePath("/products/platforms")}>
                                  {t("accountTypes.modal.platform.details")}
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.section>


      {/* Comparison Table */}
      <motion.section id="compare" className="py-16" {...motionProps} variants={comparisonVariants}>
        <motion.div className="container" variants={comparisonFade}>
          <motion.div className="text-center mb-12" variants={comparisonFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={comparisonFade}>
              {t("accountTypes.comparison.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={comparisonFade}>
              {t("accountTypes.comparison.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-4xl mx-auto" variants={comparisonFade}>
            <motion.div variants={comparisonFade}>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-1/3 font-semibold">{t("accountTypes.comparison.tableHeaders.feature")}</TableHead>
                        <TableHead className="text-center font-semibold">
                          {t("accountTypes.comparison.tableHeaders.zeroCommission")}
                          <Badge variant="secondary" className="ml-2 text-xs dark:bg-gradient-to-r dark:from-primary dark:to-primary/80 dark:text-white">
                            {t("accountTypes.accounts.zero.popular")}
                          </Badge>
                        </TableHead>
                        <TableHead className="text-center font-semibold">{t("accountTypes.comparison.tableHeaders.raw")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className={`font-medium whitespace-normal break-words ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {typeof row.feature === 'string' && row.feature.length > 0 ? row.feature : 'Feature'}
                          </TableCell>
                          <TableCell className="text-center font-medium">{row.zero}</TableCell>
                          <TableCell className="text-center font-medium">{row.raw}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                  <div className="p-6 border-t bg-muted/30">
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Copy className="h-4 w-4" />
                        {t("accountTypes.comparison.actions.copyComparison")}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        {t("accountTypes.comparison.actions.downloadPdf")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FAQs */}
      <motion.section className="py-16 bg-muted/20" {...motionProps} variants={faqVariants}>
        <motion.div className="container" variants={faqFade}>
          <motion.div className="text-center mb-12" variants={faqFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={faqFade}>
              {t("accountTypes.faq.title")}
            </motion.h2>
            <motion.p className="text-lg text-muted-foreground max-w-2xl mx-auto" variants={faqFade}>
              {t("accountTypes.faq.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className="max-w-3xl mx-auto" variants={faqFade}>
            <Accordion type="single" collapsible value={activeAccordion} onValueChange={setActiveAccordion}>
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger
                    className="text-left hover:no-underline"
                    onClick={() => handleAnalyticsEvent('faq_toggle', { question: faq.question })}
                  >
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Client Testimonials */}
      <motion.section className="py-16 bg-muted/30" {...motionProps} variants={testimonialVariants}>
        <motion.div className="container" variants={testimonialFade}>
          <motion.div className="text-center mb-12" variants={testimonialFade}>
            <motion.h2 className="font-poppins text-3xl font-bold mb-4" variants={testimonialFade}>
              {t("accountTypes.testimonials.title")}
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto" variants={testimonialFade}>
              {t("accountTypes.testimonials.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 md:px-0" variants={testimonialStagger}>
            <motion.div variants={testimonialCardVariants}>
              <TestimonialCard
                quote={t("accountTypes.testimonials.items.sarah.quote")}
                author={t("accountTypes.testimonials.items.sarah.name")}
                role={t("accountTypes.testimonials.items.sarah.title")}
                rating={5}
              />
            </motion.div>
            <motion.div variants={testimonialCardVariants}>
              <TestimonialCard
                quote={t("accountTypes.testimonials.items.mike.quote")}
                author={t("accountTypes.testimonials.items.mike.name")}
                role={t("accountTypes.testimonials.items.mike.title")}
                rating={5}
              />
            </motion.div>
            <motion.div variants={testimonialCardVariants}>
              <TestimonialCard
                quote={t("accountTypes.testimonials.items.anna.quote")}
                author={t("accountTypes.testimonials.items.anna.name")}
                role={t("accountTypes.testimonials.items.anna.title")}
                rating={5}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

    </Layout>
  );
}