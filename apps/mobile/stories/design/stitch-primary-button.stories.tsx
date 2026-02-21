import React from 'react';
import { StitchPrimaryButton } from '@/components/design';

export default {
  title: 'Design/StitchPrimaryButton',
  component: StitchPrimaryButton,
  args: {
    label: 'Confirm Purchase',
  },
};

export const Default = {
  render: (args: any) => <StitchPrimaryButton {...args} onPress={() => undefined} />,
};

export const Disabled = {
  args: {
    label: 'Processing...',
    disabled: true,
  },
  render: (args: any) => <StitchPrimaryButton {...args} onPress={() => undefined} />,
};
