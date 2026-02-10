/**
 * StreamNotificationToast Component
 *
 * Shows in-stream toast notifications for:
 * - New bids
 * - Auction ending soon
 * - Product sold
 * - New viewer joined
 */

import React, { useEffect, useState } from 'react';
import { Animated, Dimensions } from 'react-native';
import {
  Box,
  HStack,
  Text,
  VStack,
  Pressable,
} from '@gluestack-ui/themed';
import {
  Gavel,
  Clock,
  ShoppingBag,
  UserPlus,
  X,
  Trophy,
  TrendingUp,
} from 'lucide-react-native';
import { StreamNotification, NotificationType } from '../../lib/notifications/streamNotifications';
import { COLORS } from '@/constants/colors';

interface StreamNotificationToastProps {
  notification: StreamNotification | null;
  onDismiss: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export default function StreamNotificationToast({
  notification,
  onDismiss,
  duration = 5000,
}: StreamNotificationToastProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (notification) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!notification) return null;

  const getConfig = () => {
    switch (notification.type) {
      case NotificationType.NEW_BID:
        return {
          icon: Gavel,
          bgColor: COLORS.warningAmber,
          iconBg: COLORS.goldDark,
          titleColor: COLORS.textPrimary,
          messageColor: COLORS.textSecondary,
        };
      case NotificationType.AUCTION_ENDING_SOON:
        return {
          icon: Clock,
          bgColor: COLORS.errorRed,
          iconBg: COLORS.liveIndicator,
          titleColor: COLORS.textPrimary,
          messageColor: COLORS.textSecondary,
        };
      case NotificationType.AUCTION_WON:
        return {
          icon: Trophy,
          bgColor: COLORS.successGreen,
          iconBg: COLORS.primaryGold,
          titleColor: COLORS.textPrimary,
          messageColor: COLORS.textSecondary,
        };
      case NotificationType.PRODUCT_SOLD:
        return {
          icon: ShoppingBag,
          bgColor: COLORS.primaryGold,
          iconBg: COLORS.goldDark,
          titleColor: COLORS.luxuryBlack,
          messageColor: COLORS.textSecondary,
        };
      case NotificationType.NEW_FOLLOWER:
        return {
          icon: UserPlus,
          bgColor: COLORS.primaryGold,
          iconBg: COLORS.goldDark,
          titleColor: COLORS.luxuryBlack,
          messageColor: COLORS.textSecondary,
        };
      default:
        return {
          icon: TrendingUp,
          bgColor: COLORS.textSecondary,
          iconBg: COLORS.textMuted,
          titleColor: COLORS.textPrimary,
          messageColor: COLORS.textSecondary,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        transform: [{ translateY: slideAnim }],
        zIndex: 1000,
      }}
    >
        <Box
          bg={config.bgColor}
          rounded="$lg"
          p="$4"
          borderWidth={1}
          borderColor={COLORS.darkBorder}
          style={{
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space="md" alignItems="center" flex={1}>
              <Box
                bg={config.iconBg}
                p="$2"
                rounded="$md"
              >
                <Icon size={24} color={COLORS.textPrimary} />
              </Box>
              <VStack flex={1}>
                <Text
                  color={config.titleColor}
                  fontWeight="$bold"
                  size="sm"
                >
                  {notification.title}
                </Text>
                <Text
                  color={config.messageColor}
                  size="xs"
                  numberOfLines={2}
                >
                  {notification.message}
                </Text>
              </VStack>
            </HStack>
            <Pressable onPress={handleDismiss} p="$2">
              <X size={20} color={COLORS.textPrimary} />
            </Pressable>
          </HStack>
        </Box>
    </Animated.View>
  );
}

/**
 * Compact toast for bid notifications only
 */
export function BidToast({
  bidAmount,
  bidderName,
  onDismiss,
}: {
  bidAmount: number;
  bidderName: string;
  onDismiss: () => void;
}) {
  return (
    <Box
      position="absolute"
      top={60}
      left={16}
      right={16}
      bg={COLORS.warningAmber}
      rounded="$lg"
      p="$4"
      zIndex={1000}
      style={{
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      }}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="md" alignItems="center">
          <Box bg={COLORS.goldDark} p="$2" rounded="$md">
            <Gavel size={24} color={COLORS.textPrimary} />
          </Box>
          <VStack>
            <Text color={COLORS.textPrimary} fontWeight="$bold" size="sm">
              New Bid!
            </Text>
            <Text color={COLORS.textSecondary} size="xs">
              {bidderName} bid ${bidAmount.toFixed(2)}
            </Text>
          </VStack>
        </HStack>
        <Pressable onPress={onDismiss} p="$2">
          <X size={20} color={COLORS.textPrimary} />
        </Pressable>
      </HStack>
    </Box>
  );
}

/**
 * Countdown warning toast
 */
export function CountdownToast({
  secondsRemaining,
  onDismiss,
}: {
  secondsRemaining: number;
  onDismiss: () => void;
}) {
  const getColor = () => {
    if (secondsRemaining <= 5) return COLORS.errorRed;
    if (secondsRemaining <= 10) return COLORS.warningAmber;
    return COLORS.primaryGold;
  };

  const color = getColor();

  return (
    <Box
      position="absolute"
      top={60}
      alignSelf="center"
      bg={color}
      rounded="$lg"
      px="$6"
      py="$3"
      zIndex={1000}
      style={{
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      }}
    >
      <HStack space="sm" alignItems="center">
        <Clock size={20} color={COLORS.textPrimary} />
        <Text color={COLORS.textPrimary} fontWeight="$black" size="lg">
          {secondsRemaining}s
        </Text>
        <Text color={COLORS.textPrimary} fontWeight="$bold" size="sm">
          remaining!
        </Text>
        <Pressable onPress={onDismiss} ml="$2">
          <X size={16} color={COLORS.textPrimary} />
        </Pressable>
      </HStack>
    </Box>
  );
}
