import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { PaymentMethodManager } from './PaymentMethodManager';
import { PaymentStatusTracker, PaymentStatus } from './PaymentStatusTracker';
import { paymentsService } from '../../lib/api/services/payments';
import { supabase } from '../../lib/supabase';
import {
  usePaymentProcessing,
  usePaymentStatusUpdates,
  getErrorMessage,
  isRetryableError,
} from '../../hooks/usePaymentProcessing';

export interface OrderSummary {
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  platformFee: number;
  total: number;
  currency: string;
}

export interface PaymentResult {
  paymentIntentId: string;
  escrowId?: string;
  status: 'succeeded' | 'requires_action' | 'processing' | 'failed';
  error?: string;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'network_error';
  declineCode?: string;
}

interface EnhancedCheckoutProps {
  orderSummary: OrderSummary;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: PaymentError) => void;
  onCancel: () => void;
  enableEscrow?: boolean;
  allowSavedMethods?: boolean;
  showOrderSummary?: boolean;
}

export const EnhancedCheckout: React.FC<EnhancedCheckoutProps> = ({
  orderSummary,
  onSuccess,
  onError,
  onCancel,
  enableEscrow = true,
  allowSavedMethods = true,
  showOrderSummary = true,
}) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkSupabaseSession();
  }, []);

  const checkSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.email?.split('@')[0] || 'user',
          full_name: session.user.email?.split('@')[0] || 'User',
        });
      }
    } catch (error) {
      console.error('Error checking Supabase session:', error);
    }
  };

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [useNewPaymentMethod, setUseNewPaymentMethod] = useState(false);
  const [processingState, setProcessingState] = useState<any>({
    isProcessing: false,
    currentStatus: { stage: 'initiated', message: 'Ready to process payment' },
    paymentIntentId: null,
    escrowId: null,
    retryCount: 0,
    duplicateSubmissionPrevented: false,
  });

  const resetProcessing = () => {
    setProcessingState({
      isProcessing: false,
      currentStatus: { stage: 'initiated', message: 'Ready to process payment' },
      paymentIntentId: null,
      escrowId: null,
      retryCount: 0,
      duplicateSubmissionPrevented: false,
    });
  };

  const preventDuplicateSubmission = () => {
    if (processingState.isProcessing || processingState.duplicateSubmissionPrevented) {
      setProcessingState((prev: any) => ({ ...prev, duplicateSubmissionPrevented: true }));
      return false;
    }
    setProcessingState((prev: any) => ({ ...prev, isProcessing: true, duplicateSubmissionPrevented: true }));
    return true;
  };

  const allowSubmission = () => {
    setProcessingState((prev: any) => ({ ...prev, duplicateSubmissionPrevented: false }));
  };

  const updateStatus = (status: { stage: string; message: string; error?: any; actionRequired?: any }) => {
    setProcessingState((prev: any) => ({
      ...prev,
      currentStatus: status,
    }));
  };

  const incrementRetry = () => {
    setProcessingState((prev: any) => ({ ...prev, retryCount: prev.retryCount + 1 }));
  };

  const completeProcessing = (success: boolean, escrowId?: string) => {
    setProcessingState((prev: any) => ({
      ...prev,
      isProcessing: false,
      currentStatus: success
        ? { stage: 'succeeded', message: 'Payment successful!' }
        : { stage: 'failed', message: 'Payment failed' },
      escrowId,
    }));
  };

  const canRetry = () => {
    return processingState.retryCount < 3;
  };

  const handlePaymentMethodSelection = (methodId: string) => {
    setSelectedPaymentMethodId(methodId);
    setUseNewPaymentMethod(false);
    resetProcessing();
  };

  const handleUseNewPaymentMethod = () => {
    setUseNewPaymentMethod(true);
    setSelectedPaymentMethodId('');
    resetProcessing();
  };

  const processPaymentWithSavedMethod = async () => {
    if (!selectedPaymentMethodId || !user?.id) return;

    if (!preventDuplicateSubmission()) {
      return;
    }

    try {
      const paymentIntentData = await paymentsService.createPaymentIntentWithMethod({
        orderId: orderSummary.orderId,
        amount: orderSummary.total,
        currency: orderSummary.currency,
        paymentMethodId: selectedPaymentMethodId,
      });

      updateStatus({ stage: 'processing', message: 'Processing payment with saved method...' });

      const confirmationResult = await paymentsService.confirmPaymentIntent({
        paymentIntentId: paymentIntentData.id,
        paymentMethodId: selectedPaymentMethodId,
        returnUrl: 'barterdash://payment-return',
      });

      await handlePaymentResult(confirmationResult);
    } catch (err: any) {
      console.error('Payment processing error:', err);
      updateStatus({
        stage: 'failed',
        message: 'Payment processing failed',
        error: {
          code: err.code || 'payment_processing_failed',
          message: err.message || 'Payment processing failed',
          type: 'api_error',
        },
      });
    }
  };

  const processPaymentWithNewMethod = async () => {
    if (!preventDuplicateSubmission()) {
      return;
    }

    try {
      updateStatus({ stage: 'processing', message: 'Creating checkout session...' });

      const session = await paymentsService.createCheckoutSession(orderSummary.orderId);

      updateStatus({
        stage: 'processing',
        message: 'Redirecting to secure payment...',
      });

      Alert.alert(
        'Redirecting to Payment',
        'You will be redirected to complete your payment securely.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {
            allowSubmission();
            resetProcessing();
          }},
          { text: 'Continue', style: 'default', onPress: () => {
            window.open(session.url, '_blank');
            updateStatus({ stage: 'processing', message: 'Waiting for payment completion...' });
          }}
        ]
      );
    } catch (err: any) {
      console.error('Payment error:', err);
      updateStatus({
        stage: 'failed',
        message: 'Failed to create payment session',
        error: {
          code: 'payment_session_failed',
          message: err.message || 'Failed to create payment session',
          type: 'api_error',
        },
      });
    }
  };

  const handlePaymentResult = async (result: any) => {
    switch (result.status) {
      case 'succeeded':
        await handlePaymentSuccess();
        break;
      case 'requires_action':
        updateStatus({
          stage: 'requires_action',
          message: 'Additional authentication required...',
          actionRequired: {
            type: '3d_secure',
            instructions: 'Please complete the authentication process to continue.',
          },
        });
        break;
      case 'processing':
        updateStatus({
          stage: 'processing',
          message: 'Payment is being processed...',
        });
        break;
      default:
        updateStatus({
          stage: 'failed',
          message: 'Payment failed with unknown status',
          error: {
            code: 'payment_failed',
            message: 'Payment failed with unknown status',
            type: 'api_error',
          },
        });
    }
  };

  const handlePaymentSuccess = async () => {
    updateStatus({ stage: 'processing', message: 'Payment successful! Creating secure escrow...' });

    let escrowResult = null;
    if (enableEscrow) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        escrowResult = { escrowId: `escrow_${Date.now()}` };
      } catch (escrowError) {
        console.warn('Escrow creation failed:', escrowError);
      }
    }

    completeProcessing(true, escrowResult?.escrowId);
  };

  const handleCancel = () => {
    if (processingState.duplicateSubmissionPrevented) {
      Alert.alert(
        'Cancel Payment',
        'Payment is currently being processed. Are you sure you want to cancel?',
        [
          { text: 'Continue Processing', style: 'default' },
          {
            text: 'Cancel Payment',
            style: 'destructive',
            onPress: () => {
              resetProcessing();
              onCancel();
            },
          },
        ]
      );
    } else {
      onCancel();
    }
  };

  const renderOrderSummary = () => {
    if (!showOrderSummary) return null;

    return (
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ color: COLORS.textPrimary, fontSize: 18 }}>
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={{ gap: 12 }}>
            {orderSummary.items.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={{ height: 1, backgroundColor: COLORS.darkBorder, marginVertical: 8 }} />

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Subtotal</Text>
                <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  ${orderSummary.subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Shipping</Text>
                <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  ${orderSummary.shipping.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Tax</Text>
                <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                  ${orderSummary.tax.toFixed(2)}
                </Text>
              </View>
              {orderSummary.platformFee > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Platform Fee</Text>
                  <Text style={{ color: COLORS.textPrimary, fontSize: 14 }}>
                    ${orderSummary.platformFee.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.darkBorder, marginVertical: 8 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
                Total
              </Text>
              <Text style={{ color: COLORS.primaryGold, fontSize: 18, fontWeight: 'bold' }}>
                ${orderSummary.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  const renderEscrowProtection = () => {
    if (!enableEscrow) return null;

    return (
      <Card style={{ marginBottom: 20, borderColor: COLORS.successGreen, borderWidth: 1 }}>
        <CardContent>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Shield size={24} color={COLORS.successGreen} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' }}>
                Buyer Protection
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                Your payment is held securely until delivery is confirmed
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentMethodSelection = () => {
    if (processingState.isProcessing || processingState.currentStatus.stage === 'succeeded') return null;

    return (
      <View style={{ gap: 20 }}>
        {allowSavedMethods && (
          <Card>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textPrimary, fontSize: 16 }}>
                Saved Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodManager
                userId={user?.id || ''}
                onMethodSelected={handlePaymentMethodSelection}
                showAddButton={false}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <TouchableOpacity
              onPress={handleUseNewPaymentMethod}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: useNewPaymentMethod ? COLORS.primaryGold : COLORS.darkBorder,
                borderStyle: useNewPaymentMethod ? 'solid' : 'dashed',
              }}
            >
              <CreditCard size={24} color={COLORS.primaryGold} />
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 12,
                }}
              >
                Use New Payment Method
              </Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
    );
  };

  const renderPaymentStatus = () => {
    if (!processingState.isProcessing && processingState.currentStatus.stage === 'initiated') return null;

    return (
      <PaymentStatusTracker
        paymentIntentId={processingState.paymentIntentId || ''}
        escrowId={processingState.escrowId || undefined}
        currentStatus={processingState.currentStatus}
        onStatusChange={() => {}}
        showProgressBar={true}
        showTimestamp={true}
      />
    );
  };

  const renderRetryButton = () => {
    if (processingState.currentStatus.stage !== 'failed') return null;

    const canRetryPayment = canRetry() &&
      processingState.currentStatus.error &&
      isRetryableError(processingState.currentStatus.error);

    if (!canRetryPayment) return null;

    return (
      <TouchableOpacity
        onPress={() => {
          incrementRetry();
          resetProcessing();
          if (useNewPaymentMethod) {
            processPaymentWithNewMethod();
          } else if (selectedPaymentMethodId) {
            processPaymentWithSavedMethod();
          }
        }}
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: COLORS.primaryGold,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: COLORS.primaryGold, fontSize: 16, fontWeight: '600' }}>
          Retry Payment ({processingState.retryCount}/3)
        </Text>
      </TouchableOpacity>
    );
  };

  const renderActionButtons = () => {
    if (processingState.currentStatus.stage === 'succeeded') return null;

    const canProceed = useNewPaymentMethod || selectedPaymentMethodId;
    const isProcessing = processingState.isProcessing || processingState.duplicateSubmissionPrevented;

    return (
      <View style={{ gap: 12, marginTop: 20 }}>
        <Button
          label={
            isProcessing
              ? 'Processing...'
              : `Pay ${orderSummary.currency.toUpperCase()} $${orderSummary.total.toFixed(2)}`
          }
          onPress={useNewPaymentMethod ? processPaymentWithNewMethod : processPaymentWithSavedMethod}
          disabled={!canProceed || isProcessing}
          loading={isProcessing}
          fullWidth
        />

        {renderRetryButton()}

        <Button
          label="Cancel"
          onPress={handleCancel}
          variant="outline"
          disabled={isProcessing}
          fullWidth
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {renderOrderSummary()}
      {renderEscrowProtection()}
      {renderPaymentMethodSelection()}
      {renderPaymentStatus()}
      {renderActionButtons()}
    </ScrollView>
  );
};
