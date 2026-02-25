import * as React from 'react';
import { StyleSheet, Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils';
import {
  resolveSpaceGroteskFontFamily,
  shouldPreserveExplicitFontFamily,
} from '@/constants/fonts';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
}

const textVariants = {
  h1: 'text-3xl leading-tight',
  h2: 'text-2xl leading-tight',
  h3: 'text-xl leading-snug',
  h4: 'text-lg leading-snug',
  body: 'text-base leading-relaxed',
  'body-sm': 'text-sm leading-relaxed',
  caption: 'text-xs leading-relaxed',
  label: 'text-sm leading-none',
};

const textColors = {
  primary: 'text-foreground',
  secondary: 'text-secondary',
  muted: 'text-muted',
  inverse: 'text-white',
  accent: 'text-accent',
};

const FONT_WEIGHT_CLASS_PATTERN =
  /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g;

function inferWeightFromClassName(
  className?: string
): 'normal' | 'medium' | 'semibold' | 'bold' | undefined {
  if (!className) return undefined;
  if (/\bfont-(?:black|extrabold|bold)\b/.test(className)) return 'bold';
  if (/\bfont-semibold\b/.test(className)) return 'semibold';
  if (/\bfont-medium\b/.test(className)) return 'medium';
  if (/\bfont-(?:normal|light|extralight|thin)\b/.test(className)) return 'normal';
  return undefined;
}

function stripFontWeightClasses(className?: string) {
  if (!className) return className;
  return className.replace(FONT_WEIGHT_CLASS_PATTERN, '').replace(/\s+/g, ' ').trim();
}

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  children,
  className,
  style,
  ...props
}: TextProps) {
  // Determine default weight based on variant
  const defaultWeight: Record<typeof variant, 'normal' | 'medium' | 'semibold' | 'bold'> = {
    h1: 'bold',
    h2: 'bold',
    h3: 'semibold',
    h4: 'semibold',
    body: 'normal',
    'body-sm': 'normal',
    caption: 'normal',
    label: 'medium',
  };

  const inferredWeight = inferWeightFromClassName(className);
  const resolvedWeight = weight || inferredWeight || defaultWeight[variant];
  const resolvedClassName = stripFontWeightClasses(className);

  const fontWeightToNumeric: Record<typeof resolvedWeight, string> = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const flattenedStyleFontFamily =
    typeof flattenedStyle.fontFamily === 'string' && flattenedStyle.fontFamily.length
      ? flattenedStyle.fontFamily
      : undefined;
  const flattenedStyleFontWeight = flattenedStyle.fontWeight;

  const keepExplicitFontFamily = shouldPreserveExplicitFontFamily(flattenedStyleFontFamily);
  const baseFontFamily =
    keepExplicitFontFamily && flattenedStyleFontFamily
      ? flattenedStyleFontFamily
      : resolveSpaceGroteskFontFamily(
          flattenedStyleFontWeight ?? fontWeightToNumeric[resolvedWeight]
        );

  const normalizedStyle = keepExplicitFontFamily && flattenedStyleFontFamily
    ? flattenedStyle
    : (() => {
        const { fontWeight, ...rest } = flattenedStyle;
        return rest;
      })();

  return (
    <RNText
      className={cn(
        textVariants[variant],
        textColors[color],
        resolvedClassName
      )}
      style={[{ fontFamily: baseFontFamily }, normalizedStyle]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Utility components for common text use cases
export function H1(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="h1" />;
}

export function H2(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="h2" />;
}

export function H3(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="h3" />;
}

export function H4(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="h4" />;
}

export function Body(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="body" />;
}

export function BodySmall(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="body-sm" />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="caption" />;
}

export function Label(props: Omit<TextProps, 'variant'>) {
  return <Text {...props} variant="label" />;
}
