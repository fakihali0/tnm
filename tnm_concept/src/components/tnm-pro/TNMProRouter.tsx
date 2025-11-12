import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';
import { Link2, Calculator, BookOpen, Bell, LayoutDashboard } from 'lucide-react';
import { useAccountStore } from '@/store/auth';
import { AccountLinkForm } from './AccountLinkForm';
import { LinkedAccountsList } from './LinkedAccountsList';
import { RiskCalculator } from './RiskCalculator';
import { SimplifiedDashboard } from './SimplifiedDashboard';
import { SimplifiedJournal } from './SimplifiedJournal';
import { AIHub } from './AIHub';
import { SectionHeader } from './SectionHeader';
import { MobileDashboardCards } from './mobile/MobileDashboardCards';
import { SimplifiedMobileAIHub } from './mobile/SimplifiedMobileAIHub';
import { MobileAnalytics } from './mobile/MobileAnalytics';
import { MobileTradingTools } from './mobile/MobileTradingTools';

interface TNMProRouterProps {
  mode?: 'mobile' | 'desktop';
}

export const TNMProRouter: React.FC<TNMProRouterProps> = ({ mode = 'desktop' }) => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const location = useLocation();
  const accounts = useAccountStore(state => state.accounts);
  const selectedAccount = useAccountStore(state => state.selectedAccount);
  const setSelectedAccount = useAccountStore(state => state.setSelectedAccount);

  const getActiveSection = () => {
    const hash = location.hash.replace('#', '');
    return hash || 'ai-hub';
  };

  const activeSection = getActiveSection();

  if (mode === 'mobile') {
    switch (activeSection) {
      case 'dashboard':
        return <MobileDashboardCards />;
      case 'ai-hub':
        return <SimplifiedMobileAIHub />;
      case 'analytics':
        return <MobileAnalytics />;
      case 'tools':
        return <MobileTradingTools />;
      case 'accounts':
        return (
          <div className="space-y-4" dir={rtl.dir}>
            <AccountLinkForm />
            <LinkedAccountsList
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
            />
          </div>
        );
      case 'risk-calculator':
        return <RiskCalculator />;
      case 'journal':
        return <SimplifiedJournal />;
      default:
        return <MobileDashboardCards />;
    }
  }

  // Desktop routing
  switch (activeSection) {
    case 'ai-hub':
      return (
        <div className="content-container" dir={rtl.dir}>
          <AIHub />
        </div>
      );
    case 'accounts':
      return (
        <div className="content-container" dir={rtl.dir}>
          <SectionHeader
            title={t('sections.accounts.title')}
            description={t('sections.accounts.description')}
            section="accounts"
            icon={Link2}
            badge={{ text: t('sections.accounts.badge', { count: accounts.length }), variant: accounts.length > 0 ? 'secondary' : 'outline' }}
          />
          
          <div className="space-y-6">
            <LinkedAccountsList
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
            />
            <AccountLinkForm />
          </div>
        </div>
      );
    case 'risk-calculator':
      return (
        <div className="content-container" dir={rtl.dir}>
          <SectionHeader
            title={t('sections.riskCalculator.title')}
            description={t('sections.riskCalculator.description')}
            section="risk-calculator"
            icon={Calculator}
            badge={{ text: t('sections.riskCalculator.badge'), variant: 'secondary' }}
          />
          <RiskCalculator />
        </div>
      );
    case 'journal':
      return (
        <div className="content-container" dir={rtl.dir}>
          <SectionHeader
            title={t('sections.journal.title')}
            description={t('sections.journal.description')}
            section="journal"
            icon={BookOpen}
            badge={{ text: t('sections.journal.badge'), variant: 'secondary' }}
          />
          <SimplifiedJournal />
        </div>
      );
    default:
      return (
        <div className="content-container" dir={rtl.dir}>
          <SectionHeader
            title={t('dashboard.title')}
            description={t('dashboard.description')}
            section="dashboard"
            icon={LayoutDashboard}
            badge={{ text: t('sections.alerts.badge'), variant: 'secondary' }}
          />
          <SimplifiedDashboard />
        </div>
      );
  }
};
