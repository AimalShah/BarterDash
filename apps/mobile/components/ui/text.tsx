import * as React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils';

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
  label: 'text-sm font-medium leading-none',
};

const textColors = {
  primary: 'text-foreground',
  secondary: 'text-secondary',
  muted: 'text-muted',
  inverse: 'text-white',
  accent: 'text-accent',
};

const textWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  children,
  className,
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

  const resolvedWeight = weight || defaultWeight[variant];

  return (
    <RNText
      className={cn(
        textVariants[variant],
        textColors[color],
        textWeights[resolvedWeight],
        className
      )}
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
