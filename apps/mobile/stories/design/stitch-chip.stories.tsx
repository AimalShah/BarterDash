import React from 'react';
import { View } from 'react-native';
import { StitchChip } from '@/components/design';

export default {
  title: 'Design/StitchChip',
  component: StitchChip,
  args: {
    label: 'Trading Cards',
    active: false,
  },
};

export const Default = {
  render: (args: any) => <StitchChip {...args} onPress={() => undefined} />,
};

export const Active = {
  args: {
    label: 'Sneakers',
    active: true,
  },
  render: (args: any) => <StitchChip {...args} onPress={() => undefined} />,
};

export const Group = {
  render: () => (
    <View style={{ flexDirection: 'row' }}>
      <StitchChip label="All" active onPress={() => undefined} />
      <StitchChip label="Cards" onPress={() => undefined} />
      <StitchChip label="Kicks" onPress={() => undefined} />
      <StitchChip label="Collectibles" onPress={() => undefined} />
    </View>
  ),
};
