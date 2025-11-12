import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon?: React.ComponentType<{ className?: string }>;
    customElement?: React.ReactElement;
    onClick: () => void;
    label: string;
  };
  rightActions?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    label: string;
    badge?: number;
  }>;
  className?: string;
  gradient?: boolean;
}

export function MobileHeader({ 
  title, 
  subtitle, 
  leftAction, 
  rightActions = [], 
  className,
  gradient = false 
}: MobileHeaderProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between pl-2 pr-4 py-4 border-b bg-background shadow-sm safe-area-top",
        gradient && "bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10",
        className
      )}
    >
      {/* Left Action */}
      <div className="w-12">
        {leftAction && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-lg min-h-[44px] min-w-[44px]"
            onClick={leftAction.onClick}
            aria-label={leftAction.label}
          >
            {leftAction.customElement || (
              leftAction.icon && <leftAction.icon className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="text-center flex-1">
        <h1 
          className={cn(
            "text-lg font-bold tracking-tight",
            gradient ? "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent" : "text-foreground"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 w-20 justify-end">
        {rightActions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="rounded-lg relative min-h-[44px] min-w-[44px]"
            onClick={action.onClick}
            aria-label={action.label}
          >
            <action.icon className="h-5 w-5" />
            {action.badge && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                role="status"
                aria-live="polite"
              >
                <span className="text-[10px] text-white font-bold">
                  {action.badge > 9 ? '9+' : action.badge}
                </span>
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}