import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { PaymentStatus } from '../components/payment/PaymentStatusTracker';

export interface PaymentProcessingState {
  isProcessing: boolean;
  currentStatus: PaymentStatus;
  paymentIntentId: string | null;
  escrowId: string | null;
  duplicateSubmissionPrevented: boolean;
  processingStartTime: number | null;
  retryCount: number;
}

export interface PaymentProcessingActions {
  startProcessing: (paymentIntentId: string, initialMessage?: string) => void;
  updateStatus: (status: Partial<PaymentStatus>) => void;
  completeProcessing: (success: boolean, escrowId?: string) => void;
  resetProcessing: () => void;
  preventDuplicateSubmission: () => boolean;
  allowSubmission: () => void;
  incrementRetry: () => void;
  canRetry: () => boolean;
}

interface UsePaymentProcessingOptions {
  maxRetries?: number;
  processingTimeout?: number; // in milliseconds
  onStatusChange?: (status: PaymentStatus) => void;
  onProcessingComplete?: (success: boolean, state: PaymentProcessingState) => void;
  onTimeout?: () => void;
}

const DEFAULT_OPTIONS: Required<UsePaymentProcessingOptions> = {
  maxRetries: 3,
  processingTimeout: 120000, // 2 minutes
  onStatusChange: () => {},
  onProcessingComplete: () => {},
  onTimeout: () => {},
};

export const usePaymentProcessing = (
  options: UsePaymentProcessingOptions = {}
): [PaymentProcessingState, PaymentProcessingActions] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<PaymentProcessingState>({
    isProcessing: false,
    currentStatus: {
      stage: 'initiated',
      message: 'Ready to process payment',
    },
    paymentIntentId: null,
    escrowId: null,
    duplicateSubmissionPrevented: false,
    processingStartTime: null,
    retryCount: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submissionLockRef = useRef<boolean>(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Monitor processing timeout
  useEffect(() => {
    if (state.isProcessing && state.processingStartTime) {
      timeoutRef.current = setTimeout(() => {
        if (state.isProcessing) {
          updateStatus({
            stage: 'failed',
            message: 'Payment processing timed out',
            error: {
              code: 'processing_timeout',
              message: 'Payment processing took too long and was cancelled',
              type: 'api_error',
            },
          });
          opts.onTimeout();
        }
      }, opts.processingTimeout);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [state.isProcessing, state.processingStartTime]);

  // Notify on status changes
  useEffect(() => {
    opts.onStatusChange(state.currentStatus);
  }, [state.currentStatus]);

  const startProcessing = useCallback((paymentIntentId: string, initialMessage = 'Processing payment...') => {
    if (submissionLockRef.current) {
      Alert.alert(
        'Payment in Progress',
        'A payment is already being processed. Please wait for it to complete.',
        [{ text: 'OK' }]
      );
      return;
    }

    submissionLockRef.current = true;
    
    setState(prevState => ({
      ...prevState,
      isProcessing: true,
      paymentIntentId,
      duplicateSubmissionPrevented: true,
      processingStartTime: Date.now(),
      currentStatus: {
        stage: 'processing',
        message: initialMessage,
        timestamp: new Date().toISOString(),
      },
    }));
  }, []);

  const updateStatus = useCallback((statusUpdate: Partial<PaymentStatus>) => {
    setState(prevState => ({
      ...prevState,
      currentStatus: {
        ...prevState.currentStatus,
        ...statusUpdate,
        timestamp: statusUpdate.timestamp || new Date().toISOString(),
      },
    }));
  }, []);

  const completeProcessing = useCallback((success: boolean, escrowId?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prevState => {
      const newState = {
        ...prevState,
        isProcessing: false,
        duplicateSubmissionPrevented: false,
        escrowId: escrowId || prevState.escrowId,
        currentStatus: {
          ...prevState.currentStatus,
          stage: success ? 'succeeded' as const : 'failed' as const,
          message: success 
            ? 'Payment completed successfully' 
            : prevState.currentStatus.message || 'Payment failed',
          timestamp: new Date().toISOString(),
        },
      };

      opts.onProcessingComplete(success, newState);
      return newState;
    });

    submissionLockRef.current = false;
  }, [opts.onProcessingComplete]);

  const resetProcessing = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    submissionLockRef.current = false;

    setState({
      isProcessing: false,
      currentStatus: {
        stage: 'initiated',
        message: 'Ready to process payment',
      },
      paymentIntentId: null,
      escrowId: null,
      duplicateSubmissionPrevented: false,
      processingStartTime: null,
      retryCount: 0,
    });
  }, []);

  const preventDuplicateSubmission = useCallback((): boolean => {
    if (submissionLockRef.current || state.duplicateSubmissionPrevented) {
      Alert.alert(
        'Payment in Progress',
        'Please wait for the current payment to complete before trying again.',
        [{ text: 'OK' }]
      );
      return false;
    }

    submissionLockRef.current = true;
    setState(prevState => ({
      ...prevState,
      duplicateSubmissionPrevented: true,
    }));

    return true;
  }, [state.duplicateSubmissionPrevented]);

  const allowSubmission = useCallback(() => {
    submissionLockRef.current = false;
    setState(prevState => ({
      ...prevState,
      duplicateSubmissionPrevented: false,
    }));
  }, []);

  const incrementRetry = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      retryCount: prevState.retryCount + 1,
    }));
  }, []);

  const canRetry = useCallback((): boolean => {
    return state.retryCount < opts.maxRetries;
  }, [state.retryCount, opts.maxRetries]);

  const actions: PaymentProcessingActions = {
    startProcessing,
    updateStatus,
    completeProcessing,
    resetProcessing,
    preventDuplicateSubmission,
    allowSubmission,
    incrementRetry,
    canRetry,
  };

  return [state, actions];
};

// Utility hook for real-time payment status updates
export const usePaymentStatusUpdates = (
  paymentIntentId: string | null,
  onStatusUpdate: (status: PaymentStatus) => void
) => {
  useEffect(() => {
    if (!paymentIntentId) return;

    // TODO: Implement real-time status updates using Supabase Realtime
    // This would listen to the payment_status_${paymentIntentId} channel
    // and update the status based on webhook events from the backend
    
    // Example implementation:
    // const channel = supabase.channel(`payment_status_${paymentIntentId}`);
    // channel.on('broadcast', { event: 'payment_status_update' }, (payload) => {
    //   onStatusUpdate({
    //     stage: payload.status,
    //     message: payload.message || 'Status updated',
    //     timestamp: payload.timestamp,
    //     error: payload.error,
    //     actionRequired: payload.actionRequired,
    //   });
    // });
    // channel.subscribe();
    
    // return () => {
    //   channel.unsubscribe();
    // };
  }, [paymentIntentId, onStatusUpdate]);
};

// Utility function to format payment processing duration
export const formatProcessingDuration = (startTime: number | null): string => {
  if (!startTime) return '';
  
  const duration = Date.now() - startTime;
  const seconds = Math.floor(duration / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
};

// Utility function to determine if a payment error is retryable
export const isRetryableError = (error: PaymentStatus['error']): boolean => {
  if (!error) return false;
  
  const retryableCodes = [
    'network_error',
    'processing_error',
    'temporary_failure',
    'rate_limit_error',
    'api_connection_error',
  ];
  
  const nonRetryableCodes = [
    'card_declined',
    'insufficient_funds',
    'expired_card',
    'invalid_card',
    'authentication_failed',
  ];
  
  if (nonRetryableCodes.includes(error.code)) {
    return false;
  }
  
  return retryableCodes.includes(error.code) || error.type === 'network_error';
};

// Utility function to get user-friendly error messages
export const getErrorMessage = (error: PaymentStatus['error']): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMessages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    insufficient_funds: 'Insufficient funds. Please check your account balance.',
    expired_card: 'Your card has expired. Please update your payment method.',
    invalid_card: 'Invalid card information. Please check your details.',
    authentication_required: 'Additional authentication is required to complete this payment.',
    processing_timeout: 'Payment processing timed out. Please try again.',
    network_error: 'Network connection error. Please check your internet connection.',
    rate_limit_error: 'Too many payment attempts. Please wait a moment and try again.',
  };
  
  return errorMessages[error.code] || error.message || 'Payment processing failed';
};