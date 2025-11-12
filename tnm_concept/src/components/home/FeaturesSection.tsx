import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CarouselDots } from "@/components/ui/carousel-dots";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';


import { 
  TrendingUp, 
  Shield, 
  BookOpen, 
  Users, 
  BarChart3, 
  Zap,
  ArrowRight
} from "lucide-react";


export function FeaturesSection() {
  const { t, i18n } = useTranslation();
  
  const features = [
    {
      icon: TrendingUp,
      title: t('features.tradingPlatform.title'),
      description: t('features.tradingPlatform.description'),
      cta: t('features.tradingPlatform.cta'),
      action: { type: "internal", path: "/products#platform" }
    },
    {
      icon: Shield,
      title: t('features.funding.title'),
      description: t('features.funding.description'),
      cta: t('features.funding.cta'),
      action: { type: "external", url: AUTH_URLS.FUNDING }
    },
    {
      icon: BookOpen,
      title: t('features.education.title'),
      description: t('features.education.description'),
      cta: t('features.education.cta'),
      action: { type: "internal", path: "/education" }
    },
    {
      icon: Users,
      title: t('features.partners.title'),
      description: t('features.partners.description'),
      cta: t('features.partners.cta'),
      action: { type: "internal", path: "/partners" }
    },
    {
      icon: BarChart3,
      title: t('features.instruments.title'),
      description: t('features.instruments.description'),
      cta: t('features.instruments.cta'),
      action: { type: "internal", path: "/products#instruments" }
    },
    {
      icon: Zap,
      title: t('features.execution.title'),
      description: t('features.execution.description'),
      cta: t('features.execution.cta'),
      action: { type: "external", url: "https://portal.bbcorp.trade/auth/jwt/sign-up/partner/7Ws3KC" }
    }
  ];
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12 space-y-4">
          <h2 className="font-poppins text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {t('features.title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
            containScroll: "trimSnaps",
            direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
          }}
          className="w-full max-w-7xl mx-auto relative"
        >
          <CarouselContent className="-ml-2 md:-ml-4 sm:ms-0">
            {features.map((feature, index) => (
              <CarouselItem key={index} className="ps-2 md:ps-4 sm:ps-0 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                <Card className="trading-card group h-full">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-bg">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="font-poppins text-lg sm:text-xl">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feature.action.type === "external" ? (
                      <Button 
                        variant="ghost" 
                        className="text-primary gap-2 touch-feedback no-tap-highlight min-h-[44px] w-full sm:w-auto"
                        asChild
                      >
                        <a 
                          href={feature.action.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={() => trackButtonClick({ 
                            buttonType: feature.cta.toLowerCase().replace(/\s+/g, '-'), 
                            buttonLocation: 'features-section' 
                          })}
                        >
                          {feature.cta}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </a>
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="text-primary gap-2 touch-feedback no-tap-highlight min-h-[44px] w-full sm:w-auto"
                        asChild
                      >
                        <Link 
                          to={feature.action.path}
                          onClick={() => trackButtonClick({ 
                            buttonType: feature.cta.toLowerCase().replace(/\s+/g, '-'), 
                            buttonLocation: 'features-section' 
                          })}
                        >
                          {feature.cta}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-12 lg:-left-16" />
          <CarouselNext className="hidden sm:flex -right-12 lg:-right-16" />
          <CarouselDots 
            totalSlides={features.length} 
            className="sm:hidden" 
          />
        </Carousel>
      </div>
    </section>
  );
}