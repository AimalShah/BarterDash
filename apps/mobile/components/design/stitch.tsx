import React, { ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface StitchPageProps {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

interface StitchHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightNode?: ReactNode;
}

interface StitchSearchBarProps {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

interface StitchSectionTitleProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

interface StitchButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface StitchChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function StitchPage({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
}: StitchPageProps) {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      {scroll ? (
        <ScrollView
          style={styles.page}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.page, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function StitchHeader({ title, subtitle, onBack, rightNode }: StitchHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        {onBack ? (
          <Pressable style={styles.iconButton} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>

        {rightNode ? <View style={styles.headerRight}>{rightNode}</View> : <View style={styles.headerSpacer} />}
      </View>
    </View>
  );
}

export function StitchSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFilterPress,
}: StitchSearchBarProps) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInputWrap}>
        <Search size={18} color={COLORS.lightGrey} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.lightGrey}
          style={styles.searchInput}
        />
      </View>
      {onFilterPress ? (
        <Pressable style={styles.filterButton} onPress={onFilterPress}>
          <SlidersHorizontal size={18} color={COLORS.primaryBlue} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function StitchSectionTitle({ title, actionLabel, onActionPress }: StitchSectionTitleProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StitchPrimaryButton({ label, onPress, disabled }: StitchButtonProps) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled ? styles.buttonDisabled : undefined]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function StitchSecondaryButton({ label, onPress, disabled }: StitchButtonProps) {
  return (
    <Pressable
      style={[styles.secondaryButton, disabled ? styles.buttonDisabled : undefined]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function StitchChip({ label, active, onPress }: StitchChipProps) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : undefined]} onPress={onPress}>
      <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>{label}</Text>
    </Pressable>
  );
}

export function StitchCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StitchStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StitchEmpty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  headerContainer: {
    backgroundColor: '#FFFFFFF0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 0,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    height: 40,
    width: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  filterButton: {
    height: 46,
    width: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionAction: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipActive: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: COLORS.primaryBlue,
  },
  chipLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.primaryBlue,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  emptyWrap: {
    paddingVertical: 64,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
