import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Shield,
  Loader,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Card, CardContent } from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface PaymentStatus {
  stage: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'requires_action';
  message: string;
  timestamp?: string;
  actionRequired?: {
    type: '3d_secure' | 'verify_with_microdeposits' | 'additional_verification';
    url?: string;
    instructions?: string;
  };
  error?: {
    code: string;
    message: string;
    type: 'card_error' | 'validation_error' | 'api_error' | 'network_error';
  };
}

interface PaymentStatusTrackerProps {
  paymentIntentId: string;
  escrowId?: string;
  currentStatus: PaymentStatus;
  onStatusChange?: (status: PaymentStatus) => void;
  showProgressBar?: boolean;
  showTimestamp?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const PaymentStatusTracker: React.FC<PaymentStatusTrackerProps> = ({
  paymentIntentId,
  escrowId,
  currentStatus,
  onStatusChange,
  showProgressBar = true,
  showTimestamp = true,
}) => {
  const [animatedProgress] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const previousStageRef = useRef<string>('');

  // Progress stages mapping
  const progressStages = {
    initiated: 0.2,
    processing: 0.6,
    requires_action: 0.8,
    succeeded: 1.0,
    failed: 0.4, // Show partial progress for failed payments
  };

  // Animate progress bar when status changes
  useEffect(() => {
    const targetProgress = progressStages[currentStatus.stage] || 0;
    
    Animated.timing(animatedProgress, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Trigger pulse animation for status changes
    if (previousStageRef.current !== currentStatus.stage && previousStageRef.current !== '') {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousStageRef.current = currentStatus.stage;
    onStatusChange?.(currentStatus);
  }, [currentStatus.stage]);

  // Start continuous pulse for processing states
  useEffect(() => {
    let pulseInterval: NodeJS.Timeout;

    if (currentStatus.stage === 'processing' || currentStatus.stage === 'requires_action') {
      pulseInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);
    }

    return () => {
      if (pulseInterval) {
        clearInterval(pulseInterval);
      }
    };
  }, [currentStatus.stage]);

  const getStatusIcon = () => {
    const iconSize = 24;
    
    switch (currentStatus.stage) {
      case 'initiated':
        return <CreditCard size={iconSize} color={COLORS.primaryGold} />;
      case 'processing':
        return <LoadingSpinner size="small" />;
      case 'requires_action':
        return <AlertCircle size={iconSize} color={COLORS.warningAmber} />;
      case 'succeeded':
        return <CheckCircle size={iconSize} color={COLORS.successGreen} />;
      case 'failed':
        return <AlertCircle size={iconSize} color={COLORS.errorRed} />;
      default:
        return <Clock size={iconSize} color={COLORS.textSecondary} />;
    }
  };

  const getStatusColor = () => {
    switch (currentStatus.stage) {
      case 'initiated':
        return COLORS.primaryGold;
      case 'processing':
        return COLORS.primaryGold;
      case 'requires_action':
        return COLORS.warningAmber;
      case 'succeeded':
        return COLORS.successGreen;
      case 'failed':
        return COLORS.errorRed;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusTitle = () => {
    switch (currentStatus.stage) {
      case 'initiated':
        return 'Payment Initiated';
      case 'processing':
        return 'Processing Payment';
      case 'requires_action':
        return 'Action Required';
      case 'succeeded':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment Status';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp || !showTimestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderProgressBar = () => {
    if (!showProgressBar) return null;

    return (
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            height: 4,
            backgroundColor: COLORS.darkBorder,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: getStatusColor(),
              borderRadius: 2,
              width: animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
        
        {/* Progress indicators */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          {Object.keys(progressStages).filter(stage => stage !== 'failed').map((stage, index) => {
            const isActive = progressStages[currentStatus.stage] >= progressStages[stage as keyof typeof progressStages];
            const isCurrent = currentStatus.stage === stage;
            
            return (
              <View
                key={stage}
                style={{
                  alignItems: 'center',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isCurrent ? getStatusColor() : (isActive ? COLORS.primaryGold : COLORS.darkBorder),
                  }}
                />
                <Text
                  style={{
                    color: isActive ? COLORS.textPrimary : COLORS.textSecondary,
                    fontSize: 10,
                    marginTop: 4,
                    textTransform: 'capitalize',
                  }}
                >
                  {stage.replace('_', ' ')}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderActionRequired = () => {
    if (currentStatus.stage !== 'requires_action' || !currentStatus.actionRequired) return null;

    return (
      <View
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: `${COLORS.warningAmber}20`,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.warningAmber,
        }}
      >
        <Text style={{ color: COLORS.warningAmber, fontSize: 14, fontWeight: '600' }}>
          Additional Verification Required
        </Text>
        {currentStatus.actionRequired.instructions && (
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
            {currentStatus.actionRequired.instructions}
          </Text>
        )}
      </View>
    );
  };

  const renderError = () => {
    if (currentStatus.stage !== 'failed' || !currentStatus.error) return null;

    return (
      <View
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: `${COLORS.errorRed}20`,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.errorRed,
        }}
      >
        <Text style={{ color: COLORS.errorRed, fontSize: 14, fontWeight: '600' }}>
          {currentStatus.error.message}
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
          Error Code: {currentStatus.error.code}
        </Text>
      </View>
    );
  };

  const renderEscrowInfo = () => {
    if (!escrowId || currentStatus.stage !== 'succeeded') return null;

    return (
      <View
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: `${COLORS.successGreen}20`,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.successGreen,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Shield size={16} color={COLORS.successGreen} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={{ color: COLORS.successGreen, fontSize: 12, fontWeight: '600' }}>
            Funds Secured in Escrow
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 10, marginTop: 2 }}>
            Escrow ID: {escrowId.slice(-8)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Card>
      <CardContent>
        <View style={{ padding: 4 }}>
          {renderProgressBar()}
          
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scale: pulseAnimation }],
            }}
          >
            <View style={{ marginRight: 12 }}>
              {getStatusIcon()}
            </View>
            
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {getStatusTitle()}
              </Text>
              
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 14,
                  marginTop: 2,
                }}
              >
                {currentStatus.message}
              </Text>
              
              {currentStatus.timestamp && showTimestamp && (
                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {formatTimestamp(currentStatus.timestamp)}
                </Text>
              )}
            </View>
            
            {/* Payment Intent ID for debugging */}
            {__DEV__ && (
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 10,
                  position: 'absolute',
                  top: -8,
                  right: 0,
                }}
              >
                {paymentIntentId.slice(-8)}
              </Text>
            )}
          </Animated.View>
          
          {renderActionRequired()}
          {renderError()}
          {renderEscrowInfo()}
        </View>
      </CardContent>
    </Card>
  );
};