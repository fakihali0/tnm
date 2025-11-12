import React, { useState } from 'react';
import { EnhancedMobileLayout } from './EnhancedMobileLayout';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ReactNode;
  badge?: number;
}

interface MobileOptimizedLayoutProps {
  children?: React.ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className="w-full">{children}</div>;
  }

  return <EnhancedMobileLayout>{children}</EnhancedMobileLayout>;
}