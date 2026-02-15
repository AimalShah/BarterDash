import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { CreditCard } from "lucide-react-native";
import { isFeatureEnabled } from "../../lib/config/featureFlags";
import { COLORS } from "../../constants/colors";

/**
 * Payment Notice Component
 * Shows a notice when wallet payments (Apple Pay/Google Pay) are disabled
 * Helps users understand payment options in beta
 */
export const PaymentNotice: React.FC = () => {
  const isApplePayDisabled = Platform.OS === "ios" && !isFeatureEnabled("applePay");
  const isGooglePayDisabled = Platform.OS === "android" && !isFeatureEnabled("googlePay");
  
  if (!isApplePayDisabled && !isGooglePayDisabled) {
    return null;
  }

  const walletName = Platform.OS === "ios" ? "Apple Pay" : "Google Pay";

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CreditCard size={20} color={COLORS.textSecondary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          💳 Credit & Debit Cards
        </Text>
        <Text style={styles.subtitle}>
          {walletName} coming soon! Use your card for now.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

export default PaymentNotice;
