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

export const HomeHeader = () => {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>BarterDash</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Messages Button */}
        <TouchableOpacity
          onPress={handleMessagesPress}
          style={styles.button}
          activeOpacity={0.8}
        >
          <MessageCircle size={24} color={COLORS.textPrimary} />
          {unreadMessagesCount > 0 && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          )}
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity
          onPress={handleNotificationsPress}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Bell size={24} color={COLORS.textPrimary} />
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
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
    width: 48,
    height: 48,
    borderRadius: 16,
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
