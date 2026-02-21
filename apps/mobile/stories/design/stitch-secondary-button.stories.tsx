import React from 'react';
import { StitchSecondaryButton } from '@/components/design';

export default {
  title: 'Design/StitchSecondaryButton',
  component: StitchSecondaryButton,
  args: {
    label: 'Cancel Stream',
  },
};

export const Default = {
  render: (args: any) => <StitchSecondaryButton {...args} onPress={() => undefined} />,
};

export const Disabled = {
  args: {
    label: 'Unavailable',
    disabled: true,
  },
  render: (args: any) => <StitchSecondaryButton {...args} onPress={() => undefined} />,
};
