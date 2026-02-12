import React from "react";
import { View, ScrollView, Text } from "react-native";
import { CreditCard } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import EmptyState from "../ui/EmptyState";
import LoadingSpinner from "../ui/LoadingSpinner";
import { usePaymentMethods } from "../../hooks/usePaymentMethods";

import PaymentMethodCard from "./PaymentMethodCard";
import AddPaymentMethodButton from "./AddPaymentMethodButton";

interface PaymentMethodManagerProps {
  userId: string;
  onMethodSelected?: (methodId: string) => void;
  showAddButton?: boolean;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  userId,
  onMethodSelected,
  showAddButton = true,
}) => {
  const {
    paymentMethods,
    loading,
    selectedMethodId,
    isAuthenticated,
    authChecked,
    loadError,
    isAddingMethod,
    selectMethod,
    setDefaultMethod,
    deleteMethod,
    addPaymentMethod,
    refreshMethods,
  } = usePaymentMethods(userId, onMethodSelected);

  if (loading || !authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <LoadingSpinner />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 14 }}>
          Loading payment methods...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyState
          icon={<CreditCard size={48} color={COLORS.textMuted} />}
          title="Sign in to view payment methods"
          description="Your saved payment methods are linked to your account."
        />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyState
          icon={<CreditCard size={48} color={COLORS.textMuted} />}
          title="Payment methods unavailable"
          description={loadError}
          actionLabel="Retry"
          onAction={refreshMethods}
        />
      </View>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyState
          icon={<CreditCard size={48} color={COLORS.textMuted} />}
          title="No Payment Methods"
          description="Add a payment method to make purchases quickly and securely"
          actionLabel={showAddButton ? (isAddingMethod ? "Adding..." : "Add Payment Method") : undefined}
          onAction={showAddButton ? addPaymentMethod : undefined}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={selectedMethodId === method.id}
              onSelect={() => selectMethod(method.id)}
              onSetDefault={() => setDefaultMethod(method.id)}
              onDelete={() => deleteMethod(method.id)}
            />
          ))}
        </View>

        {showAddButton && (
          <AddPaymentMethodButton
            isAdding={isAddingMethod}
            onPress={addPaymentMethod}
          />
        )}
      </ScrollView>
    </View>
  );
};
