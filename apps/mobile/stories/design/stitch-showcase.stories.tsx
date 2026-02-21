import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  StitchCard,
  StitchChip,
  StitchEmpty,
  StitchHeader,
  StitchPrimaryButton,
  StitchSearchBar,
  StitchSectionTitle,
  StitchStat,
} from '@/components/design';
import { COLORS } from '@/constants/colors';

export default {
  title: 'Design/Stitch Showcase',
};

export const HomeFeedComposition = {
  render: () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <StitchHeader title="BarterDash" subtitle="Live marketplace" />

      <View style={{ marginTop: 12 }}>
        <StitchSearchBar
          value=""
          onChangeText={() => undefined}
          placeholder="Search cards, kicks, sellers..."
          onFilterPress={() => undefined}
        />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <StitchChip label="All Live" active onPress={() => undefined} />
        <StitchChip label="Cards" onPress={() => undefined} />
        <StitchChip label="Sneakers" onPress={() => undefined} />
      </View>

      <View style={{ marginTop: 16 }}>
        <StitchSectionTitle title="Seller Snapshot" actionLabel="Manage" onActionPress={() => undefined} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <StitchStat label="Live" value={2} />
          <StitchStat label="Scheduled" value={7} />
          <StitchStat label="Viewers" value={96} />
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <StitchCard>
          <Text style={{ color: COLORS.primaryText, fontSize: 16, fontWeight: '700' }}>Featured Auction</Text>
          <Text style={{ color: COLORS.lightGrey, marginTop: 6 }}>
            Jordan 4 SB Pine Green with original box and verified condition.
          </Text>
          <Text style={{ color: COLORS.primaryBlue, marginTop: 10, fontWeight: '700' }}>$420.00 current bid</Text>
        </StitchCard>
      </View>

      <View style={{ marginTop: 16 }}>
        <StitchPrimaryButton label="Join Live Stream" onPress={() => undefined} />
      </View>

      <View style={{ marginTop: 20 }}>
        <StitchEmpty title="No More Suggestions" subtitle="You are all caught up for now." />
      </View>
    </ScrollView>
  ),
};
