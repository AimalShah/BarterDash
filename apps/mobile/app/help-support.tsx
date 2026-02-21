import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, HelpCircle, LifeBuoy, Search, ShoppingCart, Store, Truck } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSectionTitle,
} from '@/components/design';

function SupportCategory({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Pressable style={styles.categoryCard}>
      <View style={styles.categoryIcon}>{icon}</View>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categorySubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function FaqRow({ title }: { title: string }) {
  return (
    <Pressable style={styles.faqRow}>
      <Text style={styles.faqTitle}>{title}</Text>
      <ArrowRight size={14} color={COLORS.lightGrey} />
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  return (
    <StitchPage contentStyle={{ paddingBottom: 120 }}>
      <StitchHeader title="Help Center" subtitle="24/7 support" onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={COLORS.lightGrey} style={styles.searchIcon} />
          <TextInput
            placeholder="Search FAQs, articles, and guides..."
            placeholderTextColor={COLORS.lightGrey}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.contentPad}>
        <StitchSectionTitle title="Support Categories" />
        <View style={styles.categoryGrid}>
          <SupportCategory
            title="Buying"
            subtitle="Bidding and secure payments"
            icon={<ShoppingCart size={22} color={COLORS.primaryBlue} />}
          />
          <SupportCategory
            title="Selling"
            subtitle="Listings and payouts"
            icon={<Store size={22} color={COLORS.primaryBlue} />}
          />
          <SupportCategory
            title="Shipping"
            subtitle="Tracking and delivery"
            icon={<Truck size={22} color={COLORS.primaryBlue} />}
          />
        </View>

        <View style={styles.sectionSpacing}>
          <StitchSectionTitle title="Trending Questions" />
          <StitchCard>
            <FaqRow title="How do I cancel an active trade?" />
            <FaqRow title="What is Barter Protection?" />
            <FaqRow title="How to resolve a dispute with a seller?" />
            <FaqRow title="Managing my subscription and payments" />
          </StitchCard>
        </View>

        <View style={styles.sectionSpacing}>
          <StitchCard style={styles.supportCard}>
            <View style={styles.supportIconWrap}>
              <LifeBuoy size={30} color="#FFFFFF" />
            </View>
            <Text style={styles.supportTitle}>Still need help?</Text>
            <Text style={styles.supportSubtitle}>
              Our support team is available around the clock to help with your barter experience.
            </Text>
            <StitchPrimaryButton label="Contact Support" onPress={() => Linking.openURL('mailto:support@barterdash.com')} />
          </StitchCard>
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInputWrap: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },
  searchInput: {
    paddingLeft: 38,
    paddingRight: 12,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryGrid: {
    marginTop: 8,
    gap: 10,
  },
  categoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  categoryIcon: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  categorySubtitle: {
    color: COLORS.lightGrey,
    fontSize: 13,
    marginTop: 3,
  },
  sectionSpacing: {
    marginTop: 18,
  },
  faqRow: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  supportCard: {
    alignItems: 'center',
    paddingVertical: 22,
    backgroundColor: '#F6FAFF',
  },
  supportIconWrap: {
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlue,
    marginBottom: 10,
  },
  supportTitle: {
    color: COLORS.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  supportSubtitle: {
    marginTop: 8,
    marginBottom: 14,
    color: COLORS.lightGrey,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
