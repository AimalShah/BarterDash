import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

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
  const { horizontalPadding, isTablet, scaledFont } = useResponsiveLayout();
  if (!isSeller) return null;
  const cardSize = isTablet ? 124 : 110;
  const iconSize = isTablet ? 52 : 48;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.sectionTitle,
          {
            paddingHorizontal: horizontalPadding,
            fontSize: scaledFont(12, 0.95, 1.1),
          },
        ]}
      >
        SELLER TOOLS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            activeOpacity={0.8}
            style={[
              styles.actionCard,
              { width: cardSize, height: cardSize },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: isTablet ? 14 : 12,
                },
                { backgroundColor: action.color || COLORS.primaryGold },
              ]}
            >
              {action.icon}
            </View>
            <Text
              style={[
                styles.actionLabel,
                { fontSize: scaledFont(12, 0.95, 1.1) },
              ]}
              numberOfLines={1}
            >
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
    color: COLORS.textSecondary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 10, // For shadow
  },
  actionCard: {
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
