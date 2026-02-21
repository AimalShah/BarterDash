import React from 'react';
import { Text, View } from 'react-native';
import { StitchCard } from '@/components/design';
import { COLORS } from '@/constants/colors';

export default {
  title: 'Design/StitchCard',
  component: StitchCard,
};

export const Default = {
  render: () => (
    <StitchCard>
      <Text style={{ color: COLORS.primaryText, fontSize: 16, fontWeight: '700' }}>Product Card</Text>
      <Text style={{ color: COLORS.lightGrey, marginTop: 4 }}>This card style is used across the stitch UI.</Text>
    </StitchCard>
  ),
};

export const CustomPadding = {
  render: () => (
    <StitchCard style={{ padding: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: COLORS.primaryBlue, fontSize: 12, fontWeight: '700' }}>LIVE AUCTION</Text>
        <Text style={{ color: COLORS.primaryText, fontSize: 18, fontWeight: '700' }}>Jordan 1 High Retro</Text>
        <Text style={{ color: COLORS.lightGrey }}>Current bid: $420.00</Text>
      </View>
    </StitchCard>
  ),
};
