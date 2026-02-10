import React, { useState, useEffect } from 'react';
import { StatusBar, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Box,
  Center,
  Text,
  Pressable,
  Heading,
  Button,
  ButtonText,
  VStack,
  HStack,
  Spinner,
  Badge,
  BadgeText,
  Divider,
  Icon,
} from '@gluestack-ui/themed';
import {
  ChevronLeft,
  Video,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Play,
  Package,
  ChevronRight,
} from 'lucide-react-native';
import { streamsService, Stream, StreamProduct } from '../../../lib/api/services/streams';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../constants/colors';

export default function StreamManagementScreen() {
  const { id: streamId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<Stream | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (streamId) {
      fetchStreamDetails();
      fetchStreamProducts();
    }
  }, [streamId]);

  const fetchStreamDetails = async () => {
    try {
      const data = await streamsService.findById(streamId);
      setStream(data);
    } catch (error) {
      console.error('Error fetching stream:', error);
      Alert.alert('Error', 'Failed to load stream details');
    }
  };

  const fetchStreamProducts = async () => {
    try {
      const data = await streamsService.getProducts(streamId);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = () => {
    if (stream?.status === 'ended') {
      Alert.alert('Stream Ended', 'This stream has already ended.');
      return;
    }

    if (stream?.status === 'live') {
      // Stream is already live, join it
      router.push({
        pathname: '/seller/go-live',
        params: { streamId },
      });
      return;
    }

    // Confirm before going live
    Alert.alert(
      'Go Live?',
      'Are you ready to start streaming? This will make your stream visible to all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Live',
          onPress: () => {
            router.push({
              pathname: '/seller/go-live',
              params: { streamId },
            });
          },
        },
      ]
    );
  };

  const handleEditStream = () => {
    if (stream?.status === 'live') {
      Alert.alert('Cannot Edit', 'You cannot edit a live stream.');
      return;
    }
    if (stream?.status === 'ended') {
      Alert.alert('Cannot Edit', 'You cannot edit an ended stream.');
      return;
    }
    router.push(`/seller/stream/edit/${streamId}`);
  };

  const handleCancelStream = async () => {
    if (stream?.status === 'live') {
      Alert.alert('Cannot Cancel', 'You cannot cancel a live stream. Please end it instead.');
      return;
    }
    if (stream?.status === 'ended') {
      Alert.alert('Already Ended', 'This stream has already ended.');
      return;
    }

    Alert.alert(
      'Cancel Stream?',
      'Are you sure you want to cancel this scheduled stream? This action cannot be undone.',
      [
        { text: 'Keep Stream', style: 'cancel' },
        {
          text: 'Cancel Stream',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // TODO: Replace with actual API call when backend is ready
              // await streamsService.cancel(streamId);

              // For now, just delete from Supabase directly
              const { error } = await supabase
                .from('streams')
                .delete()
                .eq('id', streamId);

              if (error) throw error;

              Alert.alert('Success', 'Stream cancelled successfully');
              router.replace('/seller/dashboard');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel stream');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    router.push(`/seller/stream/add-product/${streamId}`);
  };

  const handleRemoveProduct = (streamProductId: string, productTitle: string) => {
    Alert.alert(
      'Remove Product?',
      `Are you sure you want to remove "${productTitle}" from this stream?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await streamsService.removeProduct(streamId, streamProductId);
              // Refresh the product list
              fetchStreamProducts();
              Alert.alert('Success', 'Product removed from stream');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove product');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return COLORS.liveIndicator;
      case 'scheduled':
        return '$blue500';
      case 'ended':
        return COLORS.textMuted;
      default:
        return COLORS.textMuted;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box flex={1} bg={COLORS.luxuryBlack}>
        <Center flex={1}>
          <VStack space="lg" alignItems="center">
            <Spinner size="large" color={COLORS.primaryGold} />
            <Text fontWeight="$bold" color={COLORS.textSecondary}>
              Loading Stream...
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (!stream) {
    return (
      <Box flex={1} bg={COLORS.luxuryBlack}>
        <Center flex={1} px="$10">
          <VStack space="2xl" alignItems="center">
            <Heading color={COLORS.textPrimary} size="2xl">
              Stream Not Found
            </Heading>
            <Text color={COLORS.textSecondary} textAlign="center">
              The stream you're looking for could not be found or has been removed.
            </Text>
            <Button
              size="lg"
              onPress={() => router.replace('/seller/dashboard')}
              bg={COLORS.primaryGold}
            >
              <ButtonText color={COLORS.luxuryBlack}>Back to Dashboard</ButtonText>
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  const isScheduled = stream.status === 'scheduled';
  const isLive = stream.status === 'live';
  const isEnded = stream.status === 'ended';

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space="sm">
            <Pressable
              onPress={() => router.back()}
              h={44}
              w={44}
              rounded="$sm"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor={COLORS.primaryGold}
              bg={COLORS.luxuryBlackLight}
            >
              <ChevronLeft size={24} color={COLORS.primaryGold} />
            </Pressable>
            <VStack>
              <Heading size="md" color={COLORS.textPrimary}>
                Stream Management
              </Heading>
              <Text size="xs" color={COLORS.textMuted}>
                Manage your stream before going live
              </Text>
            </VStack>
          </HStack>
          <Badge
            size="md"
            variant="solid"
            borderRadius="$sm"
            bg={isLive ? COLORS.liveIndicator : isScheduled ? '$blue500' : COLORS.textMuted}
          >
            <BadgeText color={COLORS.textPrimary} fontWeight="$bold">
              {stream.status.toUpperCase()}
            </BadgeText>
          </Badge>
        </HStack>
      </Box>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="xl" p="$6">
          {/* Stream Info Card */}
          <Box
            bg={COLORS.luxuryBlackLight}
            p="$6"
            rounded="$lg"
            borderWidth={2}
            borderColor={COLORS.darkBorder}
          >
            <VStack space="lg">
              <HStack alignItems="center" space="md">
                <Box
                  bg={COLORS.primaryGold}
                  p="$3"
                  rounded="$sm"
                >
                  <Video size={24} color={COLORS.luxuryBlack} />
                </Box>
                <VStack flex={1}>
                  <Heading size="md" color={COLORS.textPrimary} numberOfLines={2}>
                    {stream.title}
                  </Heading>
                  {stream.category && (
                    <Text size="xs" color={COLORS.textMuted}>
                      {stream.category.name}
                    </Text>
                  )}
                </VStack>
              </HStack>

              <Divider bg={COLORS.darkBorder} />

              <VStack space="md">
                <HStack alignItems="center" space="sm">
                  <Calendar size={16} color={COLORS.primaryGold} />
                  <Text size="sm" color={COLORS.textSecondary}>
                    Scheduled: {formatDate(stream.scheduledStart)}
                  </Text>
                </HStack>
                {stream.description && (
                  <Text size="sm" color={COLORS.textSecondary} numberOfLines={3}>
                    {stream.description}
                  </Text>
                )}
              </VStack>
            </VStack>
          </Box>

          {/* Action Buttons */}
          <VStack space="md">
            {/* Go Live Button - Only show for scheduled streams */}
            {(isScheduled || isLive) && (
              <Button
                size="xl"
                onPress={handleGoLive}
                bg={isLive ? COLORS.liveIndicator : COLORS.primaryGold}
                rounded="$sm"
                h={56}
              >
                <HStack space="sm" alignItems="center">
                  <Play size={20} color={COLORS.luxuryBlack} fill={COLORS.luxuryBlack} />
                  <ButtonText fontWeight="$black" size="md" color={COLORS.luxuryBlack}>
                    {isLive ? 'JOIN LIVE STREAM' : 'GO LIVE'}
                  </ButtonText>
                </HStack>
              </Button>
            )}

            {/* Edit Button - Only for scheduled streams */}
            {isScheduled && (
              <Button
                size="lg"
                variant="outline"
                onPress={handleEditStream}
                borderColor={COLORS.primaryGold}
                rounded="$sm"
                h={50}
              >
                <HStack space="sm" alignItems="center">
                  <Edit3 size={18} color={COLORS.primaryGold} />
                  <ButtonText color={COLORS.primaryGold} fontWeight="$bold">
                    Edit Stream Details
                  </ButtonText>
                </HStack>
              </Button>
            )}

            {/* Cancel Button - Only for scheduled streams */}
            {isScheduled && (
              <Button
                size="lg"
                variant="outline"
                onPress={handleCancelStream}
                borderColor={COLORS.errorRed}
                rounded="$sm"
                h={50}
                isDisabled={deleting}
              >
                <HStack space="sm" alignItems="center">
                  <Trash2 size={18} color={COLORS.errorRed} />
                  <ButtonText color={COLORS.errorRed} fontWeight="$bold">
                    {deleting ? 'Cancelling...' : 'Cancel Stream'}
                  </ButtonText>
                </HStack>
              </Button>
            )}
          </VStack>

          {/* Product Queue Section */}
          <Box>
            <HStack justifyContent="space-between" alignItems="center" mb="$4">
              <Heading size="sm" color={COLORS.textPrimary}>
                Product Queue ({products.length})
              </Heading>
              {isScheduled && (
                <Pressable onPress={handleAddProduct}>
                  <HStack space="xs" alignItems="center">
                    <Text size="sm" color={COLORS.primaryGold} fontWeight="$bold">
                      + Add Product
                    </Text>
                  </HStack>
                </Pressable>
              )}
            </HStack>

            {products.length === 0 ? (
              <Box
                bg={COLORS.luxuryBlackLight}
                p="$8"
                rounded="$lg"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
                alignItems="center"
              >
                <Package size={48} color={COLORS.textMuted} />
                <Text color={COLORS.textSecondary} textAlign="center" mt="$4">
                  No products in queue yet
                </Text>
                <Text size="xs" color={COLORS.textMuted} textAlign="center" mt="$1">
                  Add products to showcase during your stream
                </Text>
                {isScheduled && (
                  <Button
                    size="sm"
                    mt="$4"
                    onPress={handleAddProduct}
                    bg={COLORS.primaryGold}
                  >
                    <ButtonText color={COLORS.luxuryBlack}>Add Your First Product</ButtonText>
                  </Button>
                )}
              </Box>
            ) : (
              <VStack space="md">
                {products.map((item, index) => (
                  <Box
                    key={item.id}
                    bg={COLORS.luxuryBlackLight}
                    p="$4"
                    rounded="$lg"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space="md" alignItems="center" flex={1}>
                        <Box
                          bg={COLORS.luxuryBlackLighter}
                          h={50}
                          w={50}
                          rounded="$sm"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontWeight="$bold" color={COLORS.textMuted}>
                            {index + 1}
                          </Text>
                        </Box>
                        <VStack flex={1}>
                          <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1}>
                            {item.product?.title || 'Unknown Product'}
                          </Text>
                          <Text size="xs" color={COLORS.textMuted}>
                            Starting: ${item.product?.price || '0'}
                          </Text>
                          <HStack space="sm" alignItems="center" mt="$1">
                            <Box
                              px="$2"
                              py="$0.5"
                              rounded="$sm"
                              bg={
                                item.status === 'active' ? `${COLORS.successGreen}30` :
                                item.status === 'sold' ? `${COLORS.primaryGold}30` :
                                item.status === 'passed' ? `${COLORS.textMuted}30` :
                                `${COLORS.warningAmber}30`
                              }
                            >
                              <Text
                                size="2xs"
                                fontWeight="$bold"
                                color={
                                  item.status === 'active' ? COLORS.successGreen :
                                  item.status === 'sold' ? COLORS.primaryGold :
                                  item.status === 'passed' ? COLORS.textSecondary :
                                  COLORS.warningAmber
                                }
                                textTransform="uppercase"
                              >
                                {item.status}
                              </Text>
                            </Box>
                          </HStack>
                        </VStack>
                      </HStack>
                      
                      {isScheduled && (
                        <Pressable
                          onPress={() => handleRemoveProduct(item.id, item.product?.title || 'Product')}
                          p="$2"
                          rounded="$sm"
                        >
                          <Trash2 size={18} color={COLORS.errorRed} />
                        </Pressable>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Info Box */}
          <Box
            bg={`${COLORS.primaryGold}15`}
            p="$4"
            rounded="$lg"
            borderWidth={1}
            borderColor={`${COLORS.primaryGold}30`}
          >
            <Text size="xs" color={COLORS.primaryGold}>
              <Text fontWeight="$bold">Tip:</Text> Add products to your queue before going live. You can start auctions, mark items as sold, and interact with viewers during your stream.
            </Text>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}
