import React from 'react';
import { LucideIcon, Database, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
  children
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      container: 'py-12 px-6',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <Card className={cn(
      "flex flex-col items-center justify-center text-center",
      classes.container,
      className
    )}>
      <div className="mb-4">
        <Icon className={cn(
          "text-muted-foreground",
          classes.icon
        )} />
      </div>
      
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        classes.title
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-muted-foreground mb-6 max-w-sm leading-relaxed",
        classes.description
      )}>
        {description}
      </p>

      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            size={size === 'sm' ? 'sm' : 'default'}
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

// Specialized empty state components
export function NoDataEmptyState({ 
  title = "No Data Available",
  description = "There's no data to display at the moment.",
  onRefresh
}: {
  title?: string;
  description?: string;
  onRefresh?: () => void;
}) {
  return (
    <EmptyState
      icon={Database}
      title={title}
      description={description}
      action={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  );
}

export function NoResultsEmptyState({
  searchTerm,
  onClearSearch
}: {
  searchTerm?: string;
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={searchTerm 
        ? `No results found for "${searchTerm}". Try adjusting your search criteria.`
        : "No results found. Try adjusting your filters."
      }
      action={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "outline"
      } : undefined}
      size="sm"
    />
  );
}