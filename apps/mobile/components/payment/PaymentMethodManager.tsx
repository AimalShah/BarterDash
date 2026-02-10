import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Shield,
} from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { COLORS } from '../../constants/colors';
import { Card, CardContent } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { paymentsService, PaymentMethod } from '../../lib/api/services/payments';
import { supabase } from '../../lib/supabase';

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    initialize();
  }, [userId]);

  const checkSupabaseSession = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setAuthChecked(true);
      return authenticated;
    } catch (error) {
      console.error('Error checking Supabase session:', error);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return false;
    }
  };

  const initialize = async () => {
    const authenticated = await checkSupabaseSession();
    if (authenticated) {
      await loadPaymentMethods();
    } else {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const methods = await paymentsService.getPaymentMethods();
      setPaymentMethods(methods);

      const defaultMethod = methods.find(method => method.isDefault);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
        onMethodSelected?.(defaultMethod.id);
      } else if (methods.length === 0) {
        setSelectedMethodId(null);
        onMethodSelected?.('');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setLoadError('Failed to load payment methods. Please try again.');
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = async (methodId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to select a payment method');
      return;
    }

    setSelectedMethodId(methodId);
    onMethodSelected?.(methodId);
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await paymentsService.setDefaultPaymentMethod(methodId);

      setPaymentMethods(methods =>
        methods.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );

      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return;

    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to delete the ${method.brand.toUpperCase()} card ending in ${method.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteMethod(methodId),
        },
      ]
    );
  };

  const confirmDeleteMethod = async (methodId: string) => {
    try {
      await paymentsService.deletePaymentMethod(methodId);

      setPaymentMethods(methods => methods.filter(method => method.id !== methodId));

      if (selectedMethodId === methodId) {
        const remainingMethods = paymentMethods.filter(method => method.id !== methodId);
        const newDefault = remainingMethods.find(method => method.isDefault) || remainingMethods[0];
        if (newDefault) {
          setSelectedMethodId(newDefault.id);
          onMethodSelected?.(newDefault.id);
        } else {
          setSelectedMethodId(null);
          onMethodSelected?.('');
        }
      }

      Alert.alert('Success', 'Payment method deleted');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      Alert.alert('Error', 'Failed to delete payment method');
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to add a payment method');
      return;
    }

    if (isAddingMethod) return;

    try {
      setIsAddingMethod(true);

      const setupIntent = await paymentsService.createSetupIntent({
        setAsDefault: paymentMethods.length === 0,
      });

      const { error: initError } = await initPaymentSheet({
        customerId: setupIntent.customer,
        customerEphemeralKeySecret: setupIntent.ephemeralKey,
        setupIntentClientSecret: setupIntent.setupIntent,
        merchantDisplayName: 'BarterDash',
        returnURL: 'barterdash://payment-return',
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          Alert.alert('Payment Method Cancelled', 'No payment method was added.');
          return;
        }
        throw new Error(presentError.message);
      }

      Alert.alert(
        'Payment Method Added',
        'Your payment method was added successfully.',
      );

      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      Alert.alert(
        'Unable to Add Method',
        error?.message || 'Failed to add payment method. Please try again.',
      );
    } finally {
      setIsAddingMethod(false);
    }
  };

  const getCardIcon = (brand: string) => {
    return <CreditCard size={20} color={COLORS.primaryGold} />;
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (loading || !authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
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
          onAction={loadPaymentMethods}
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
          onAction={showAddButton ? handleAddPaymentMethod : undefined}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => handleMethodSelect(method.id)}
              activeOpacity={0.7}
            >
              <Card
                style={{
                  borderColor: selectedMethodId === method.id ? COLORS.primaryGold : COLORS.darkBorder,
                  borderWidth: selectedMethodId === method.id ? 2 : 1,
                }}
              >
                <CardContent>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {getCardIcon(method.brand)}
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' }}>
                            {method.brand.toUpperCase()} •••• {method.last4}
                          </Text>
                          {method.isDefault && (
                            <View
                              style={{
                                backgroundColor: COLORS.primaryGold,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: COLORS.luxuryBlack, fontSize: 10, fontWeight: '700' }}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        {method.expiryMonth && method.expiryYear && (
                          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                            Expires {formatExpiryDate(method.expiryMonth, method.expiryYear)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {selectedMethodId === method.id && (
                        <Check size={20} color={COLORS.primaryGold} />
                      )}

                      {!method.isDefault && (
                        <TouchableOpacity
                          onPress={() => handleSetDefault(method.id)}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: COLORS.luxuryBlackLighter,
                          }}
                        >
                          <Shield size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => handleDeleteMethod(method.id)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: COLORS.luxuryBlackLighter,
                        }}
                      >
                        <Trash2 size={16} color={COLORS.errorRed} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {showAddButton && (
          <TouchableOpacity
            onPress={handleAddPaymentMethod}
            disabled={isAddingMethod}
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: COLORS.darkBorder,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAddingMethod ? (
              <>
                <LoadingSpinner size="small" />
                <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 8 }}>
                  Adding payment method...
                </Text>
              </>
            ) : (
              <>
                <Plus size={24} color={COLORS.textSecondary} />
                <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 8 }}>
                  Add New Payment Method
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};
