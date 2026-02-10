import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Settings, RefreshCw, BadgeCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";

interface ProfileHeaderProps {
  isSeller: boolean;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verificationStatus?: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onSettings: () => void;
}

export const ProfileHeader = ({
  isSeller,
  username,
  displayName,
  avatarUrl,
  verificationStatus,
  refreshing,
  onRefresh,
  onSettings,
}: ProfileHeaderProps) => {
  return (
    <View style={styles.container}>
      {/* Dynamic Header Background */}
      <View style={styles.headerBackgroundContainer}>
        <LinearGradient
          colors={[COLORS.luxuryBlackLight, COLORS.luxuryBlack]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={styles.watermarkText}>
            {isSeller ? 'BARTERDASH STUDIO' : 'BARTERDASH'}
          </Text>
        </View>
        {/* Subtle Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.profileInfoContainer}>
        <View style={styles.rowBetween}>
          {/* Avatar Container */}
          <View style={[styles.avatarContainer, isSeller && styles.avatarContainerSeller]}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarPlaceholder}>
                {username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Header Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <RefreshCw
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSettings}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Settings size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>
              {displayName}
            </Text>
            {isSeller && <BadgeCheck size={22} color={COLORS.primaryGold} />}
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.username}>
              @{username}
            </Text>
            <View style={styles.dotSeparator} />
            <Text style={[styles.roleText, isSeller ? styles.roleSeller : styles.roleMember]}>
              {isSeller ? 'Verified Seller' : 'Premium Member'}
            </Text>
          </View>

          {verificationStatus && (
            <View style={styles.detailsRow}>
              <Text style={styles.verificationLabel}>
                Verification
              </Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.verificationStatus}>
                {verificationStatus}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.luxuryBlack,
    paddingBottom: 20,
  },
  headerBackgroundContainer: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.luxuryBlackLight,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 48,
    letterSpacing: -2,
    opacity: 0.05,
    textTransform: 'uppercase',
    width: '120%',
    textAlign: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  profileInfoContainer: {
    paddingHorizontal: 24,
    marginTop: -50,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    height: 100,
    width: 100,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 3,
    borderColor: COLORS.darkBorder,
    borderRadius: 50, // Circle
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainerSeller: {
    borderColor: COLORS.primaryGold,
    shadowColor: COLORS.primaryGold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 36,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  iconButton: {
    height: 44,
    width: 44,
    backgroundColor: 'rgba(26, 26, 26, 0.8)', // Semi-transparent
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  userInfo: {
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleSeller: {
    color: COLORS.primaryGold,
  },
  roleMember: {
    color: COLORS.textMuted,
  },
  verificationLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  verificationStatus: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
