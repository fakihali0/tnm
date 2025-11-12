import React, { useMemo, useState } from 'react';
import { Layout } from "@/components/layout/Layout";
import { FeatureErrorBoundary } from "@/components/error/FeatureErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createPartnerApplicationSchema, type PartnerApplicationFormData } from '@/lib/partner-validation';
import { useTranslation } from "react-i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { GlobalNetworkAnimation } from "@/components/partners/GlobalNetworkAnimation";
import { AnimatedStat } from "@/components/ui/animated-stat";
import { SPACING } from "@/styles/spacing";

import {
  Handshake, 
  Users, 
  TrendingUp, 
  Globe, 
  DollarSign, 
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  User,
  Building,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { openEmailClient, AUTH_URLS, redirectToAuth, scrollToSection } from "@/utils/auth-redirects";

function PartnersContent() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partnerApplicationSchema = useMemo(
    () => createPartnerApplicationSchema(t),
    [t, i18n.language],
  );

  const form = useForm<PartnerApplicationFormData>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      country: '',
      partnerType: undefined,
      experience: '',
      goals: '',
    },
  });

  const onSubmit = async (data: PartnerApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-partner-application', {
        body: data,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: t('partners.applicationForm.successTitle'),
        description: t('partners.applicationForm.success'),
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: t('partners.applicationForm.errorTitle'),
        description: t('partners.applicationForm.error'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const partnerTypes = [
    {
      title: t('partners.partnerTypes.affiliate.title'),
      description: t('partners.partnerTypes.affiliate.description'),
      commission: t('partners.partnerTypes.affiliate.commission'),
      benefits: t('partners.partnerTypes.affiliate.benefits', { returnObjects: true }) as string[],
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: t('partners.partnerTypes.ib.title'),
      description: t('partners.partnerTypes.ib.description'),
      commission: t('partners.partnerTypes.ib.commission'),
      benefits: t('partners.partnerTypes.ib.benefits', { returnObjects: true }) as string[],
      icon: Building,
      color: "bg-green-500"
    },
    {
      title: t('partners.partnerTypes.regional.title'),
      description: t('partners.partnerTypes.regional.description'),
      commission: t('partners.partnerTypes.regional.commission'),
      benefits: t('partners.partnerTypes.regional.benefits', { returnObjects: true }) as string[],
      icon: Globe,
      color: "bg-purple-500"
    }
  ];

  const benefits = [
    {
      title: t('partners.benefits.highCommission.title'),
      description: t('partners.benefits.highCommission.description'),
      icon: DollarSign
    },
    {
      title: t('partners.benefits.realTimeAnalytics.title'),
      description: t('partners.benefits.realTimeAnalytics.description'),
      icon: BarChart3
    },
    {
      title: t('partners.benefits.marketingSupport.title'),
      description: t('partners.benefits.marketingSupport.description'),
      icon: Target
    },
    {
      title: t('partners.benefits.fastPayments.title'),
      description: t('partners.benefits.fastPayments.description'),
      icon: Zap
    }
  ];

  const stats = [
    { label: t('partners.stats.activePartners'), target: 500, suffix: "+" },
    { label: t('partners.stats.countriesCovered'), target: 10, suffix: "+" },
    { label: t('partners.stats.monthlyPayouts'), target: 2, suffix: "M+", prefix: "$" },
    { label: t('partners.stats.averageCommission'), target: 35, suffix: "%" }
  ];


  const {
    motionProps: heroMotion,
    transition: heroTransition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.3, delay: 0.05 });
  const { motionProps: sectionsMotion, transition: sectionsTransition } = useSectionAnimation({ amount: 0.25, delay: 0.08 });

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
  const itemVariants = buildReveal(sectionsTransition, 28);
  const staggerContainer = buildStagger(sectionsTransition);

  return (
    <Layout>
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8"
        {...heroMotion}
        variants={heroVariants}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-center min-h-[600px]">
            {/* Content Section - Left */}
            <motion.div className="lg:col-span-3 space-y-8" variants={heroFade}>
              <div>
                <Badge variant="outline" className="mb-6 px-4 py-2 gap-2 bg-background/80 backdrop-blur-sm">
                  <Handshake className="h-4 w-4" />
                  {t('partners.badge.program')}
                </Badge>
              </div>
              
              <div className="space-y-6">
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-poppins gradient-text leading-tight" variants={heroFade}>
                  {t('partners.hero.title')}
                </motion.h1>
                <motion.p className="text-xl text-muted-foreground max-w-2xl" variants={heroFade}>
                  {t('partners.hero.subtitle')}
                </motion.p>
              </div>
              
              <motion.div className="flex flex-col sm:flex-row gap-4" variants={heroFade}>
                <Button 
                  size="lg" 
                  className="gradient-bg text-white shadow-primary hover:shadow-glow transition-shadow duration-300 gap-2"
                  onClick={() => scrollToSection('application-form', 'become-partner', 'partners-hero')}
                >
                  <Users className="h-5 w-5" />
                  {t('partners.hero.becomePartner')}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  onClick={() => redirectToAuth(AUTH_URLS.WHATSAPP, 'schedule-call', 'partners-hero')}
                >
                  <Phone className="h-5 w-5" />
                  {t('partners.hero.scheduleCall')}
                </Button>
              </motion.div>

              {/* Partner Stats */}
              <motion.div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50" variants={heroFade}>
                {stats.slice(0, 3).map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                      {stat.prefix}
                      <AnimatedStat 
                        target={stat.target} 
                        suffix={stat.suffix}
                        duration={1.6}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Earth Animation Section - Right */}
            <motion.div className="lg:col-span-2 relative flex items-center justify-center" variants={heroFade}>
              <div className="relative w-full h-[500px] lg:h-[600px]">
                <GlobalNetworkAnimation disabled={prefersReducedMotion} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Additional Stats Section */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" variants={staggerContainer}>
            {stats.map((stat, index) => (
              <motion.div key={index} className="text-center" variants={itemVariants}>
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.prefix}
                  <AnimatedStat 
                    target={stat.target} 
                    suffix={stat.suffix}
                    duration={1.8}
                  />
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Partner Types */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('partners.partnerTypes.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('partners.partnerTypes.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {partnerTypes.map((type, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card className="group hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-center mb-4 gap-4">
                      <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center`}>
                        <type.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {type.commission} {t('partners.partnerTypes.commissionLabel')}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {type.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center text-sm gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => scrollToSection('application-form', 'learn-more-partner', 'partner-types')}
                    >
                      {t('partners.partnerTypes.learnMore')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Benefits */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('partners.benefits.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('partners.benefits.subtitle')}
            </p>
          </div>
          
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" variants={staggerContainer}>
            {benefits.map((benefit, index) => (
              <motion.div key={index} className="text-center group" variants={itemVariants}>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Partner Dashboard Preview */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('partners.dashboard.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('partners.dashboard.subtitle')}
            </p>
          </div>
          
          <motion.div className="bg-background rounded-lg border p-8" variants={sectionFade}>
            <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{t('partners.dashboard.totalCommissions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      $<AnimatedStat target={12450} duration={1.8} />
                    </div>
                    <div className="text-sm text-muted-foreground">{t('partners.dashboard.fromLastMonth')}</div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{t('partners.dashboard.activeReferrals')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <AnimatedStat target={247} duration={2.0} />
                    </div>
                    <div className="text-sm text-muted-foreground">{t('partners.dashboard.newThisMonth')}</div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{t('partners.dashboard.conversionRate')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <AnimatedStat target={18.5} suffix="%" decimals={1} duration={1.6} />
                    </div>
                    <div className="text-sm text-muted-foreground">{t('partners.dashboard.aboveAverage')}</div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Application Form */}
      <motion.section
        id="application-form"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...sectionsMotion}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto" variants={sectionFade}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-poppins mb-4">{t('partners.applicationForm.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('partners.applicationForm.subtitle')}
            </p>
          </div>
          
          <motion.div variants={cardVariants}>
            <Card className="p-8">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.firstName')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('partners.applicationForm.firstNamePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.lastName')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('partners.applicationForm.lastNamePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder={t('partners.applicationForm.emailPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.phone')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('partners.applicationForm.phonePlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.company')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('partners.applicationForm.companyPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partners.applicationForm.country')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('partners.applicationForm.countryPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="partnerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partners.applicationForm.partnerType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('partners.applicationForm.partnerTypePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="affiliate">{t('partners.applicationForm.affiliateOption')}</SelectItem>
                          <SelectItem value="ib">{t('partners.applicationForm.ibOption')}</SelectItem>
                          <SelectItem value="regional">{t('partners.applicationForm.regionalOption')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partners.applicationForm.experience')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('partners.applicationForm.experiencePlaceholder')}
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partners.applicationForm.goals')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('partners.applicationForm.goalsPlaceholder')}
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full gradient-bg text-white shadow-primary hover:shadow-glow transition-shadow duration-300 gap-2"
                  disabled={isSubmitting}
                >
                  <Handshake className="h-5 w-5" />
                  {isSubmitting ? t('partners.applicationForm.submitting') : t('partners.applicationForm.submitApplication')}
                </Button>
              </form>
            </Form>
          </Card>
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
          <h2 className="text-3xl font-bold font-poppins mb-4">{t('partners.cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('partners.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-bg text-white shadow-primary hover:shadow-glow transition-shadow duration-300 gap-2"
              onClick={() => openEmailClient('admin@tradenmore.com', 'Partnership Inquiry', 'contact-partnership-team', 'partners-cta')}
            >
              <Mail className="h-5 w-5" />
              {t('partners.cta.contactTeam')}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => redirectToAuth(AUTH_URLS.WHATSAPP, 'schedule-call', 'partners-cta')}
            >
              <Phone className="h-5 w-5" />
              {t('partners.cta.scheduleCall')}
            </Button>
          </div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}

export default function Partners() {
  return (
    <FeatureErrorBoundary featureName="Partners">
      <PartnersContent />
    </FeatureErrorBoundary>
  );
}