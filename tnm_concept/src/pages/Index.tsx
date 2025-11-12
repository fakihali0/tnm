import React, { Suspense } from "react";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteSummaryHub } from "@/components/home/SiteSummaryHub";
import { ExperienceSection } from "@/components/home/ExperienceSection";
import { CTASection } from "@/components/home/CTASection";
import { TradingViewErrorBoundary } from "@/components/error/TradingViewErrorBoundary";
import { SocialProofBand } from "@/components/instruments/SocialProofBand";

// Lazy load TradingView ticker as it's not critical for initial render
const TradingViewTicker = React.lazy(() => import("@/components/home/TradingViewTicker"));

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TradingViewErrorBoundary>
        <Suspense fallback={<div className="w-full h-20 bg-card animate-pulse" />}>
          <TradingViewTicker />
        </Suspense>
      </TradingViewErrorBoundary>
      <ExperienceSection />
      <SiteSummaryHub />

      {/* Social Proof */}
      <SocialProofBand />
      
      <CTASection />
    </Layout>
  );
};

export default Index;