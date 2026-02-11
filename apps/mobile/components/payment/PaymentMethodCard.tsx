import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CreditCard, Check, Shield, Trash2 } from "lucide-react-native";
import { Card, CardContent } from "../ui/Card";
import { COLORS } from "../../constants/colors";
import { PaymentMethod } from "../../lib/api/services/payments";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}

const formatExpiryDate = (month?: number, year?: number) => {
  if (!month || !year) return "";
  return `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
};

export default function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <Card
        style={{
          borderColor: isSelected ? COLORS.primaryGold : COLORS.darkBorder,
          borderWidth: isSelected ? 2 : 1,
        }}
      >
        <CardContent>
          <View style={styles.container}>
            <View style={styles.leftSection}>
              <CreditCard size={20} color={COLORS.primaryGold} />
              <View style={styles.info}>
                <View style={styles.brandRow}>
                  <Text style={styles.brandText}>
                    {method.brand.toUpperCase()} •••• {method.last4}
                  </Text>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                {method.expiryMonth && method.expiryYear && (
                  <Text style={styles.expiryText}>
                    Expires {formatExpiryDate(method.expiryMonth, method.expiryYear)}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {isSelected && <Check size={20} color={COLORS.primaryGold} />}

              {!method.isDefault && (
                <TouchableOpacity onPress={onSetDefault} style={styles.actionButton}>
                  <Shield size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Trash2 size={16} color={COLORS.errorRed} />
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  defaultBadge: {
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    color: COLORS.luxuryBlack,
    fontSize: 10,
    fontWeight: "700",
  },
  expiryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.luxuryBlackLighter,
  },
});
