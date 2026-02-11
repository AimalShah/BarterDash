import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import LoadingSpinner from "../ui/LoadingSpinner";

interface AddPaymentMethodButtonProps {
  isAdding: boolean;
  onPress: () => void;
}

export default function AddPaymentMethodButton({ isAdding, onPress }: AddPaymentMethodButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isAdding}
      style={styles.container}
    >
      {isAdding ? (
        <>
          <LoadingSpinner size="small" />
          <Text style={styles.addingText}>Adding payment method...</Text>
        </>
      ) : (
        <>
          <Plus size={24} color={COLORS.textSecondary} />
          <Text style={styles.text}>Add New Payment Method</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.darkBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  addingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
