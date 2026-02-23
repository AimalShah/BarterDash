import * as React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { cn } from '@/lib/utils';
import { Text, type TextProps } from './text';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const cardVariants = {
  default: 'bg-white',
  elevated: 'bg-white',
  outline: 'bg-transparent border border-border',
};

const styles = StyleSheet.create({
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});

const cardPadding = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  children,
  className,
  padding = 'md',
  style,
  ...props
}: CardProps) {
  const variantStyle = variant === 'elevated' ? styles.elevated : undefined;

  return (
    <View
      style={[variantStyle, style]}
      className={cn(
        'rounded-xl',
        cardVariants[variant],
        cardPadding[padding],
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// Card sub-components for structured layouts
interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardHeader({ children, className, style, ...props }: CardHeaderProps) {
  return (
    <View style={style} className={cn('mb-3', className)} {...props}>
      {children}
    </View>
  );
}

interface CardContentProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardContent({ children, className, style, ...props }: CardContentProps) {
  return (
    <View style={style} className={cn('', className)} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardFooter({ children, className, style, ...props }: CardFooterProps) {
  return (
    <View
      style={style}
      className={cn('mt-3 pt-3 border-t border-border', className)}
      {...props}
    >
      {children}
    </View>
  );
}

type CardTextProps = Omit<TextProps, 'children'> & {
  children: React.ReactNode;
};

export function CardTitle({ children, className, ...props }: CardTextProps) {
  return (
    <Text variant="h4" className={cn('text-foreground', className)} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className, ...props }: CardTextProps) {
  return (
    <Text variant="caption" color="muted" className={cn('mt-1', className)} {...props}>
      {children}
    </Text>
  );
}
