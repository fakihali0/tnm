import React from 'react';
import { TopStrip } from './TopStrip';
import { DashboardKPIRow } from './DashboardKPIRow';
import { LiveAccountPanel } from './LiveAccountPanel';
import { RiskAssessmentPanel } from './RiskAssessmentPanel';
import { AdvancedInsightsPanel } from './AdvancedInsightsPanel';
import { EquityCurveEnhanced } from './EquityCurveEnhanced';
import { EnhancedTradesTable } from './EnhancedTradesTable';
import { NotificationCenter } from './NotificationCenter';
import { CoachingLayer } from './CoachingLayer';
import { OnboardingCoach } from './OnboardingCoach';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { useCoaching } from '@/hooks/useCoaching';
import { useTradingDashboard } from '@/hooks/useTradingDashboard';
import { useState } from 'react';
import { SPACING } from '@/styles/spacing';

interface ProfessionalLayoutProps {
  children?: React.ReactNode;
  showEquityCurve?: boolean;
  showTradesTable?: boolean;
  showKPIs?: boolean;
  section?: 'dashboard' | 'journal' | 'other';
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ 
  children, 
  showEquityCurve = false, 
  showTradesTable = false,
  showKPIs = true,
  section = 'other'
}) => {
  const { optimizedTouchTargets } = useMobileOptimizations();
  const { isEnabled: coachingEnabled, userLevel, hasCompletedOnboarding } = useCoaching();
  const { selectedAccount, closedTrades, isLoading } = useTradingDashboard();
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);
  return (
    <div className="bg-background">
      {/* Top Strip - Always visible */}
      <TopStrip />
      
      {/* Main Content */}
      <div className={`container max-w-7xl mx-auto ${SPACING.padding.container} ${SPACING.gap.section}`}>
        {/* KPI Row - Full width - Only show for dashboard */}
        {showKPIs && section === 'dashboard' && <DashboardKPIRow />}
        
        {/* Mobile: Stack layout, Desktop: Two-column layout */}
        <div className={`grid ${SPACING.gap.large} grid-cols-1 lg:grid-cols-12`}>
          {/* Left Column - Main Content (Wider) */}
          <div className={`lg:col-span-8 ${SPACING.gap.section}`}>
            {/* Enhanced Equity Curve - Only show for dashboard */}
            {showEquityCurve && selectedAccount && section === 'dashboard' && (
              <EquityCurveEnhanced 
                trades={closedTrades} 
                currency={selectedAccount.currency} 
              />
            )}
            
            {/* Enhanced Trades Table - Only show for dashboard */}
            {showTradesTable && selectedAccount && section === 'dashboard' && (
              <EnhancedTradesTable 
                trades={closedTrades} 
                currency={selectedAccount.currency} 
                isLoading={isLoading} 
              />
            )}
            
            {/* Custom children content */}
            {children}
          </div>
          
          {/* Right Column - Panels (Narrower) */}
          <div className={`lg:col-span-4 ${SPACING.gap.section}`}>
            {/* Mobile: Show notifications first, Desktop: Show live account first */}
            <div className="lg:hidden">
              <NotificationCenter 
                notifications={[]}
                onMarkAsRead={() => {}}
                onMarkAllAsRead={() => {}}
                onDeleteNotification={() => {}}
              />
            </div>
            
            {/* Live Account Panel */}
            <LiveAccountPanel />
            
            {/* Risk Assessment Panel */}
            <RiskAssessmentPanel />
            
            {/* AI Insights Panel */}
            <AdvancedInsightsPanel />
            
            {/* Desktop: Show notifications last */}
            <div className="hidden lg:block">
              <NotificationCenter 
                notifications={[]}
                onMarkAsRead={() => {}}
                onMarkAllAsRead={() => {}}
                onDeleteNotification={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coaching Layer */}
      {coachingEnabled && (
        <CoachingLayer 
          currentPage="tnm-ai"
          userLevel={userLevel}
          showTips={true}
        />
      )}

      {/* Onboarding Coach */}
      <OnboardingCoach
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    </div>
  );
};