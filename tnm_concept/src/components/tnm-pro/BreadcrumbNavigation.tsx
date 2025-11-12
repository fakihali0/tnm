import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, LayoutDashboard, Link2, Calculator, BookOpen, Bell, Settings } from 'lucide-react';
import { useRTL } from '@/hooks/useRTL';

interface BreadcrumbNavigationProps {
  currentSection?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ 
  currentSection 
}) => {
  const { t } = useTranslation('tnm-ai');
  const location = useLocation();
  const rtl = useRTL();
  
  const getActiveSection = () => {
    return currentSection || location.hash.replace('#', '') || 'dashboard';
  };

  const sectionConfig = {
    dashboard: { label: t('breadcrumb.dashboard'), icon: LayoutDashboard },
    accounts: { label: t('breadcrumb.accounts'), icon: Link2 },
    'risk-calculator': { label: t('breadcrumb.riskCalculator'), icon: Calculator },
    journal: { label: t('breadcrumb.journal'), icon: BookOpen },
    alerts: { label: t('breadcrumb.alerts'), icon: Bell },
    settings: { label: t('breadcrumb.settings'), icon: Settings },
  };

  const activeSection = getActiveSection();
  const sectionInfo = sectionConfig[activeSection as keyof typeof sectionConfig];

  return (
    <Breadcrumb className="mb-6" dir={rtl.dir}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {t('breadcrumb.home')}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/tnm-ai" className="flex items-center gap-1">
              <LayoutDashboard className="h-3 w-3" />
              {t('breadcrumb.tnmAi')}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {activeSection !== 'dashboard' && sectionInfo && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1">
                <sectionInfo.icon className="h-3 w-3" />
                {sectionInfo.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};