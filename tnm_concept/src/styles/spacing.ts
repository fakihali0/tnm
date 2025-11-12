/**
 * Centralized spacing constants for consistent UI/UX
 * Use these constants throughout the application for standardized spacing
 */

export const SPACING = {
  // Section spacing
  section: {
    py: 'py-16 sm:py-24',
    pySmall: 'py-12 sm:py-16',
    pyLarge: 'py-20 sm:py-32',
    px: 'px-4 sm:px-6',
  },
  
  // Gap spacing
  gap: {
    section: 'space-y-8 sm:space-y-12',
    card: 'gap-6',
    cardSmall: 'gap-4',
    button: 'gap-3',
    iconButton: 'gap-2',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
    xlarge: 'gap-8',
  },
  
  // Padding
  padding: {
    card: 'p-6 md:p-8',
    cardSmall: 'p-4 md:p-6',
    cardCompact: 'p-3 md:p-4',
    container: 'px-4 sm:px-6',
    containerLarge: 'px-4 sm:px-6 lg:px-8',
  },
  
  // Margins
  margin: {
    heading: 'mb-4',
    headingLarge: 'mb-6',
    headingXLarge: 'mb-8',
    headingHuge: 'mb-12',
    paragraph: 'mb-4',
    section: 'mb-8',
  },
  
  // Touch targets (minimum 44px for accessibility)
  touch: {
    min: 'min-h-[44px]',
    comfortable: 'min-h-[48px]',
    button: 'h-12',
  },
  
  // Icon sizes
  icon: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    xxl: 'h-10 w-10',
    huge: 'h-12 w-12',
  },
  
  // Space-y values (for vertical stacking)
  stack: {
    tight: 'space-y-1',
    compact: 'space-y-2',
    normal: 'space-y-3',
    comfortable: 'space-y-4',
    relaxed: 'space-y-6',
  },
} as const;

export type SpacingConfig = typeof SPACING;
