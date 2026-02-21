import React from 'react';
import { StitchEmpty } from '@/components/design';

export default {
  title: 'Design/StitchEmpty',
  component: StitchEmpty,
  args: {
    title: 'No Results',
    subtitle: 'Try a different search or check back later.',
  },
};

export const Default = {
  render: (args: any) => <StitchEmpty {...args} />,
};

export const TitleOnly = {
  args: {
    title: 'Nothing Here Yet',
    subtitle: undefined,
  },
  render: (args: any) => <StitchEmpty {...args} />,
};
