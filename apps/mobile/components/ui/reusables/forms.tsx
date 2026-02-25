import React from 'react';
import { TextInput } from '@/components/ui/text-input';
import {
  Box,
  Button,
  ButtonText,
  Center,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from './primitives';
import { extractTextStyles, extractViewStyles, omitStyleProps } from './style-props';

type CompatProps = Record<string, any>;

export {
  Box,
  Button,
  ButtonText,
  Center,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
};

const InputBase = React.forwardRef<any, CompatProps>((props, ref) => {
  const style = extractViewStyles(props);
  const rest = omitStyleProps(props);
  return (
    <Box
      ref={ref}
      {...rest}
      className={`rounded-xl border border-border bg-card px-3 ${rest.className || ''}`}
      style={[style, rest.style]}
    />
  );
});

const InputFieldBase = React.forwardRef<any, CompatProps>((props, ref) => {
  const style = extractTextStyles(props);
  const rest = omitStyleProps(props);
  return (
    <TextInput
      ref={ref}
      {...rest}
      className={`min-h-12 flex-1 text-base text-foreground ${rest.className || ''}`}
      style={[style, rest.style]}
    />
  );
});

export const InputSlot = Box;
export const InputIcon = Box;
export const InputField = InputFieldBase;
export const Input = Object.assign(InputBase, {
  Field: InputFieldBase,
  Slot: InputSlot,
  Icon: InputIcon,
});

const TextareaInputBase = React.forwardRef<any, CompatProps>((props, ref) => {
  return <InputFieldBase ref={ref} multiline textAlignVertical="top" {...props} />;
});

export const TextareaInput = TextareaInputBase;
export const Textarea = Object.assign(InputBase, { Input: TextareaInputBase });

const FormControlLabelBase = HStack;
export const FormControlLabelText = Text;
export const FormControlLabel = Object.assign(FormControlLabelBase, {
  Text: FormControlLabelText,
});

const FormControlErrorBase = HStack;
export const FormControlErrorText = Text;
export const FormControlError = Object.assign(FormControlErrorBase, {
  Text: FormControlErrorText,
});

export const FormControl = Object.assign(Box, {
  Label: FormControlLabel,
  Error: FormControlError,
});

export const SelectTrigger = Pressable;
export const SelectInput = Text;
export const SelectPortal = Box;
export const SelectBackdrop = Box;
export const SelectContent = Box;
export const SelectDragIndicator = Box;
export const SelectDragIndicatorWrapper = Center;
export const SelectItem = Pressable;
export const Select = Object.assign(Box, {
  Trigger: SelectTrigger,
  Input: SelectInput,
  Portal: SelectPortal,
  Backdrop: SelectBackdrop,
  Content: SelectContent,
  DragIndicator: SelectDragIndicator,
  DragIndicatorWrapper: SelectDragIndicatorWrapper,
  Item: SelectItem,
});

export const RadioIndicator = Center;
export const RadioIcon = Box;
export const RadioLabel = Text;
export const Radio = Object.assign(Pressable, {
  Indicator: RadioIndicator,
  Icon: RadioIcon,
  Label: RadioLabel,
});
export const RadioGroup = VStack;

export const CheckboxIndicator = Center;
export const CheckboxIcon = Box;
export const Checkbox = Object.assign(Pressable, {
  Indicator: CheckboxIndicator,
  Icon: CheckboxIcon,
});

export const Icon = ({ as: Component, size = 18, color = '#2F354E', ...props }: CompatProps) => {
  if (!Component) return null;
  return <Component size={size} color={color} {...props} />;
};

export const ButtonIcon = Icon;
