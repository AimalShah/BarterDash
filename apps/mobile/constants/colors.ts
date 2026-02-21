/**
 * BarterDash brand tokens aligned with ARCHITECTURE.md.
 * Keep this file as the single color source for both new and legacy screens.
 */

// Architecture palette
export const primaryBlue = '#6391F2';
export const softBlue = '#B2CBEC';
export const blueLavender = '#9CA9DE';
export const mainBackground = '#F2F1F8';
export const cardWhite = '#FFFFFF';
export const lightGrey = '#9C9AA6';
export const primaryText = '#22232D';
export const secondaryDark = '#2F354E';
export const warmHighlight = '#F2D468';
export const softGold = '#E7D7A2';
export const mutedBlueGrey = '#768CAB';

// Status colors
export const successGreen = '#22c55e';
export const errorRed = '#EF4444';
export const warningAmber = '#F59E0B';
export const infoBlue = primaryBlue;

// Legacy aliases (temporary during migration)
export const primaryGold = primaryBlue;
export const secondaryGold = blueLavender;
export const goldLight = softBlue;
export const goldDark = mutedBlueGrey;
export const luxuryBlack = mainBackground;
export const luxuryBlackLight = cardWhite;
export const luxuryBlackLighter = '#E8ECF6';
export const navBackground = cardWhite;
export const cardBackground = cardWhite;
export const darkSurface = '#EDEFF7';
export const darkBorder = '#D5DBE9';
export const darkBorderLight = '#E7EBF4';
export const textPrimary = primaryText;
export const textSecondary = secondaryDark;
export const textMuted = lightGrey;
export const textDarkMuted = mutedBlueGrey;
export const liveIndicator = errorRed;

// Gradients
export const goldLinear = `linear-gradient(135deg, ${primaryBlue} 0%, ${blueLavender} 100%)`;
export const darkOverlay = 'linear-gradient(to top, rgba(34,35,45,0.7), rgba(34,35,45,0))';

// Glow / overlays / shadows
export const glowGold = 'rgba(99, 145, 242, 0.15)';
export const glowGoldStrong = 'rgba(99, 145, 242, 0.25)';
export const overlayStrong = 'rgba(34,35,45,0.8)';
export const overlayMedium = 'rgba(34,35,45,0.5)';
export const overlaySoft = 'rgba(34,35,45,0.25)';

export const shadowLight = {
  shadowColor: '#22232D',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 2,
  elevation: 2,
};

export const shadowMedium = {
  shadowColor: '#22232D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 4,
};

export const shadowLarge = {
  shadowColor: '#22232D',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 16,
  elevation: 8,
};

export const COLORS = {
  // Architecture names
  primaryBlue,
  softBlue,
  blueLavender,
  mainBackground,
  cardWhite,
  lightGrey,
  primaryText,
  secondaryDark,
  warmHighlight,
  softGold,
  mutedBlueGrey,
  infoBlue,

  // Legacy names
  primaryGold,
  secondaryGold,
  goldLight,
  goldDark,
  luxuryBlack,
  luxuryBlackLight,
  luxuryBlackLighter,
  navBackground,
  cardBackground,
  darkSurface,
  darkBorder,
  darkBorderLight,
  textPrimary,
  textSecondary,
  textMuted,
  textDarkMuted,
  liveIndicator,

  // Status / fx
  successGreen,
  errorRed,
  warningAmber,
  goldLinear,
  darkOverlay,
  glowGold,
  glowGoldStrong,
  overlayStrong,
  overlayMedium,
  overlaySoft,
  shadowLight,
  shadowMedium,
  shadowLarge,
};

export default COLORS;
