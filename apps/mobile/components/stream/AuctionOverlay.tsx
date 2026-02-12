/**
 * AuctionOverlay Component
 *
 * Floating overlay showing current auction status:
 * - Current bid amount (large display)
 * - Countdown timer
 * - Top bidder username
 * - Number of bids
 * - Sudden Death mode indicator
 */

import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
} from '@gluestack-ui/themed';
import { TrendingUp, Users, AlertCircle } from 'lucide-react-native';
import { AuctionTimerCompact } from './AuctionTimer';
import { COLORS } from '../../constants/colors';

interface AuctionOverlayProps {
  currentBid: number;
  topBidder?: string;
  bidCount: number;
  endsAt: Date;
  productTitle?: string;
  mode?: 'normal' | 'sudden_death';
}

export default function AuctionOverlay({
  currentBid,
  topBidder,
  bidCount,
  endsAt,
  productTitle,
  mode = 'normal',
}: AuctionOverlayProps) {
  return (
    <Box
      position="absolute"
      top="20%"
      left="$4"
      bg={COLORS.overlayStrong}
      p="$4"
      rounded="$lg"
      borderWidth={1}
      borderColor={COLORS.darkBorder}
      style={{
        maxWidth: 200,
        elevation: 5,
        shadowColor: COLORS.luxuryBlack,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }}
    >
      <VStack space="md">
        {/* Header */}
        <HStack space="sm" alignItems="center">
          <Box bg={COLORS.darkBorder} p="$1.5" rounded="$sm">
            <TrendingUp size={16} color={COLORS.textPrimary} />
          </Box>
          <Text color={COLORS.textSecondary} size="2xs" fontWeight="$black" textTransform="uppercase">
            Current Bid
          </Text>
        </HStack>

        {/* Bid Amount */}
        <VStack>
          <Text
            color={COLORS.textPrimary}
            fontWeight="$black"
            size="3xl"
            letterSpacing={-1}
          >
            ${currentBid.toLocaleString()}
          </Text>
          {productTitle && (
            <Text color={COLORS.textSecondary} size="xs" numberOfLines={1} mt="$1">
              {productTitle}
            </Text>
          )}
        </VStack>

        {/* Sudden Death Indicator */}
        {mode === 'sudden_death' && (
          <Box bg="rgba(239, 68, 68, 0.2)" p="$2" rounded="$sm">
            <HStack space="xs" alignItems="center" justifyContent="center">
              <AlertCircle size={12} color={COLORS.errorRed} />
              <Text color={COLORS.errorRed} fontWeight="$bold" size="2xs">
                SUDDEN DEATH
              </Text>
            </HStack>
          </Box>
        )}

        {/* Divider */}
        <Box h={1} bg={COLORS.darkBorder} />

        {/* Timer & Stats */}
        <HStack justifyContent="space-between" alignItems="center">
          <AuctionTimerCompact endsAt={endsAt} />

          <HStack space="xs" alignItems="center">
            <Users size={12} color={COLORS.textSecondary} />
            <Text color={COLORS.textSecondary} size="xs">
              {bidCount} bids
            </Text>
          </HStack>
        </HStack>

        {/* Top Bidder */}
        {topBidder && (
          <Box bg={COLORS.darkBorder} p="$2" rounded="$sm">
            <Text color={COLORS.textSecondary} size="2xs" textTransform="uppercase" fontWeight="$bold">
              Top Bidder
            </Text>
            <Text color={COLORS.textPrimary} fontWeight="$bold" size="sm">
              @{topBidder}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

/**
 * Compact version for smaller screens
 */
export function AuctionOverlayCompact({
  currentBid,
  endsAt,
}: {
  currentBid: number;
  endsAt: Date;
}) {
  console.log('[AuctionOverlayCompact] Rendering with currentBid:', currentBid, 'endsAt:', endsAt);
  return (
    <Box
      position="absolute"
      top="20%"
      left="$4"
      bg={COLORS.overlayStrong}
      px="$4"
      py="$3"
      rounded="$lg"
      borderWidth={1}
      borderColor={COLORS.darkBorder}
    >
      <HStack space="lg" alignItems="center">
        <VStack>
          <Text color={COLORS.textSecondary} size="2xs" fontWeight="$black" textTransform="uppercase">
            BID
          </Text>
          <Text color={COLORS.textPrimary} fontWeight="$black" size="xl">
            ${currentBid.toLocaleString()}
          </Text>
        </VStack>

        <Box w={1} h={40} bg={COLORS.darkBorder} />

        <AuctionTimerCompact endsAt={endsAt} />
      </HStack>
    </Box>
  );
}
