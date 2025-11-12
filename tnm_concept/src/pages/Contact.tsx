import { Layout } from "@/components/layout/Layout";
import { FeatureErrorBoundary } from "@/components/error/FeatureErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SPACING } from "@/styles/spacing";

import {
  Mail,
  Clock,
  MessageSquare,
  Headphones,
  Users,
  HelpCircle,
  Send,
  LifeBuoy,
  CalendarClock,
  Video
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AUTH_URLS, SUPPORT_LINKS, redirectToAuth, scrollToSection, openEmailClient } from "@/utils/auth-redirects";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { canonicalizeHash } from "@/utils/hash";
import type { TFunction } from "i18next";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

const createContactFormSchema = (t: TFunction) =>
  z.object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: t("contactForm.validation.firstNameRequired") })
      .max(50, { message: t("contactForm.validation.firstNameTooLong") }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: t("contactForm.validation.lastNameRequired") })
      .max(50, { message: t("contactForm.validation.lastNameTooLong") }),
    email: z
      .string()
      .trim()
      .email({ message: t("contactForm.validation.emailInvalid") })
      .max(255, { message: t("contactForm.validation.emailTooLong") }),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((phone) => !phone || phone.length >= 10, {
        message: t("contactForm.validation.phoneInvalid")
      })
      .refine((phone) => !phone || phone.length <= 20, {
        message: t("contactForm.validation.phoneTooLong")
      }),
    subject: z
      .string()
      .trim()
      .min(1, { message: t("contactForm.validation.subjectRequired") })
      .max(200, { message: t("contactForm.validation.subjectTooLong") }),
    message: z
      .string()
      .trim()
      .min(10, { message: t("contactForm.validation.messageMin") })
      .max(5000, { message: t("contactForm.validation.messageMax") }),
  });

type ContactFormSchema = ReturnType<typeof createContactFormSchema>;
type ContactFormData = z.infer<ContactFormSchema>;

type SuccessJourneyAction =
  | {
      type: 'scroll';
      targetId: string;
      analyticsId: string;
    }
  | {
      type: 'redirect';
      url: string;
      analyticsId: string;
    };

interface SuccessJourneyStage {
  value: string;
  icon: LucideIcon;
  tabLabel: string;
  title: string;
  description: string;
  badge: string;
  cta: string;
  action: SuccessJourneyAction;
}

const stripDiacritics = (value: string) => value.replace(/[\u0300-\u036f]/g, '');

const generateFaqSlug = (question: string, index: number) => {
  const normalizedQuestion = question.normalize('NFKD');
  const strippedQuestion = stripDiacritics(normalizedQuestion);
  const baseSlug = strippedQuestion
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const safeSlug = baseSlug || `item-${index + 1}`;
  return `faq-${safeSlug}`;
};

const legacyFaqSlug = (question: string) => {
  return `faq-${question.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
};

function ContactContent() {
  const { t, i18n } = useTranslation('contact');
  const { toast } = useToast();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const {
    motionProps,
    transition,
    prefersReducedMotion
  } = useSectionAnimation({ amount: 0.3, delay: 0.05 });

  const buildReveal = (sectionTransition: Transition, distance = 48) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "up", distance, transition: sectionTransition }),
      prefersReducedMotion
    );
  const buildFade = (sectionTransition: Transition) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "none", transition: sectionTransition }),
      prefersReducedMotion
    );
  const buildStagger = (sectionTransition: Transition, stagger = 0.08) =>
    createStaggerContainer({
      stagger,
      delayChildren: sectionTransition.delay ?? 0,
      enabled: !prefersReducedMotion
    });

  const heroVariants = buildReveal(transition, 64);
  const heroFade = buildFade(transition);
  const sectionVariants = buildReveal(transition, 56);
  const sectionFade = buildFade(transition);
  const cardVariants = buildReveal(transition, 32);
  const staggerContainer = buildStagger(transition);

  type HeroBackgroundElement =
    | {
        id: string;
        type: "icon";
        Icon: LucideIcon;
        wrapperClassName: string;
        iconClassName?: string;
        delay?: number;
        amplitude?: number;
        opacity?: number;
      }
    | {
        id: string;
        type: "shape";
        wrapperClassName: string;
        delay?: number;
        amplitude?: number;
        opacity?: number;
      };

  const heroBackgroundElements = useMemo<HeroBackgroundElement[]>(
    () => [
      {
        id: "message",
        type: "icon",
        Icon: MessageSquare,
        wrapperClassName:
          "absolute top-[8%] left-[6%] md:left-[12%] flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary/80 backdrop-blur-sm dark:bg-primary/15 dark:text-primary/60",
        iconClassName: "h-8 w-8",
        delay: 0.2,
        amplitude: 12,
        opacity: 0.45
      },
      {
        id: "send",
        type: "icon",
        Icon: Send,
        wrapperClassName:
          "absolute top-[26%] right-[14%] flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent/70 backdrop-blur-sm dark:bg-accent/20 dark:text-accent/60",
        iconClassName: "h-10 w-10",
        delay: 0.4,
        amplitude: 18,
        opacity: 0.5
      },
      {
        id: "mail",
        type: "icon",
        Icon: Mail,
        wrapperClassName:
          "absolute bottom-[18%] left-[18%] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-primary/5 text-primary/70 backdrop-blur-sm dark:bg-primary/20 dark:text-primary/50",
        iconClassName: "h-9 w-9",
        delay: 0.8,
        amplitude: 14,
        opacity: 0.4
      },
      {
        id: "glow-1",
        type: "shape",
        wrapperClassName:
          "absolute left-1/2 top-[18%] h-48 w-48 -translate-x-1/2 hero-bubble",
        delay: 0.3,
        amplitude: 10,
        opacity: 0.35
      },
      {
        id: "glow-2",
        type: "shape",
        wrapperClassName:
          "absolute bottom-[12%] right-[18%] h-40 w-40 hero-bubble",
        delay: 0.6,
        amplitude: 12,
        opacity: 0.3
      }
    ],
    []
  );

  const getFloatingAnimation = (delay: number, amplitude: number, targetOpacity: number) => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: targetOpacity },
        transition: { delay, duration: 0.8, ease: "easeOut" }
      };
    }

    return {
      initial: { opacity: 0, y: 0 },
      animate: {
        opacity: [0, targetOpacity, targetOpacity * 0.7],
        y: [-amplitude, amplitude, -amplitude]
      },
      transition: {
        delay,
        duration: 16,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut"
      }
    };
  };

  const contactFormSchema = useMemo(() => createContactFormSchema(t), [t]);

  // State for FAQ accordion deep linking
  const [openFaqItem, setOpenFaqItem] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('send-contact-email', {
        body: data
      });

      if (error) {
        throw error;
      }

      toast({
        title: t('contactForm.toast.success.title'),
        description: t('contactForm.toast.success.description'),
      });

      // Reset form after successful submission
      form.reset();
      
    } catch (error: any) {
      toast({
        title: t('contactForm.toast.error.title'),
        description: error?.message || t('contactForm.toast.error.description'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const contactMethods = [
    {
      id: 'general',
      title: t('contactMethods.generalSupport.title'),
      description: t('contactMethods.generalSupport.description'),
      icon: Headphones,
      email: "support@tradenmore.com",
      hours: t('contactMethods.hours')
    },
    {
      id: 'partnership',
      title: t('contactMethods.partnershipInquiries.title'),
      description: t('contactMethods.partnershipInquiries.description'),
      icon: Users,
      email: "partners@tradenmore.com",
      hours: t('contactMethods.hours')
    },
    {
      id: 'technical',
      title: t('contactMethods.technicalSupport.title'),
      description: t('contactMethods.technicalSupport.description'),
      icon: HelpCircle,
      email: "tech@tradenmore.com",
      hours: t('contactMethods.hours')
    }
  ];

  const SUCCESS_JOURNEY_LOCATION = 'client-success-journey';

  const successJourneyStages = useMemo<SuccessJourneyStage[]>(
    () => [
      {
        value: 'discover',
        icon: LifeBuoy,
        tabLabel: t('successJourney.stages.discover.tab'),
        title: t('successJourney.stages.discover.title'),
        description: t('successJourney.stages.discover.description'),
        badge: t('successJourney.stages.discover.badge'),
        cta: t('successJourney.stages.discover.cta'),
        action: {
          type: 'scroll',
          targetId: 'faq-section',
          analyticsId: 'success-journey-discover'
        }
      },
      {
        value: 'align',
        icon: CalendarClock,
        tabLabel: t('successJourney.stages.align.tab'),
        title: t('successJourney.stages.align.title'),
        description: t('successJourney.stages.align.description'),
        badge: t('successJourney.stages.align.badge'),
        cta: t('successJourney.stages.align.cta'),
        action: {
          type: 'redirect',
          url: SUPPORT_LINKS.CONSULTATION,
          analyticsId: 'success-journey-align'
        }
      },
      {
        value: 'activate',
        icon: Video,
        tabLabel: t('successJourney.stages.activate.tab'),
        title: t('successJourney.stages.activate.title'),
        description: t('successJourney.stages.activate.description'),
        badge: t('successJourney.stages.activate.badge'),
        cta: t('successJourney.stages.activate.cta'),
        action: {
          type: 'redirect',
          url: SUPPORT_LINKS.LIVE_WEBINAR,
          analyticsId: 'success-journey-activate'
        }
      },
      {
        value: 'optimize',
        icon: MessageSquare,
        tabLabel: t('successJourney.stages.optimize.tab'),
        title: t('successJourney.stages.optimize.title'),
        description: t('successJourney.stages.optimize.description'),
        badge: t('successJourney.stages.optimize.badge'),
        cta: t('successJourney.stages.optimize.cta'),
        action: {
          type: 'scroll',
          targetId: 'contact-form',
          analyticsId: 'success-journey-optimize'
        }
      }
    ],
    [t]
  );

  const [activeJourneyTab, setActiveJourneyTab] = useState<string>(successJourneyStages[0]?.value ?? 'discover');

  useEffect(() => {
    if (!successJourneyStages.some((s) => s.value === activeJourneyTab)) {
      setActiveJourneyTab(successJourneyStages[0]?.value ?? 'discover');
    }
  }, [successJourneyStages]);

  const handleJourneyAction = (stage: SuccessJourneyStage) => {
    if (stage.action.type === 'scroll') {
      scrollToSection(stage.action.targetId, stage.action.analyticsId, SUCCESS_JOURNEY_LOCATION);
      return;
    }

    redirectToAuth(stage.action.url, stage.action.analyticsId, SUCCESS_JOURNEY_LOCATION);
  };

  const faqsRaw = t('faq.questions', { returnObjects: true });
  const faqs = useMemo(
    () =>
      Array.isArray(faqsRaw)
        ? (faqsRaw as Array<{ question: string; answer: string }>)
        : [],
    [faqsRaw]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawHash = window.location.hash.slice(1);
    if (!rawHash) {
      return;
    }

    // Build candidate forms of the hash (encoded, raw, and decoded)
    const candidates = new Set<string>([canonicalizeHash(rawHash)]);
    candidates.add(rawHash);
    try {
      const decoded = decodeURIComponent(rawHash);
      if (decoded) candidates.add(decoded);
    } catch {
      // ignore decoding errors
    }

    // Only proceed for faq hashes
    const anyCandidateStartsWithFaq = Array.from(candidates).some((h) => h.startsWith('faq-'));
    if (!anyCandidateStartsWithFaq) {
      return;
    }

    for (let index = 0; index < faqs.length; index += 1) {
      const slugId = generateFaqSlug(faqs[index].question, index);
      const legacySlugId = legacyFaqSlug(faqs[index].question);

      if (candidates.has(slugId) || candidates.has(legacySlugId)) {
        setOpenFaqItem(slugId);

        // Normalize the URL to the slug form if needed
        const normalizedHash = `#${slugId}`;
        if (window.location.hash !== normalizedHash) {
          const baseUrl = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState(null, '', `${baseUrl}${normalizedHash}`);
        }
        return;
      }
    }

    // If no match, don't force an invalid value
    setOpenFaqItem('');
  }, [faqs]);

  const handleFaqItemChange = (value: string) => {
    setOpenFaqItem(value);

    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.pathname}${window.location.search}`;
      const url = value ? `${baseUrl}#${value}` : baseUrl;
      window.history.replaceState(null, '', url);
    }
  };

  // JSON-LD structured data for FAQ
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Layout>
      <script dangerouslySetInnerHTML={{
        __html: `if(window.addStructuredData){window.addStructuredData(${JSON.stringify(faqStructuredData)});}`
      }} />
      {/* Hero Section */}
      <motion.section
        className="relative z-0 overflow-hidden min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5"
        dir={direction}
        {...motionProps}
        variants={heroVariants}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: prefersReducedMotion ? 0.4 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {heroBackgroundElements.map((element, index) => {
            const animationProps = getFloatingAnimation(
              element.delay ?? index * 2,
              element.amplitude ?? 12,
              element.opacity ?? 0.4
            );

            return (
              <motion.div
                key={element.id}
                aria-hidden="true"
                className={`pointer-events-none select-none ${element.wrapperClassName}`}
                {...animationProps}
              >
                {element.type === "icon" ? (
                  <element.Icon
                    className={`${element.iconClassName ?? "h-8 w-8"}`}
                    strokeWidth={1.5}
                  />
                ) : null}
              </motion.div>
            );
          })}
        </motion.div>
        <motion.div className="container relative z-10 py-8 md:py-12 lg:py-16" variants={heroFade}>
          <motion.div className="max-w-4xl mx-auto text-center" variants={staggerContainer}>
            <motion.div className="mb-8" variants={heroFade}>
              <Badge variant="outline" className="mb-4 px-4 py-2 gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('badge')}
              </Badge>
            </motion.div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-poppins mb-6 gradient-text leading-tight" variants={heroFade}>
              {t('hero.title')}
            </motion.h1>
            <motion.p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed" variants={heroFade}>
              {t('hero.subtitle')}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={heroFade}>
              <Button
                size="lg"
                className="gradient-bg text-white shadow-primary gap-2"
                onClick={() => redirectToAuth(AUTH_URLS.WHATSAPP, 'start-live-chat', 'contact-hero')}
              >
                <MessageSquare className="h-5 w-5" />
                {t('hero.startLiveChat')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Methods */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...motionProps}
        variants={sectionVariants}
      >
        <motion.div className="max-w-7xl mx-auto" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={staggerContainer}>
            <motion.h2 className="text-3xl font-bold font-poppins mb-4" variants={heroFade}>
              {t('contactMethods.title')}
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto" variants={heroFade}>
              {t('contactMethods.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {contactMethods.map((method) => (
              <motion.div key={method.id} variants={cardVariants}>
                <Card className="border">
                  <CardHeader>
                    <div className="flex items-center mb-4 gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <method.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${method.email}`} className="text-foreground" dir="ltr" style={{ textAlign: 'left' }}>
                          {method.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{method.hours}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => openEmailClient(
                        method.email,
                        t(`contactMethods.subjects.${method.id}`),
                        `contact-${method.id}`,
                        'contact-methods'
                      )}
                    >
                      {t('contactMethods.contactButton')} {method.title.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Form */}
      <motion.section
        id="contact-form"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30 scroll-mt-24"
        {...motionProps}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={staggerContainer}>
            <motion.h2 className="text-3xl font-bold font-poppins mb-4" variants={heroFade}>
              {t('contactForm.title')}
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto" variants={heroFade}>
              {t('contactForm.subtitle')}
            </motion.p>
          </motion.div>

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
                          <FormLabel>{t('contactForm.firstName')} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t('contactForm.firstNamePlaceholder')} {...field} />
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
                          <FormLabel>{t('contactForm.lastName')} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t('contactForm.lastNamePlaceholder')} {...field} />
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
                          <FormLabel>{t('contactForm.email')} *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t('contactForm.emailPlaceholder')} {...field} />
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
                        <FormLabel>{t('contactForm.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('contactForm.phonePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contactForm.subject')} *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('contactForm.subjectPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">{t('contactForm.subjects.general')}</SelectItem>
                          <SelectItem value="technical">{t('contactForm.subjects.technical')}</SelectItem>
                          <SelectItem value="partnership">{t('contactForm.subjects.partnership')}</SelectItem>
                          <SelectItem value="funding">{t('contactForm.subjects.funding')}</SelectItem>
                          <SelectItem value="education">{t('contactForm.subjects.education')}</SelectItem>
                          <SelectItem value="other">{t('contactForm.subjects.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contactForm.message')} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('contactForm.messagePlaceholder')}
                          rows={6}
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
                  className="w-full gradient-bg text-white shadow-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('contactForm.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {t('contactForm.sendMessage')}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </Card>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Client Success Journey */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        dir={direction}
        {...motionProps}
        variants={sectionVariants}
      >
        <motion.div className="max-w-6xl mx-auto" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={staggerContainer}>
            <motion.h2 className="text-3xl font-bold font-poppins mb-4" variants={heroFade}>
              {t('successJourney.title')}
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto" variants={heroFade}>
              {t('successJourney.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Tabs value={activeJourneyTab} onValueChange={setActiveJourneyTab} className="w-full">
              <TabsList className="flex h-auto w-full flex-wrap justify-center gap-3 rounded-xl bg-muted/80 p-3 rtl:flex-row-reverse">
                {successJourneyStages.map((stage, index) => (
                  <TabsTrigger
                    key={stage.value}
                    value={stage.value}
                    className="group flex min-w-[160px] flex-1 flex-col items-center gap-2 rounded-lg border border-transparent bg-transparent px-4 py-3 text-sm font-semibold transition-all data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary sm:min-w-[180px]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors group-data-[state=active]:text-primary">
                      {stage.tabLabel}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {successJourneyStages.map((stage, index) => (
                <TabsContent key={stage.value} value={stage.value} className="mt-8 focus-visible:outline-none ltr:text-left rtl:text-right">
                  <motion.div variants={cardVariants} initial={false}>
                    <Card className="relative overflow-hidden">
                      <CardHeader className="space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-4 rtl:flex-row-reverse">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <stage.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-3 ltr:text-left rtl:text-right">
                              <Badge variant="secondary" className="w-fit text-xs uppercase tracking-wide">
                                {stage.badge}
                              </Badge>
                              <CardTitle className="text-2xl font-semibold">
                                {stage.title}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground rtl:flex-row-reverse rtl:text-right">
                            <Clock className="h-4 w-4" />
                            <span>
                              {t('successJourney.progress', {
                                current: index + 1,
                                total: successJourneyStages.length
                              })}
                            </span>
                          </div>
                        </div>
                        <CardDescription className="text-base leading-relaxed text-muted-foreground ltr:text-left rtl:text-right">
                          {stage.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rtl:sm:flex-row-reverse">
                        <p className="text-sm text-muted-foreground ltr:text-left rtl:text-right">
                          {t('successJourney.ctaHelper')}
                        </p>
                        <Button
                          type="button"
                          className="w-full sm:w-auto gradient-bg text-white shadow-primary"
                          onClick={() => handleJourneyAction(stage)}
                          aria-label={`${stage.cta} - ${stage.title}`}
                        >
                          {stage.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        id="faq-section"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30"
        {...motionProps}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto" variants={sectionFade}>
          <motion.div className="text-center mb-12" variants={staggerContainer}>
            <motion.h2 className="text-3xl font-bold font-poppins mb-4" variants={heroFade}>
              {t('faq.title')}
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-2xl mx-auto" variants={heroFade}>
              {t('faq.subtitle')}
            </motion.p>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Accordion
              type="single"
              collapsible
              value={openFaqItem}
              onValueChange={handleFaqItemChange}
              className="space-y-4"
            >
              {faqs.map((faq, index) => {
                const slugId = generateFaqSlug(faq.question, index);
                return (
                  <AccordionItem
                    key={slugId}
                    id={slugId}
                    value={slugId}
                    className="border rounded-lg shadow-sm bg-card"
                  >
                    <AccordionTrigger className="px-6 py-4 min-h-[48px] [&[data-state=open]>svg]:rotate-180">
                      <span className="font-bold text-xl text-start rtl:text-right">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-start rtl:text-right">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8"
        {...motionProps}
        variants={sectionVariants}
      >
        <motion.div className="max-w-4xl mx-auto text-center" variants={sectionFade}>
          <motion.h2 className="text-3xl font-bold font-poppins mb-4" variants={heroFade}>
            {t('cta.title')}
          </motion.h2>
          <motion.p className="text-xl text-muted-foreground mb-8" variants={heroFade}>
            {t('cta.subtitle')}
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={staggerContainer}>
            <motion.div variants={heroFade}>
              <Button
                size="lg"
                className="gradient-bg text-white shadow-primary"
                onClick={() => redirectToAuth(AUTH_URLS.WHATSAPP, 'start-live-chat', 'contact-cta')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t('cta.startLiveChat')}
              </Button>
            </motion.div>
            <motion.div variants={heroFade}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('contact-form', 'view-help-center', 'contact-cta')}
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                {t('cta.viewHelpCenter')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </Layout>
  );
}

export default function Contact() {
  return (
    <FeatureErrorBoundary featureName="Contact">
      <ContactContent />
    </FeatureErrorBoundary>
  );
}
