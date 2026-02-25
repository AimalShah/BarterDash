import * as React from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import {
  resolveSpaceGroteskFontFamily,
  shouldPreserveExplicitFontFamily,
} from '@/constants/fonts';

export type TextInputProps = RNTextInputProps;

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref
) {
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const explicitFontFamily =
    typeof flattenedStyle.fontFamily === 'string' && flattenedStyle.fontFamily.length
      ? flattenedStyle.fontFamily
      : undefined;
  const keepExplicitFontFamily = shouldPreserveExplicitFontFamily(explicitFontFamily);
  const resolvedFontFamily =
    keepExplicitFontFamily && explicitFontFamily
      ? explicitFontFamily
      : resolveSpaceGroteskFontFamily(flattenedStyle.fontWeight ?? '400');

  const normalizedStyle = keepExplicitFontFamily
    ? flattenedStyle
    : (() => {
        const { fontWeight, ...rest } = flattenedStyle;
        return rest;
      })();

  return <RNTextInput ref={ref} {...props} style={[{ fontFamily: resolvedFontFamily }, normalizedStyle]} />;
});
