import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';

export const FONT_FAMILIES = {
  spaceGrotesk: {
    light: 'SpaceGrotesk_300Light',
    regular: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
    alias: 'SpaceGrotesk',
    aliasSpaced: 'Space Grotesk',
  },
  mono: 'monospace',
} as const;

const SPACE_GROTESK_ALIASES = [
  FONT_FAMILIES.spaceGrotesk.light,
  FONT_FAMILIES.spaceGrotesk.regular,
  FONT_FAMILIES.spaceGrotesk.medium,
  FONT_FAMILIES.spaceGrotesk.semibold,
  FONT_FAMILIES.spaceGrotesk.bold,
  FONT_FAMILIES.spaceGrotesk.alias,
  FONT_FAMILIES.spaceGrotesk.aliasSpaced,
] as const;

const FONT_WEIGHT_MAP: Record<string, number> = {
  hairline: 100,
  thin: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

export function normalizeFontWeight(weight?: string | number | null): number {
  if (typeof weight === 'number' && Number.isFinite(weight)) {
    return Math.max(100, Math.min(900, Math.round(weight / 100) * 100));
  }

  if (typeof weight === 'string') {
    const cleaned = weight.trim().replace(/^\$/, '').toLowerCase();
    if (/^[1-9]00$/.test(cleaned)) {
      return Number(cleaned);
    }
    if (FONT_WEIGHT_MAP[cleaned] !== undefined) {
      return FONT_WEIGHT_MAP[cleaned];
    }
  }

  return 400;
}

export function resolveSpaceGroteskFontFamily(weight?: string | number | null): string {
  const numericWeight = normalizeFontWeight(weight);

  if (numericWeight <= 300) return FONT_FAMILIES.spaceGrotesk.light;
  if (numericWeight <= 400) return FONT_FAMILIES.spaceGrotesk.regular;
  if (numericWeight <= 500) return FONT_FAMILIES.spaceGrotesk.medium;
  if (numericWeight <= 600) return FONT_FAMILIES.spaceGrotesk.semibold;
  return FONT_FAMILIES.spaceGrotesk.bold;
}

export function isSpaceGroteskFamily(fontFamily?: string | null): boolean {
  if (!fontFamily) return false;
  const normalized = fontFamily.trim().toLowerCase();
  return SPACE_GROTESK_ALIASES.some((family) => family.trim().toLowerCase() === normalized);
}

export function shouldPreserveExplicitFontFamily(fontFamily?: string | null): boolean {
  if (!fontFamily) return false;
  if (isSpaceGroteskFamily(fontFamily)) return true;

  const normalized = fontFamily.trim().toLowerCase();
  if (!normalized) return false;

  // Keep monospace-style families intact for timers/codes where alignment matters.
  return /(mono|courier|menlo|consolas|sfmono)/.test(normalized);
}

let globalFontDefaultsApplied = false;

function withFontFamilyStyle(existingStyle: unknown, fontFamily: string) {
  if (Array.isArray(existingStyle)) {
    return [...existingStyle, { fontFamily }];
  }

  if (existingStyle) {
    return [existingStyle, { fontFamily }];
  }

  return { fontFamily };
}

function applyDefaultFontToComponent(component: any, fontFamily: string) {
  const currentDefaults = component?.defaultProps ?? {};
  component.defaultProps = {
    ...currentDefaults,
    style: withFontFamilyStyle(currentDefaults.style, fontFamily),
  };
}

function patchTextRender(component: any) {
  const originalRender = component?.render;
  if (typeof originalRender !== 'function') return;
  if (originalRender.__spaceGroteskPatched) return;

  const patchedRender = function patchedSpaceGroteskRender(props: any, ref: any) {
    if (!props) {
      return originalRender(props, ref);
    }

    const flattenedStyle = StyleSheet.flatten(props.style) ?? {};
    const explicitFontFamily =
      typeof flattenedStyle.fontFamily === 'string' && flattenedStyle.fontFamily.length
        ? flattenedStyle.fontFamily
        : undefined;

    if (explicitFontFamily && shouldPreserveExplicitFontFamily(explicitFontFamily)) {
      return originalRender(props, ref);
    }

    const resolvedFontFamily = resolveSpaceGroteskFontFamily(
      flattenedStyle.fontWeight ?? '400'
    );
    const { fontWeight, ...restStyle } = flattenedStyle;

    return originalRender(
      {
        ...props,
        style: {
          ...restStyle,
          fontFamily: resolvedFontFamily,
        },
      },
      ref
    );
  };

  patchedRender.__spaceGroteskPatched = true;
  component.render = patchedRender;
}

export function applyGlobalSpaceGroteskDefaults() {
  if (globalFontDefaultsApplied) return;
  globalFontDefaultsApplied = true;

  patchTextRender(RNText as any);
  patchTextRender(RNTextInput as any);
  applyDefaultFontToComponent(RNText as any, FONT_FAMILIES.spaceGrotesk.regular);
  applyDefaultFontToComponent(RNTextInput as any, FONT_FAMILIES.spaceGrotesk.regular);
}
