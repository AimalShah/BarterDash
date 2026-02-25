import React from 'react';
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  Image as RNImage,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable as RNPressable,
  RefreshControl,
  ScrollView as RNScrollView,
  StatusBar,
  Switch as RNSwitch,
  Text as RNText,
  TouchableOpacity,
  View as RNView,
} from 'react-native';
import { cn } from '@/lib/utils';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Button as UiButton } from '@/components/ui/button';
import { Text as UiText } from '@/components/ui/text';
import { resolveSpaceGroteskFontFamily } from '@/constants/fonts';
import { extractTextStyles, extractViewStyles, omitStyleProps } from './style-props';

type CompatProps = Record<string, any>;

function mergeClassName(base: string | undefined, next: string | undefined) {
  return cn(base, next);
}

function viewFactory(
  Component: React.ComponentType<any>,
  defaultClassName?: string,
  defaultStyle?: Record<string, unknown>
) {
  return React.forwardRef<any, CompatProps>((props, ref) => {
    const style = extractViewStyles(props);
    const rest = omitStyleProps(props);
    const mergedStyle = [defaultStyle, style, rest.style].filter(Boolean);

    return (
      <Component
        ref={ref}
        {...rest}
        className={mergeClassName(defaultClassName, rest.className)}
        style={mergedStyle}
      />
    );
  });
}

function textFactory(defaultClassName?: string) {
  return React.forwardRef<any, CompatProps>((props, ref) => {
    const style = extractTextStyles(props);
    const rest = omitStyleProps(props);
    const fontFamily =
      typeof style.fontFamily === 'string' && style.fontFamily.length
        ? style.fontFamily
        : resolveSpaceGroteskFontFamily(style.fontWeight);

    return (
      <RNText
        ref={ref}
        {...rest}
        className={mergeClassName(defaultClassName, rest.className)}
        style={[{ fontFamily }, style, rest.style]}
      />
    );
  });
}

export const Box = viewFactory(RNView);
export const View = Box;
export const VStack = viewFactory(RNView, undefined, { flexDirection: 'column' });
export const HStack = viewFactory(RNView, undefined, { flexDirection: 'row' });
export const Center = viewFactory(RNView, undefined, {
  alignItems: 'center',
  justifyContent: 'center',
});

export const Text = React.forwardRef<any, CompatProps>((props, _ref) => {
  const style = extractTextStyles(props);
  const rest = omitStyleProps(props);
  return (
    <UiText {...rest} className={rest.className} style={[style, rest.style]}>
      {rest.children}
    </UiText>
  );
});

export const Heading = React.forwardRef<any, CompatProps>((props, _ref) => {
  const style = extractTextStyles(props);
  const rest = omitStyleProps(props);
  return (
    <UiText
      variant="h3"
      weight="bold"
      {...rest}
      className={rest.className}
      style={[style, rest.style]}
    >
      {rest.children}
    </UiText>
  );
});

export const Pressable = React.forwardRef<any, CompatProps>((props, ref) => {
  const style = extractViewStyles(props);
  const rest = omitStyleProps(props);
  const isDisabled = rest.isDisabled ?? rest.disabled;
  return (
    <RNPressable
      ref={ref}
      {...rest}
      disabled={isDisabled}
      className={rest.className}
      style={[style, rest.style]}
    />
  );
});

export const ScrollView = React.forwardRef<any, CompatProps>((props, ref) => {
  const style = extractViewStyles(props);
  const rest = omitStyleProps(props);
  return <RNScrollView ref={ref} {...rest} className={rest.className} style={[style, rest.style]} />;
});

export const FlatList = RNFlatList as unknown as React.ComponentType<any>;
export const Image = RNImage as unknown as React.ComponentType<any>;
const SwitchBase = RNSwitch as unknown as React.ComponentType<any>;
const SwitchLabel = textFactory('text-sm text-secondary');
export const Switch = Object.assign(SwitchBase, {
  Label: SwitchLabel,
});
export const KeyboardAvoidingView = RNKeyboardAvoidingView as unknown as React.ComponentType<any>;
export const Modal = RNModal as unknown as React.ComponentType<any>;

export const Spinner = React.forwardRef<any, CompatProps>((props, ref) => {
  const rest = omitStyleProps(props);
  const color = rest.color ?? '#6391F2';
  return <ActivityIndicator ref={ref} {...rest} color={color} />;
});

export const Activity = ActivityIndicator;
export { ActivityIndicator, RefreshControl, StatusBar, Platform, TouchableOpacity };

export const Divider = viewFactory(RNView, undefined, {
  borderBottomWidth: 1,
  borderColor: '#D5DBE9',
});

export const Alert = textFactory('text-error');

export const Badge = React.forwardRef<any, CompatProps>((props, _ref) => {
  const rest = omitStyleProps(props);
  return (
    <UiBadge {...rest} className={rest.className}>
      {rest.children}
    </UiBadge>
  );
});

export const BadgeText = React.forwardRef<any, CompatProps>((props, _ref) => {
  const style = extractTextStyles(props);
  const rest = omitStyleProps(props);
  return (
    <UiText {...rest} className={rest.className} style={[style, rest.style]}>
      {rest.children}
    </UiText>
  );
});

export const Button = React.forwardRef<any, CompatProps>((props, _ref) => {
  const style = extractViewStyles(props);
  const rest = omitStyleProps(props);
  const isDisabled = Boolean(rest.isDisabled ?? rest.disabled);
  const variant =
    rest.variant === 'outline' || rest.variant === 'ghost' || rest.variant === 'secondary'
      ? rest.variant
      : 'primary';
  const size = rest.size === 'sm' || rest.size === 'lg' ? rest.size : 'md';
  const onPress = rest.onPress as (() => void) | undefined;

  return (
    <UiButton
      onPress={onPress || (() => undefined)}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={rest.className}
      style={[style, rest.style]}
    >
      {rest.children}
    </UiButton>
  );
});

export const ButtonText = React.forwardRef<any, CompatProps>((props, _ref) => {
  const style = extractTextStyles(props);
  const rest = omitStyleProps(props);
  return (
    <UiText {...rest} className={cn('text-white', rest.className)} style={[style, rest.style]}>
      {rest.children}
    </UiText>
  );
});
export const ButtonSpinner = ActivityIndicator as unknown as React.ComponentType<any>;

export const GluestackUIProvider = ({
  children,
}: {
  children: React.ReactNode;
  config?: unknown;
}) => <>{children}</>;
