// Theme configuration for BarterDash Mobile App
// Colors MUST match the design system defined in ARCHITECTURE.md

export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#6391F2',
    blue: '#6391F2',
    soft: '#B2CBEC',
    lavender: '#9CA9DE',
  },

  // Backgrounds & Surfaces
  background: {
    DEFAULT: '#F2F1F8',
    main: '#F2F1F8',
    card: '#FFFFFF',
    grey: '#9C9AA6',
  },

  // Text & Contrast
  text: {
    DEFAULT: '#22232D',
    primary: '#22232D',
    secondary: '#2F354E',
    muted: '#9C9AA6',
    inverse: '#FFFFFF',
  },

  // Accent / Highlight Colors
  accent: {
    warm: '#F2D468',
    gold: '#E7D7A2',
    mutedBlueGrey: '#768CAB',
  },

  // Status Colors
  status: {
    success: '#22c55e',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#6391F2',
  },

  // Border Colors
  border: {
    DEFAULT: '#E5E5E5',
    light: '#F2F1F8',
    medium: '#9C9AA6',
  },
} as const;

// Navigation theme for React Navigation
export const NAV_THEME = {
  light: {
    primary: colors.primary.DEFAULT,
    background: colors.background.main,
    card: colors.background.card,
    text: colors.text.primary,
    border: colors.border.DEFAULT,
    notification: colors.status.error,
  },
};

// Tailwind color mappings (for CSS variables)
export const tailwindColors = {
  background: '0 0% 96%', // #F2F1F8
  foreground: '229 14% 15%', // #22232D
  primary: {
    DEFAULT: '218 85% 67%', // #6391F2
    foreground: '0 0% 100%',
  },
  secondary: {
    DEFAULT: '227 23% 24%', // #2F354E
    foreground: '0 0% 100%',
  },
  muted: {
    DEFAULT: '250 8% 62%', // #9C9AA6
    foreground: '229 14% 15%',
  },
  accent: {
    DEFAULT: '45 85% 67%', // #F2D468
    foreground: '229 14% 15%',
  },
  card: {
    DEFAULT: '0 0% 100%',
    foreground: '229 14% 15%',
  },
  border: '0 0% 90%',
  input: '0 0% 90%',
  ring: '218 85% 67%',
  destructive: {
    DEFAULT: '0 84% 60%',
    foreground: '0 0% 100%',
  },
};

export type Colors = typeof colors;
