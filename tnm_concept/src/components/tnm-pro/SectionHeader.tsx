import React from 'react';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { SPACING } from '@/styles/spacing';
import { useRTL } from '@/hooks/useRTL';

interface SectionHeaderProps {
  title: string;
  description?: string;
  section?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  section,
  icon: Icon,
  actions,
  badge
}) => {
  const rtl = useRTL();

  return (
    <div className={SPACING.stack.comfortable} dir={rtl.dir}>
      <BreadcrumbNavigation currentSection={section} />
      
      <div className="flex items-start justify-between">
        <div className={SPACING.stack.compact}>
          <div className={`flex items-center ${SPACING.gap.button}`}>
            {Icon && <Icon className={`${SPACING.icon.lg} text-primary me-3`} />}
            <h1 className="text-3xl font-bold tracking-tight text-start">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'secondary'}>
                {badge.text}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-start">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className={`flex items-center ${SPACING.gap.small}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};