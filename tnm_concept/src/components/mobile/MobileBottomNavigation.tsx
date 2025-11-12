import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import { SPACING } from '@/styles/spacing';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface MobileBottomNavigationProps {
  items: NavItem[];
  activeItem: string;
  onItemChange: (itemId: string) => void;
  className?: string;
}

export function MobileBottomNavigation({ 
  items, 
  activeItem, 
  onItemChange, 
  className 
}: MobileBottomNavigationProps) {
  const { optimizedTouchTargets, hapticFeedback, triggerHapticFeedback } = useMobileOptimizations();

  const handleItemClick = (itemId: string) => {
    if (hapticFeedback) {
      triggerHapticFeedback('light');
    }
    onItemChange(itemId);
  };

  return (
    <div 
      className={cn(
        "border-t bg-background shadow-sm",
        className
      )}
      role="tablist"
      aria-label="Main navigation"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
    >
      <div className="flex items-center justify-around p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item.id);
                }
              }}
              className={cn(
                `flex flex-col items-center p-3 rounded-xl transition-colors duration-150 min-w-0 flex-1 relative active:scale-95 ${SPACING.gap.small}`,
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground',
                optimizedTouchTargets && 'min-h-[56px]'
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={`${item.label}${item.badge ? ` (${item.badge} notifications)` : ''}`}
              tabIndex={0}
            >
              <div className="relative" role="presentation">
                <Icon className={cn(`transition-transform ${SPACING.icon.lg}`, isActive && "scale-110")} aria-hidden="true" />
                {item.badge && (
                  <div
                    className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ${SPACING.icon.sm}`}
                    role="status"
                    aria-live="polite"
                  >
                    <span className="sr-only">{item.badge} notifications</span>
                    <span aria-hidden="true" className="text-[10px]">{item.badge > 9 ? '9+' : item.badge}</span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs truncate w-full text-center transition-opacity",
                isActive ? 'font-semibold opacity-100' : 'font-normal opacity-70'
              )} aria-hidden="true">
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}