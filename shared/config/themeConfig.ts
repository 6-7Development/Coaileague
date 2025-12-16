/**
 * Centralized Theme Configuration
 * 
 * All UI theming values are defined here for Trinity to edit.
 * Changes here propagate to the entire application.
 * 
 * TRINITY-EDITABLE: theme
 */

// ============================================================================
// COLOR PALETTE - Trinity can adjust these values
// ============================================================================
export const THEME_COLORS = {
  // Primary brand colors
  primary: {
    hue: 262,
    saturation: 83,
    lightness: 58,
  },
  
  // Secondary/accent colors  
  accent: {
    hue: 210,
    saturation: 40,
    lightness: 96,
  },
  
  // Semantic colors
  success: {
    hue: 142,
    saturation: 76,
    lightness: 36,
  },
  warning: {
    hue: 38,
    saturation: 92,
    lightness: 50,
  },
  error: {
    hue: 0,
    saturation: 84,
    lightness: 60,
  },
  info: {
    hue: 199,
    saturation: 89,
    lightness: 48,
  },
  
  // Background colors
  background: {
    light: { hue: 0, saturation: 0, lightness: 100 },
    dark: { hue: 222, saturation: 47, lightness: 11 },
  },
  
  // Card/surface colors
  card: {
    light: { hue: 0, saturation: 0, lightness: 100 },
    dark: { hue: 222, saturation: 47, lightness: 11 },
  },
  
  // Text colors
  foreground: {
    light: { hue: 222, saturation: 47, lightness: 11 },
    dark: { hue: 210, saturation: 40, lightness: 98 },
  },
  
  // Muted/secondary text
  muted: {
    light: { hue: 210, saturation: 40, lightness: 96 },
    dark: { hue: 217, saturation: 33, lightness: 18 },
  },
  
  // Border colors
  border: {
    light: { hue: 214, saturation: 32, lightness: 91 },
    dark: { hue: 217, saturation: 33, lightness: 18 },
  },
};

// ============================================================================
// SPACING SCALE - Trinity can adjust these values
// ============================================================================
export const THEME_SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// ============================================================================
// TYPOGRAPHY - Trinity can adjust these values
// ============================================================================
export const THEME_TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================================================
// BORDER RADIUS - Trinity can adjust these values
// ============================================================================
export const THEME_RADIUS = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
};

// ============================================================================
// SHADOWS - Trinity can adjust these values
// ============================================================================
export const THEME_SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

// ============================================================================
// LAYOUT DIMENSIONS - Trinity can adjust these values
// ============================================================================
export const THEME_LAYOUT = {
  sidebarWidth: '16rem',
  sidebarWidthCollapsed: '4rem',
  headerHeight: '3.5rem',
  maxContentWidth: '80rem',
  containerPadding: '1rem',
  cardPadding: '1.5rem',
  popoverMaxHeight: '500px',
  notificationListHeight: '300px',
};

// ============================================================================
// ANIMATION TIMING - Trinity can adjust these values
// ============================================================================
export const THEME_ANIMATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert HSL object to CSS hsl() string
 */
export function hslToString(hsl: { hue: number; saturation: number; lightness: number }): string {
  return `hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`;
}

/**
 * Convert HSL object to Tailwind-compatible format (space-separated without hsl())
 */
export function hslToTailwind(hsl: { hue: number; saturation: number; lightness: number }): string {
  return `${hsl.hue} ${hsl.saturation}% ${hsl.lightness}%`;
}

/**
 * Get all theme values as a flat object for CSS variable generation
 */
export function getThemeVariables() {
  return {
    colors: THEME_COLORS,
    spacing: THEME_SPACING,
    typography: THEME_TYPOGRAPHY,
    radius: THEME_RADIUS,
    shadows: THEME_SHADOWS,
    layout: THEME_LAYOUT,
    animation: THEME_ANIMATION,
  };
}

export default {
  THEME_COLORS,
  THEME_SPACING,
  THEME_TYPOGRAPHY,
  THEME_RADIUS,
  THEME_SHADOWS,
  THEME_LAYOUT,
  THEME_ANIMATION,
  hslToString,
  hslToTailwind,
  getThemeVariables,
};
