import React from 'react';
import { View } from 'react-native';
import { StitchStat } from '@/components/design';

export default {
  title: 'Design/StitchStat',
  component: StitchStat,
  args: {
    label: 'Live',
    value: 4,
  },
};

export const Default = {
  render: (args: any) => <StitchStat {...args} />,
};

export const Group = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StitchStat label="Live" value={4} />
      <StitchStat label="Scheduled" value={12} />
      <StitchStat label="Viewers" value={182} />
    </View>
  ),
};
