import * as React from 'react';
import {
  TextInput,
  View,
  TextInputProps as RNTextInputProps,
  Pressable,
} from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from './text';
import { Ionicons } from '@expo/vector-icons';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerClassName,
  className,
  placeholderTextColor = '#9C9AA6',
  ...props
}: InputProps) {
  const [isSecure, setIsSecure] = React.useState(secureTextEntry);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text variant="label" className="mb-1.5 text-foreground">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center rounded-xl border bg-white px-3',
          isFocused ? 'border-primary' : 'border-border',
          error && 'border-error',
          className
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className="flex-1 py-3 text-base text-foreground"
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setIsSecure(!isSecure)}
            className="ml-2 p-1"
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9C9AA6"
            />
          </Pressable>
        )}
        {rightIcon && !secureTextEntry && (
          <View className="ml-2">{rightIcon}</View>
        )}
      </View>
      {(error || helper) && (
        <Text
          variant="caption"
          color={error ? 'primary' : 'muted'}
          className={cn('mt-1.5', error && 'text-error')}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}
