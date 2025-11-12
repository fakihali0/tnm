import { useTranslation } from 'react-i18next';

/**
 * Modern RTL Hook
 * 
 * Returns RTL utilities for consistent right-to-left layout support.
 * Use this instead of calculating `isRTL` throughout components.
 * 
 * @example
 * ```tsx
 * const rtl = useRTL();
 * 
 * return (
 *   <div dir={rtl.dir}>
 *     <Icon className="me-2" />
 *     <span className="text-start">{t('text')}</span>
 *   </div>
 * );
 * ```
 */
export function useRTL() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return {
    /** Use on container elements: dir={rtl.dir} */
    dir: isRTL ? ('rtl' as const) : ('ltr' as const),
    
    /** Boolean check for RTL (use sparingly, only for component APIs that require it) */
    isRTL,
    
    /** For Shadcn Sidebar: side={rtl.sidebarSide} */
    sidebarSide: isRTL ? ('right' as const) : ('left' as const),
    
    /** For Framer Motion animations: x={rtl.animationDirection(100)} */
    animationDirection: (value: number) => (isRTL ? value : -value),
  };
}
