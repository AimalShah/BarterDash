/**
 * BarterDash Brand Color Tokens
 * Single source of truth for all colors in the application
 * Dark luxury theme with gold accents
 */

// Brand Colors - Gold
export const primaryGold = '#F4C542';
export const secondaryGold = '#E5A920';
export const goldLight = '#F9D77A';
export const goldDark = '#C99412';

// Luxury Dark Colors
export const luxuryBlack = '#0f0f0f';
export const luxuryBlackLight = '#1a1a1a';
export const luxuryBlackLighter = '#262626';
export const navBackground = '#121212';
export const cardBackground = '#1a1a1a';

// Neutral Dark Colors
export const darkSurface = '#2a2a2a';
export const darkBorder = '#333333';
export const darkBorderLight = 'rgba(255, 255, 255, 0.05)';

// Text Colors
export const textPrimary = '#ffffff';
export const textSecondary = '#9ca3af';
export const textMuted = '#6b7280';
export const textDarkMuted = '#4b5563';

// Status Colors
export const liveIndicator = '#dc2626';
export const successGreen = '#22c55e';
export const warningAmber = '#F59E0B';
export const errorRed = '#EF4444';

// Gradients
export const goldLinear = 'linear-gradient(135deg, #F4C542 0%, #E5A920 100%)';
export const darkOverlay = 'linear-gradient(to top, #000000, rgba(0,0,0,0))';

// Glow Effects
export const glowGold = 'rgba(244, 197, 66, 0.2)';
export const glowGoldStrong = 'rgba(244, 197, 66, 0.4)';

// Overlays & Shadows
export const overlayStrong = 'rgba(0,0,0,0.8)';
export const overlayMedium = 'rgba(0,0,0,0.5)';
export const overlaySoft = 'rgba(0,0,0,0.25)';

// Shadow styles for React Native
export const shadowLight = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 2,
};

export const shadowMedium = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
  elevation: 4,
};

export const shadowLarge = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 8,
};

// Complete color palette object for easy imports
export const COLORS = {
  // Brand
  primaryGold,
  secondaryGold,
  goldLight,
  goldDark,
  
  // Dark Luxury
  luxuryBlack,
  luxuryBlackLight,
  luxuryBlackLighter,
  navBackground,
  cardBackground,
  
  // Surfaces
  darkSurface,
  darkBorder,
  darkBorderLight,
  
  // Text
  textPrimary,
  textSecondary,
  textMuted,
  textDarkMuted,
  
  // Status
  liveIndicator,
  successGreen,
  warningAmber,
  errorRed,
  
  // Gradients (strings for web, objects for RN)
  goldLinear,
  darkOverlay,
  
  // Effects
  glowGold,
  glowGoldStrong,
  overlayStrong,
  overlayMedium,
  overlaySoft,
  
  // Shadows
  shadowLight,
  shadowMedium,
  shadowLarge,
};

export default COLORS;
