/**
 * BarterDash Theme v3.0 - Dark Luxury
 * Gold accent, Dark backgrounds, Plus Jakarta Sans typography
 * Single source of truth for all theme values
 */

import { COLORS } from './colors';

// Typography Configuration
export const typography = {
  fontFamily: 'PlusJakartaSans, Plus Jakarta Sans, sans-serif',
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  sizes: {
    h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    xs: { fontSize: 10, fontWeight: '400', lineHeight: 14 },
  },
};

// Main Theme Object
export const theme = {
  colors: {
    // Brand Colors
    brand: {
      primary: COLORS.primaryGold,      // #F4C542
      secondary: COLORS.secondaryGold,  // #E5A920
      light: COLORS.goldLight,          // #F9D77A
      dark: COLORS.goldDark,            // #C99412
    },
    
    // Background Colors (Dark Luxury Theme)
    background: {
      primary: COLORS.luxuryBlack,      // #0f0f0f - Main background
      secondary: COLORS.luxuryBlackLight, // #1a1a1a - Cards
      tertiary: COLORS.luxuryBlackLighter, // #262626 - Elevated surfaces
      nav: COLORS.navBackground,        // #121212 - Navigation
      card: COLORS.cardBackground,      // #1a1a1a - Cards
      surface: COLORS.darkSurface,      // #2a2a2a - Input backgrounds
      overlay: COLORS.overlayMedium,    // rgba(0,0,0,0.5)
    },
    
    // Text Colors
    text: {
      primary: COLORS.textPrimary,      // #ffffff
      secondary: COLORS.textSecondary,  // #9ca3af
      muted: COLORS.textMuted,          // #6b7280
      darkMuted: COLORS.textDarkMuted,  // #4b5563
      inverse: COLORS.luxuryBlack,      // #0f0f0f - Text on gold
    },
    
    // Border Colors
    border: {
      light: COLORS.darkBorderLight,    // rgba(255, 255, 255, 0.05)
      medium: COLORS.darkBorder,        // #333333
      strong: COLORS.primaryGold,       // #F4C542
    },
    
    // Status Colors
    status: {
      success: COLORS.successGreen,     // #22c55e
      error: COLORS.errorRed,           // #EF4444
      warning: COLORS.warningAmber,     // #F59E0B
      live: COLORS.liveIndicator,       // #dc2626
    },
    
    // Effects
    glow: {
      gold: COLORS.glowGold,            // rgba(244, 197, 66, 0.2)
      goldStrong: COLORS.glowGoldStrong, // rgba(244, 197, 66, 0.4)
    },
  },
  
  // Gradients
  gradients: {
    goldLinear: COLORS.goldLinear,
    darkOverlay: COLORS.darkOverlay,
    goldButton: ['#F4C542', '#E5A920'] as const,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Typography
  typography,
  
  // Shadows
  shadows: {
    sm: COLORS.shadowLight,
    md: COLORS.shadowMedium,
    lg: COLORS.shadowLarge,
  },
  
  // Keyboard behavior
  keyboard: {
    behavior: 'padding' as const,
    keyboardVerticalOffset: 100,
  },
};

// Gluestack UI Tokens (for config/gluestack.config.ts)
// These map to the Gluestack UI design token system
export const gluestackTokens = {
  colors: {
    // Primary scale (mapped to gold)
    primary0: COLORS.luxuryBlack,
    primary50: '#2a2210',
    primary100: '#3d3015',
    primary200: '#5c4818',
    primary300: '#7a601c',
    primary400: '#9a7a20',
    primary500: COLORS.goldDark,
    primary600: COLORS.secondaryGold,
    primary700: COLORS.primaryGold,
    primary800: COLORS.goldLight,
    primary900: '#fceeb0',
    primary950: '#fff9e0',
    
    // Secondary scale (mapped to dark luxury)
    secondary0: '#000000',
    secondary50: '#050505',
    secondary100: '#0a0a0a',
    secondary200: COLORS.navBackground,
    secondary300: COLORS.luxuryBlack,
    secondary400: '#141414',
    secondary500: COLORS.luxuryBlackLight,
    secondary600: COLORS.luxuryBlackLighter,
    secondary700: COLORS.darkSurface,
    secondary800: '#303030',
    secondary900: '#3a3a3a',
    secondary950: '#454545',
    
    // Background scale
    background0: COLORS.luxuryBlack,
    background50: COLORS.navBackground,
    background100: COLORS.luxuryBlackLight,
    background200: COLORS.luxuryBlackLighter,
    background300: COLORS.darkSurface,
    background400: '#333333',
    background500: '#3d3d3d',
    background600: '#474747',
    background700: '#525252',
    background800: '#5c5c5c',
    background900: '#666666',
    background950: '#707070',
    
    // Text scale
    text0: COLORS.luxuryBlack,
    text50: '#1a1a1a',
    text100: '#2a2a2a',
    text200: '#3d3d3d',
    text300: '#525252',
    text400: '#666666',
    text500: COLORS.textDarkMuted,
    text600: COLORS.textMuted,
    text700: COLORS.textSecondary,
    text800: '#d1d1d1',
    text900: '#e8e8e8',
    text950: COLORS.textPrimary,
    
    // Border scale
    border0: '#000000',
    border50: '#0a0a0a',
    border100: '#141414',
    border200: '#1f1f1f',
    border300: COLORS.darkBorder,
    border400: '#404040',
    border500: '#4a4a4a',
    border600: '#595959',
    border700: '#6b6b6b',
    border800: '#808080',
    border900: '#999999',
    border950: '#b3b3b3',
    
    // Status colors
    success0: '#022c22',
    success50: '#064e3b',
    success100: '#065f46',
    success200: '#047857',
    success300: '#059669',
    success400: '#10b981',
    success500: COLORS.successGreen,
    success600: '#4ade80',
    success700: '#86efac',
    success800: '#bbf7d0',
    success900: '#dcfce7',
    success950: '#f0fdf4',
    
    error0: '#450a0a',
    error50: '#7f1d1d',
    error100: '#991b1b',
    error200: '#b91c1c',
    error300: '#dc2626',
    error400: COLORS.errorRed,
    error500: '#f87171',
    error600: '#fca5a5',
    error700: '#fecaca',
    error800: '#fee2e2',
    error900: '#fef2f2',
    error950: '#fff1f1',
    
    warning0: '#451a03',
    warning50: '#78350f',
    warning100: '#92400e',
    warning200: '#b45309',
    warning300: '#d97706',
    warning400: '#f59e0b',
    warning500: COLORS.warningAmber,
    warning600: '#fbbf24',
    warning700: '#fcd34d',
    warning800: '#fde68a',
    warning900: '#fef3c7',
    warning950: '#fffbeb',
    
    info0: '#172554',
    info50: '#1e3a8a',
    info100: '#1e40af',
    info200: '#1d4ed8',
    info300: '#2563eb',
    info400: '#3b82f6',
    info500: '#60a5fa',
    info600: '#93c5fd',
    info700: '#bfdbfe',
    info800: '#dbeafe',
    info900: '#eff6ff',
    info950: '#f8fafc',
    
    // Live indicator
    rose0: '#4c0519',
    rose50: '#881337',
    rose100: '#9f1239',
    rose200: '#be123c',
    rose300: '#e11d48',
    rose400: '#f43f5e',
    rose500: COLORS.liveIndicator,
    rose600: '#fb7185',
    rose700: '#fda4af',
    rose800: '#fecdd3',
    rose900: '#ffe4e6',
    rose950: '#fff1f2',
  },
  
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    4.5: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    13: 52,
    14: 56,
    15: 60,
    16: 64,
    17: 68,
    18: 72,
    19: 76,
    20: 80,
    24: 96,
    32: 128,
    40: 160,
    48: 192,
    56: 224,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
    px: 1,
    full: '100%',
  },
  
  borderRadii: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    '2xl': 12,
    '3xl': 16,
    full: 9999,
  },
  
  fontSizes: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  },
  
  fontWeights: {
    hairline: '100',
    thin: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeights: {
    '3xs': 12,
    '2xs': 14,
    xs: 16,
    sm: 18,
    md: 20,
    lg: 22,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
    '4xl': 36,
    '5xl': 40,
  },
};

// Utility Functions
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
  const base = {
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  };

  switch (variant) {
    case 'primary':
      return {
        ...base,
        backgroundColor: theme.colors.brand.primary,
        borderWidth: 0,
      };
    case 'secondary':
      return {
        ...base,
        backgroundColor: theme.colors.background.surface,
        borderWidth: 0,
      };
    case 'outline':
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.brand.primary,
      };
    case 'ghost':
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    default:
      return base;
  }
};

export const getCardStyle = () => ({
  backgroundColor: theme.colors.background.card,
  borderRadius: theme.borderRadius.xl,
  borderWidth: 1,
  borderColor: theme.colors.border.medium,
  ...theme.shadows.md,
});

export const getInputStyle = () => ({
  backgroundColor: theme.colors.background.surface,
  borderRadius: theme.borderRadius.lg,
  borderWidth: 1,
  borderColor: theme.colors.border.medium,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: theme.spacing.md,
  color: theme.colors.text.primary,
});

export default theme;
