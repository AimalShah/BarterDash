import * as React from 'react';
import { View, DimensionValue } from 'react-native';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  className?: string;
  circle?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 16,
  className,
  circle = false,
}: SkeletonProps) {
  return (
    <View
      className={cn(
        'bg-muted/50 animate-pulse',
        circle && 'rounded-full',
        !circle && 'rounded-md',
        className
      )}
      style={{ width, height }}
    />
  );
}

// Skeleton text for content loading
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <View className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '75%' : '100%'}
          height={16}
        />
      ))}
    </View>
  );
}

// Skeleton card for card loading states
interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <View className={cn('bg-white rounded-xl p-4 space-y-3', className)}>
      <Skeleton width="100%" height={120} />
      <Skeleton width="75%" height={20} />
      <Skeleton width="50%" height={16} />
    </View>
  );
}
