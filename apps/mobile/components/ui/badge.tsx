import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
};

const badgeSizes = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <View
      className={cn(
        'rounded-full items-center justify-center',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      <Text className={cn(textSizes[size], 'font-medium')}>
        {children}
      </Text>
    </View>
  );
}
