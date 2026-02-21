import * as React from 'react';
import { View, Image } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';

export interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

export function Avatar({
  src,
  fallback = '?',
  size = 'md',
  className,
}: AvatarProps) {
  const initials = fallback
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      className={cn(
        'rounded-full bg-primary-soft items-center justify-center overflow-hidden',
        avatarSizes[size],
        className
      )}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text
          className={cn(
            textSizes[size],
            'font-semibold text-primary'
          )}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
