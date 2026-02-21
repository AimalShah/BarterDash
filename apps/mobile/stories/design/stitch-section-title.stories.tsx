import React from 'react';
import { StitchSectionTitle } from '@/components/design';

export default {
  title: 'Design/StitchSectionTitle',
  component: StitchSectionTitle,
  args: {
    title: 'Trending Now',
  },
};

export const Default = {
  render: (args: any) => <StitchSectionTitle {...args} />,
};

export const WithAction = {
  args: {
    title: 'Live Auctions',
    actionLabel: 'See All',
  },
  render: (args: any) => <StitchSectionTitle {...args} onActionPress={() => undefined} />,
};
