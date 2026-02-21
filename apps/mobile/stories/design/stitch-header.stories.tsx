import React from 'react';
import { Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { StitchHeader } from '@/components/design';

export default {
  title: 'Design/StitchHeader',
  component: StitchHeader,
  args: {
    title: 'BarterDash',
    subtitle: 'Live marketplace',
  },
};

export const Default = {
  render: (args: any) => <StitchHeader {...args} />,
};

export const WithBackButton = {
  args: {
    title: 'Settings',
    subtitle: 'Manage your account',
  },
  render: (args: any) => <StitchHeader {...args} onBack={() => undefined} />,
};

export const WithRightAction = {
  args: {
    title: 'Home Feed',
    subtitle: 'Trending now',
  },
  render: (args: any) => (
    <StitchHeader
      {...args}
      rightNode={
        <Pressable onPress={() => undefined} style={{ padding: 8 }}>
          <Bell size={18} color="#2563EB" />
        </Pressable>
      }
    />
  ),
};
