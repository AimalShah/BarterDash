/**
 * SellerStreamControls Component
 *
 * Slide-out control panel for sellers during streams with tabs:
 * - Queue: Manage upcoming products
 * - Active Auction: Current auction status and controls
 * - Start New Auction: Configure and start new auctions
 * - Tools: Additional stream tools
 */

import React, { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Button,
  ButtonText,
  ScrollView,
  Input,
  InputField,
  Divider,
  Badge,
  BadgeText,
  Spinner,
} from '@gluestack-ui/themed';
import {
  X,
  Package,
  Gavel,
  Play,
  Pin,
  Trash2,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Radio,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

type Tab = 'queue' | 'active' | 'start';

interface Product {
  id: string;
  title: string;
  price: number;
  images?: string[];
}

interface QueueItem {
  id: string;
  product: Product;
  orderIndex: number;
  status: 'upcoming' | 'active' | 'sold' | 'passed';
  auctionConfig?: {
    startingBid: number;
    durationSeconds: number;
    auctionType: 'standard' | 'sudden_death';
    reservePrice?: number;
  };
}

interface Auction {
  id: string;
  product: Product;
  currentBid: number;
  bidCount: number;
  topBidder?: string;
  endsAt: Date;
  status: 'active' | 'ended';
  mode?: 'normal' | 'sudden_death';
}

interface SellerStreamControlsProps {
  streamId: string;
  productQueue: QueueItem[];
  activeAuction: Auction | null;
  pinnedProduct: Product | null;
  onStartAuction: (productId: string, config: any) => Promise<void>;
  onPinProduct: (productId: string) => Promise<void>;
  onMarkAsSold: (productId: string, auctionId?: string) => Promise<void>;
  onMarkAsPassed: (productId: string) => Promise<void>;
  onExtendAuction: (auctionId: string, seconds: number) => Promise<void>;
  onEndAuctionEarly: (auctionId: string) => Promise<void>;
  onAddProduct: () => void;
  onMockAuctionWin?: () => Promise<void>;
  showDevTools?: boolean;
  onClose: () => void;
}

export default function SellerStreamControls({
  streamId,
  productQueue,
  activeAuction,
  pinnedProduct,
  onStartAuction,
  onPinProduct,
  onMarkAsSold,
  onMarkAsPassed,
  onExtendAuction,
  onEndAuctionEarly,
  onAddProduct,
  onMockAuctionWin,
  showDevTools = false,
  onClose,
}: SellerStreamControlsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [auctionConfig, setAuctionConfig] = useState({
    startingBid: 10,
    durationSeconds: 60,
    auctionType: 'standard' as 'standard' | 'sudden_death',
    reservePrice: undefined as number | undefined,
  });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'queue', label: 'Queue', icon: Package },
    { id: 'active', label: 'Active', icon: Gavel },
    { id: 'start', label: 'New', icon: Play },
  ];

  const durationOptions = [
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '2m', value: 120 },
    { label: '5m', value: 300 },
  ];

  const renderQueueTab = () => (
    <VStack space="md">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="xs" alignItems="center">
          <Box bg={COLORS.primaryGold} p="$1.5" rounded="$sm">
            <Package size={16} color={COLORS.luxuryBlack} />
          </Box>
          <Text fontWeight="$bold" size="md" color={COLORS.textPrimary}>
            Product Queue ({productQueue.length})
          </Text>
        </HStack>
        <Button size="sm" bg={COLORS.primaryGold} rounded="$lg" onPress={onAddProduct}>
          <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
            Add Products
          </ButtonText>
        </Button>
      </HStack>
      {productQueue.length === 0 ? (
        <Box bg={COLORS.cardBackground} p="$8" rounded="$2xl" alignItems="center" borderWidth={1} borderColor={COLORS.darkBorder}>
          <Package size={48} color={COLORS.textMuted} />
          <Text fontWeight="$bold" color={COLORS.textPrimary} mt="$3" size="md">
            Queue is Empty
          </Text>
          <Text color={COLORS.textSecondary} mt="$1" textAlign="center" size="sm">
            Add products to start auctions
          </Text>
          <Button 
            bg={COLORS.primaryGold} 
            mt="$4" 
            rounded="$xl"
            onPress={onAddProduct}
          >
            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
              Add First Product
            </ButtonText>
          </Button>
        </Box>
      ) : (
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <VStack space="sm">
            {productQueue.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => onPinProduct(item.product.id)}
              >
                <Box
                  bg={pinnedProduct?.id === item.product.id ? COLORS.luxuryBlackLight : COLORS.luxuryBlack}
                  p="$4"
                  rounded="$xl"
                  borderWidth={2}
                  borderColor={pinnedProduct?.id === item.product.id ? COLORS.primaryGold : COLORS.darkBorder}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space="md" alignItems="center" flex={1}>
                      <Box 
                        bg={pinnedProduct?.id === item.product.id ? COLORS.primaryGold : COLORS.darkSurface} 
                        w={48} 
                        h={48} 
                        rounded="$lg" 
                        alignItems="center" 
                        justifyContent="center"
                      >
                        <Text fontWeight="$black" color={pinnedProduct?.id === item.product.id ? COLORS.luxuryBlack : COLORS.textMuted} size="lg">
                          {index + 1}
                        </Text>
                      </Box>
                      <VStack flex={1}>
                        <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1} size="sm">
                          {item.product.title}
                        </Text>
                        <Text size="xs" color={COLORS.primaryGold} fontWeight="$bold" mt="$1">
                          Starting: ${item.auctionConfig?.startingBid || item.product.price}
                        </Text>
                        {item.status === 'upcoming' && (
                          <Badge bg={COLORS.darkSurface} mt="$1" alignSelf="flex-start">
                            <BadgeText size="2xs" color={COLORS.textSecondary}>Ready</BadgeText>
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    <HStack space="sm">
                      {pinnedProduct?.id === item.product.id && (
                        <Box bg={COLORS.primaryGold} p="$2" rounded="$lg">
                          <Pin size={18} color={COLORS.luxuryBlack} />
                        </Box>
                      )}
                      <Pressable onPress={() => onMarkAsPassed(item.product.id)}>
                        <Box bg="rgba(239, 68, 68, 0.2)" p="$2" rounded="$lg" borderWidth={1} borderColor={COLORS.errorRed}>
                          <Trash2 size={18} color={COLORS.errorRed} />
                        </Box>
                      </Pressable>
                    </HStack>
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </ScrollView>
      )}
    </VStack>
  );

  const renderActiveAuctionTab = () => {
    if (!activeAuction) {
      return (
        <VStack space="md" alignItems="center" py="$10">
          <Box bg={COLORS.darkSurface} p="$6" rounded="$2xl" borderWidth={1} borderColor={COLORS.darkBorder}>
            <Gavel size={48} color={COLORS.textMuted} />
          </Box>
          <Text fontWeight="$bold" color={COLORS.textPrimary} size="lg">
            No Active Auction
          </Text>
          <Text size="sm" color={COLORS.textSecondary} textAlign="center">
            Start a new auction from the "Start New" tab
          </Text>
          <Button 
            bg={COLORS.primaryGold} 
            mt="$2"
            onPress={() => setActiveTab('start')}
          >
            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
              Start New Auction
            </ButtonText>
          </Button>
        </VStack>
      );
    }

    const timeRemaining = Math.max(0, Math.floor((new Date(activeAuction.endsAt).getTime() - Date.now()) / 1000));

    return (
      <VStack space="lg">
        {/* Live Status Badge */}
        <HStack justifyContent="center">
          <Badge bg="red.500" rounded="$full" px="$3" py="$1">
            <HStack space="xs" alignItems="center">
              <Box w="$1.5" h="$1.5" bg="white" rounded="$full" />
              <BadgeText color="white" fontWeight="$bold">LIVE AUCTION</BadgeText>
            </HStack>
          </Badge>
        </HStack>

        {/* Sudden Death Mode Indicator */}
        {activeAuction.mode === 'sudden_death' && (
          <Box bg="rgba(239, 68, 68, 0.2)" p="$3" rounded="$xl" borderWidth={1} borderColor={COLORS.errorRed}>
            <HStack space="xs" alignItems="center" justifyContent="center">
              <AlertCircle size={16} color={COLORS.errorRed} />
              <Text color={COLORS.errorRed} fontWeight="$bold" size="sm">
                SUDDEN DEATH - No timer extensions
              </Text>
            </HStack>
          </Box>
        )}

        {/* Current Bid Display */}
        <Box bg={COLORS.luxuryBlackLight} p="$5" rounded="$2xl" borderWidth={2} borderColor={COLORS.primaryGold}>
          <VStack space="sm" alignItems="center">
            <HStack space="xs" alignItems="center">
              <TrendingUp size={16} color={COLORS.primaryGold} />
              <Text size="xs" color={COLORS.primaryGold} fontWeight="$black" textTransform="uppercase">
                Current Bid
              </Text>
            </HStack>
            <Text color={COLORS.primaryGold} fontWeight="$black" size="5xl">
              ${activeAuction.currentBid.toLocaleString()}
            </Text>
            <Text color={COLORS.textSecondary} size="sm" textAlign="center" numberOfLines={2}>
              {activeAuction.product.title}
            </Text>
          </VStack>
        </Box>

        {/* Stats Row */}
        <HStack justifyContent="space-around" bg={COLORS.darkSurface} p="$4" rounded="$xl">
          <VStack alignItems="center" space="xs">
            <Box bg={COLORS.luxuryBlack} p="$2" rounded="$lg">
              <Users size={20} color={COLORS.primaryGold} />
            </Box>
            <Text fontWeight="$bold" color={COLORS.textPrimary} size="xl">
              {activeAuction.bidCount}
            </Text>
            <Text size="xs" color={COLORS.textSecondary}>Total Bids</Text>
          </VStack>

          <Box w={1} bg={COLORS.darkBorder} />

          <VStack alignItems="center" space="xs">
            <Box bg={COLORS.luxuryBlack} p="$2" rounded="$lg">
              <Clock size={20} color={timeRemaining < 30 ? COLORS.errorRed : COLORS.primaryGold} />
            </Box>
            <Text 
              fontWeight="$bold" 
              color={timeRemaining < 30 ? COLORS.errorRed : COLORS.textPrimary} 
              size="xl"
            >
              {timeRemaining}s
            </Text>
            <Text size="xs" color={COLORS.textSecondary}>Time Left</Text>
          </VStack>
        </HStack>

        {/* Top Bidder */}
        {activeAuction.topBidder ? (
          <Box bg="rgba(34, 197, 94, 0.2)" p="$4" rounded="$xl" borderWidth={1} borderColor={COLORS.successGreen}>
            <HStack space="sm" alignItems="center">
              <CheckCircle size={20} color={COLORS.successGreen} />
              <VStack>
                <Text size="xs" color={COLORS.successGreen} fontWeight="$bold">Top Bidder</Text>
                <Text fontWeight="$bold" color={COLORS.textPrimary} size="md">
                  @{activeAuction.topBidder}
                </Text>
              </VStack>
            </HStack>
          </Box>
        ) : (
          <Box bg={COLORS.darkSurface} p="$4" rounded="$xl" borderWidth={1} borderColor={COLORS.darkBorder}>
            <HStack space="sm" alignItems="center">
              <AlertCircle size={20} color={COLORS.textMuted} />
              <Text color={COLORS.textMuted}>No bids yet</Text>
            </HStack>
          </Box>
        )}

        <Divider bg={COLORS.darkBorder} />

        {/* Auction Controls */}
        <VStack space="md">
          <Text fontWeight="$bold" size="md" color={COLORS.textPrimary}>Auction Controls</Text>
          
          <HStack space="sm">
            <Button
              flex={1}
              bg={activeAuction.mode === 'sudden_death' ? COLORS.darkSurface : COLORS.luxuryBlackLight}
              borderWidth={1}
              borderColor={activeAuction.mode === 'sudden_death' ? COLORS.darkBorder : COLORS.primaryGold}
              rounded="$xl"
              isDisabled={activeAuction.mode === 'sudden_death'}
              onPress={() => onExtendAuction(activeAuction.id, 15)}
            >
              <HStack space="xs" alignItems="center">
                <Clock size={16} color={activeAuction.mode === 'sudden_death' ? COLORS.textMuted : COLORS.primaryGold} />
                <ButtonText color={activeAuction.mode === 'sudden_death' ? COLORS.textMuted : COLORS.primaryGold} fontWeight="$bold">+15s</ButtonText>
              </HStack>
            </Button>
            <Button
              flex={1}
              bg={COLORS.successGreen}
              rounded="$xl"
              onPress={() => onMarkAsSold(activeAuction.product.id, activeAuction.id)}
            >
              <HStack space="xs" alignItems="center">
                <CheckCircle size={16} color="white" />
                <ButtonText color="white" fontWeight="$bold">Mark Sold</ButtonText>
              </HStack>
            </Button>
          </HStack>
          
          <Button
            bg="rgba(239, 68, 68, 0.2)"
            borderWidth={1}
            borderColor={COLORS.errorRed}
            rounded="$xl"
            onPress={() => onEndAuctionEarly(activeAuction.id)}
          >
            <HStack space="xs" alignItems="center">
              <X size={16} color={COLORS.errorRed} />
              <ButtonText color={COLORS.errorRed} fontWeight="$bold">End Auction Early</ButtonText>
            </HStack>
          </Button>
        </VStack>
      </VStack>
    );
  };

  const renderStartNewAuctionTab = () => {
    const availableProducts = productQueue.filter(p => p.status === 'upcoming');

    return (
      <VStack space="lg">
        <HStack space="xs" alignItems="center">
          <Box bg={COLORS.successGreen} p="$1.5" rounded="$sm">
            <Play size={16} color="white" />
          </Box>
          <Text fontWeight="$bold" size="md" color={COLORS.textPrimary}>
            Start New Auction
          </Text>
        </HStack>

        {availableProducts.length === 0 ? (
          <Box bg={COLORS.cardBackground} p="$8" rounded="$2xl" alignItems="center" borderWidth={1} borderColor={COLORS.darkBorder}>
            <Package size={48} color={COLORS.textMuted} />
            <Text fontWeight="$bold" color={COLORS.textPrimary} mt="$3" size="md">
              No Products Available
            </Text>
            <Text color={COLORS.textSecondary} mt="$1" textAlign="center" size="sm">
              Add products to your queue first
            </Text>
            <Button
              bg={COLORS.primaryGold}
              mt="$4"
              rounded="$xl"
              onPress={onAddProduct}
            >
              <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
                Add Products
              </ButtonText>
            </Button>
          </Box>
        ) : (
          <VStack space="md">
            <Text fontWeight="$bold" size="sm" color={COLORS.textPrimary}>
              Select Product ({availableProducts.length} available)
            </Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              <VStack space="sm">
                {availableProducts.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedProduct(item.product.id)}
                  >
                    <Box
                      bg={selectedProduct === item.product.id ? COLORS.luxuryBlackLight : COLORS.luxuryBlack}
                      p="$4"
                      rounded="$xl"
                      borderWidth={2}
                      borderColor={selectedProduct === item.product.id ? COLORS.primaryGold : COLORS.darkBorder}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center" flex={1}>
                          <Box 
                            bg={selectedProduct === item.product.id ? COLORS.primaryGold : COLORS.darkSurface}
                            p="$2"
                            rounded="$lg"
                          >
                            <Package 
                              size={20} 
                              color={selectedProduct === item.product.id ? COLORS.luxuryBlack : COLORS.textMuted} 
                            />
                          </Box>
                          <VStack flex={1}>
                            <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1}>
                              {item.product.title}
                            </Text>
                            <Text size="xs" color={COLORS.textSecondary}>
                              ${item.product.price}
                            </Text>
                          </VStack>
                        </HStack>
                        {selectedProduct === item.product.id && (
                          <Box bg={COLORS.primaryGold} p="$2" rounded="$lg">
                            <Radio size={16} color={COLORS.luxuryBlack} />
                          </Box>
                        )}
                      </HStack>
                    </Box>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          </VStack>
        )}

        {availableProducts.length > 0 && (
          <>
            <Divider bg={COLORS.darkBorder} />

            <VStack space="md">
              <Text fontWeight="$bold" size="sm" color={COLORS.textPrimary}>Auction Settings</Text>

              <VStack space="xs">
                <Text size="xs" color={COLORS.textSecondary} fontWeight="$bold">Starting Bid ($)</Text>
                <Input bg={COLORS.darkSurface} rounded="$xl" borderWidth={0}>
                  <InputField
                    keyboardType="numeric"
                    value={auctionConfig.startingBid.toString()}
                    onChangeText={(text) => setAuctionConfig({ ...auctionConfig, startingBid: parseInt(text) || 0 })}
                    color={COLORS.textPrimary}
                    fontWeight="$bold"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="xs" color={COLORS.textSecondary} fontWeight="$bold">Duration</Text>
                <HStack space="sm" flexWrap="wrap">
                  {durationOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setAuctionConfig({ ...auctionConfig, durationSeconds: option.value })}
                    >
                      <Box
                        bg={auctionConfig.durationSeconds === option.value ? COLORS.primaryGold : COLORS.darkSurface}
                        px="$4"
                        py="$3"
                        rounded="$xl"
                        borderWidth={1}
                        borderColor={auctionConfig.durationSeconds === option.value ? COLORS.primaryGold : COLORS.darkBorder}
                      >
                        <Text
                          color={auctionConfig.durationSeconds === option.value ? COLORS.luxuryBlack : COLORS.textPrimary}
                          fontWeight="$bold"
                          size="sm"
                        >
                          {option.label}
                        </Text>
                      </Box>
                    </Pressable>
                  ))}
                </HStack>
              </VStack>

              <VStack space="xs">
                <Text size="xs" color={COLORS.textSecondary} fontWeight="$bold">Auction Type</Text>
                <HStack space="sm">
                  <Pressable
                    flex={1}
                    onPress={() => setAuctionConfig({ ...auctionConfig, auctionType: 'standard' })}
                  >
                    <Box
                      bg={auctionConfig.auctionType === 'standard' ? COLORS.primaryGold : COLORS.darkSurface}
                      p="$4"
                      rounded="$xl"
                      alignItems="center"
                      borderWidth={2}
                      borderColor={auctionConfig.auctionType === 'standard' ? COLORS.primaryGold : COLORS.darkBorder}
                    >
                      <Text
                        color={auctionConfig.auctionType === 'standard' ? COLORS.luxuryBlack : COLORS.textPrimary}
                        fontWeight="$bold"
                      >
                        Standard
                      </Text>
                    </Box>
                  </Pressable>
                  <Pressable
                    flex={1}
                    onPress={() => setAuctionConfig({ ...auctionConfig, auctionType: 'sudden_death' })}
                  >
                    <Box
                      bg={auctionConfig.auctionType === 'sudden_death' ? COLORS.primaryGold : COLORS.darkSurface}
                      p="$4"
                      rounded="$xl"
                      alignItems="center"
                      borderWidth={2}
                      borderColor={auctionConfig.auctionType === 'sudden_death' ? COLORS.primaryGold : COLORS.darkBorder}
                    >
                      <Text
                        color={auctionConfig.auctionType === 'sudden_death' ? COLORS.luxuryBlack : COLORS.textPrimary}
                        fontWeight="$bold"
                      >
                        Sudden Death
                      </Text>
                    </Box>
                  </Pressable>
                </HStack>
              </VStack>

              <Button
                bg={selectedProduct ? COLORS.successGreen : COLORS.darkSurface}
                rounded="$xl"
                py="$4"
                isDisabled={!selectedProduct}
                onPress={() => selectedProduct && onStartAuction(selectedProduct, auctionConfig)}
              >
                <HStack space="sm" alignItems="center">
                  <Play size={20} color={selectedProduct ? 'white' : COLORS.textMuted} />
                  <ButtonText color={selectedProduct ? 'white' : COLORS.textMuted} fontWeight="$bold" size="md">
                    START AUCTION
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </>
        )}

        {showDevTools && onMockAuctionWin && (
          <>
            <Divider bg={COLORS.darkBorder} />
            <VStack space="sm">
              <Text fontWeight="$bold" size="sm" color={COLORS.textPrimary}>
                Dev Tools
              </Text>
              <Button bg={COLORS.primaryGold} rounded="$xl" onPress={onMockAuctionWin}>
                <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
                  Mock Auction Win
                </ButtonText>
              </Button>
            </VStack>
          </>
        )}
      </VStack>
    );
  };

  return (
    <Box
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      bg={COLORS.luxuryBlack}
      zIndex={1000}
      style={{
        elevation: 10,
        shadowColor: COLORS.luxuryBlack,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: 330,
      }}
    >
      {/* Header */}
      <Box bg={COLORS.luxuryBlack} p="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text color={COLORS.primaryGold} fontWeight="$black" size="lg">
            STREAM CONTROLS
          </Text>
          <Pressable onPress={onClose} p="$2">
            <X size={24} color={COLORS.textPrimary} />
          </Pressable>
        </HStack>
      </Box>

      {/* Tabs */}
      <HStack bg={COLORS.cardBackground} borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              flex={1}
              py="$3"
              bg={isActive ? COLORS.luxuryBlack : 'transparent'}
              borderBottomWidth={isActive ? 2 : 0}
              borderColor={COLORS.primaryGold}
              onPress={() => setActiveTab(tab.id)}
            >
              <VStack alignItems="center" space="xs">
                <Icon size={18} color={isActive ? COLORS.primaryGold : COLORS.textSecondary} />
                <Text
                  size="2xs"
                  fontWeight={isActive ? '$bold' : '$normal'}
                  color={isActive ? COLORS.primaryGold : COLORS.textSecondary}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.label}
                </Text>
              </VStack>
            </Pressable>
          );
        })}
      </HStack>

      {/* Content */}
      <ScrollView flex={1} p="$4" showsVerticalScrollIndicator={false}>
        {activeTab === 'queue' && renderQueueTab()}
        {activeTab === 'active' && renderActiveAuctionTab()}
        {activeTab === 'start' && renderStartNewAuctionTab()}
      </ScrollView>
    </Box>
  );
}
