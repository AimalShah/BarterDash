import React from "react";
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { isFeatureEnabled } from "../../lib/config/featureFlags";
import { COLORS } from "../../constants/colors";

interface BetaBadgeProps {
  size?: "small" | "medium" | "large";
  style?: any;
}

/**
 * Beta Badge Component
 * Displays a BETA indicator when the app is in beta mode
 * Automatically hides when beta mode is disabled
 */
export const BetaBadge: React.FC<BetaBadgeProps> = ({ 
  size = "medium",
  style 
}) => {
  if (!isFeatureEnabled("betaMode")) {
    return null;
  }

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 12 },
    large: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 14 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize },
        ]}
      >
        BETA
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.warningAmber,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  text: {
    color: COLORS.luxuryBlack,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default BetaBadge;
