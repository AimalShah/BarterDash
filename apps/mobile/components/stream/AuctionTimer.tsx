/**
 * AuctionTimer Component
 *
 * Visual countdown timer for auctions with color-coded urgency:
 * - Green: > 30s remaining
 * - Yellow: 15-30s remaining
 * - Red: < 15s remaining
 * - Flashing red: < 5s remaining
 * - Shows "+15s" animation when extended
 */

import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import {
  Box,
  Text,
  HStack,
} from '@gluestack-ui/themed';
import { Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface AuctionTimerProps {
  endsAt: Date;
  onEnded?: () => void;
  onExtended?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AuctionTimer({
  endsAt,
  onEnded,
  onExtended,
  size = 'md',
}: AuctionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtended, setIsExtended] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const extendAnim = useRef(new Animated.Value(0)).current;

  // Calculate time remaining
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0 && onEnded) {
        onEnded();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endsAt, onEnded]);

  // Flash animation for last 5 seconds
  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.setValue(1);
    };
  }, [timeRemaining]);

  // Show extension animation
  const showExtension = () => {
    setIsExtended(true);
    extendAnim.setValue(1);

    Animated.timing(extendAnim, {
      toValue: 0,
      duration: 1500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsExtended(false);
    });

    if (onExtended) {
      onExtended();
    }
  };

  // Get color based on time remaining
  const getColor = () => {
    if (timeRemaining <= 5) return COLORS.errorRed;
    if (timeRemaining <= 15) return COLORS.warningAmber;
    if (timeRemaining <= 30) return COLORS.primaryGold;
    return COLORS.successGreen;
  };

  const getBgColor = () => {
    if (timeRemaining <= 5) return 'rgba(239, 68, 68, 0.1)';
    if (timeRemaining <= 15) return 'rgba(245, 158, 11, 0.1)';
    if (timeRemaining <= 30) return 'rgba(244, 197, 66, 0.1)';
    return 'rgba(34, 197, 94, 0.1)';
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeConfig = {
    sm: { fontSize: 'md' as const, padding: '$2' as const, iconSize: 16 },
    md: { fontSize: 'xl' as const, padding: '$3' as const, iconSize: 20 },
    lg: { fontSize: '3xl' as const, padding: '$4' as const, iconSize: 28 },
  };

  const config = sizeConfig[size];
  const color = getColor();
  const bgColor = getBgColor();

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
    >
      <Box
        bg={bgColor}
        borderWidth={2}
        borderColor={color}
        rounded="$lg"
        p={config.padding}
        alignItems="center"
        style={{ minWidth: 100 }}
      >
        <HStack space="sm" alignItems="center">
          <Clock size={config.iconSize} color={color} />
          <Text
            color={color}
            fontWeight="$black"
            size={config.fontSize}
            fontFamily="mono"
          >
            {formatTime(timeRemaining)}
          </Text>
        </HStack>

        {timeRemaining <= 10 && (
          <Text color={color} size="2xs" fontWeight="$bold" mt="$1">
            ENDING SOON!
          </Text>
        )}

        {/* Extension animation */}
          {isExtended && (
          <Animated.View
            style={{
              position: 'absolute',
              top: -20,
              opacity: extendAnim,
              transform: [{
                translateY: extendAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            }}
          >
            <Text color={COLORS.successGreen} fontWeight="$bold" size="sm">
              +15s
            </Text>
          </Animated.View>
        )}
      </Box>
    </Animated.View>
  );
}

/**
 * Compact timer for overlays
 */
export function AuctionTimerCompact({ endsAt }: { endsAt: Date }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const getColor = () => {
    if (timeRemaining <= 10) return COLORS.errorRed;
    if (timeRemaining <= 30) return COLORS.warningAmber;
    return COLORS.textPrimary;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <HStack space="xs" alignItems="center">
      <Clock size={14} color={getColor()} />
      <Text color={getColor()} fontWeight="$bold" size="sm" fontFamily="mono">
        {formatTime(timeRemaining)}
      </Text>
    </HStack>
  );
}
