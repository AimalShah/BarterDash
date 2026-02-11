import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../../constants/colors";

interface QuickActionProps {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}

interface QuickActionsProps {
  isSeller: boolean;
  actions: {
    icon: any;
    label: string;
    color: string;
    onPress: () => void;
  }[];
}

export const QuickActions = ({ isSeller, actions }: QuickActionsProps) => {
  if (!isSeller) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SELLER TOOLS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            activeOpacity={0.8}
            style={styles.actionCard}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: action.color || COLORS.primaryGold },
              ]}
            >
              {action.icon}
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 10, // For shadow
  },
  actionCard: {
    width: 110,
    height: 110,
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // Inner shadow effect simulated with border
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    paddingHorizontal: 8,
  },
});
