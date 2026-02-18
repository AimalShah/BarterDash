import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Bell, MessageCircle } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export const HomeHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isTablet, scaledFont } = useResponsiveLayout();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { unreadMessagesCount } = useUnreadMessages(user?.id);

  const handleNotificationsPress = () => {
    router.push("/notifications");
  };

  const handleMessagesPress = () => {
    router.push("/(tabs)/inbox");
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(insets.top + 8, 16),
          paddingBottom: isTablet ? 20 : 16,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <Text style={[styles.title, { fontSize: scaledFont(26, 0.95, 1.15) }]}>
          BarterDash
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Messages Button */}
        <TouchableOpacity
          onPress={handleMessagesPress}
          style={[
            styles.button,
            {
              width: isTablet ? 52 : 48,
              height: isTablet ? 52 : 48,
              borderRadius: isTablet ? 18 : 16,
            },
          ]}
          activeOpacity={0.8}
        >
          <MessageCircle size={isTablet ? 26 : 24} color={COLORS.textPrimary} />
          {unreadMessagesCount > 0 && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          )}
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity
          onPress={handleNotificationsPress}
          style={[
            styles.button,
            {
              width: isTablet ? 52 : 48,
              height: isTablet ? 52 : 48,
              borderRadius: isTablet ? 18 : 16,
            },
          ]}
          activeOpacity={0.8}
        >
          <Bell size={isTablet ? 26 : 24} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.luxuryBlack,
  },
  leftSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primaryGold,
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryGold,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
});

export default HomeHeader;
