import React, { useState, useEffect } from 'react';
import { StatusBar, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Box,
  Heading,
  HStack,
  Pressable,
  Spinner,
  Button,
  ButtonText,
  VStack,
  Text,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckIcon,
  Image,
} from '@gluestack-ui/themed';
import { ChevronLeft, Package } from 'lucide-react-native';
import { COLORS } from '../../../../constants/colors';
import { streamsService, StreamProduct } from '../../../../lib/api/services/streams';
import { productsService } from '../../../../lib/api/services/products';
import { Product } from '../../../../types';

interface SelectableProduct extends Product {
  selected: boolean;
}

export default function AddProductToStreamScreen() {
  const { id: streamId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [products, setProducts] = useState<SelectableProduct[]>([]);
  const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (streamId) {
      fetchData();
    }
  }, [streamId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myProducts, currentStreamProducts] = await Promise.all([
        productsService.getMyProducts(),
        streamsService.getProducts(streamId),
      ]);

      setStreamProducts(currentStreamProducts);

      // Filter out products already in the stream
      const existingProductIds = new Set(currentStreamProducts.map(sp => sp.productId));
      const availableProducts = myProducts
        .filter(p => !existingProductIds.has(p.id))
        .map(p => ({ ...p, selected: false }));

      setProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const setProductSelected = (productId: string, isSelected: boolean) => {
    setProducts(prev => {
      const updated = prev.map(p =>
        p.id === productId ? { ...p, selected: isSelected } : p
      );
      const count = updated.filter(p => p.selected).length;
      setSelectedCount(count);
      return updated;
    });
  };

  const toggleProduct = (productId: string) => {
    setProducts(prev => {
      const updated = prev.map(p =>
        p.id === productId ? { ...p, selected: !p.selected } : p
      );
      const count = updated.filter(p => p.selected).length;
      setSelectedCount(count);
      return updated;
    });
  };

  const handleAddProducts = async () => {
    const selectedProducts = products.filter(p => p.selected);
    
    if (selectedProducts.length === 0) {
      Alert.alert('No Products Selected', 'Please select at least one product to add.');
      return;
    }

    setAdding(true);
    try {
      // Add products sequentially
      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        const displayOrder = (streamProducts?.length || 0) + i;
        
        console.log(`[AddProduct] Adding product ${i + 1}/${selectedProducts.length}:`, {
          productId: product.id,
          displayOrder,
          streamProductsLength: streamProducts?.length,
        });
        
        await streamsService.addProduct(streamId, {
          productId: product.id,
          displayOrder: displayOrder,
        });
      }

      Alert.alert(
        'Success',
        `${selectedProducts.length} product(s) added to stream successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('[AddProduct] Error adding products:', error);
      Alert.alert('Error', error?.response?.data?.error?.message || error.message || 'Failed to add products to stream');
    } finally {
      setAdding(false);
    }
  };

  const renderProduct = ({ item }: { item: SelectableProduct }) => (
    <Pressable
      onPress={() => toggleProduct(item.id)}
      p="$4"
      borderWidth={1}
      borderColor={item.selected ? COLORS.primaryGold : COLORS.darkBorder}
      rounded="$lg"
      bg={item.selected ? `${COLORS.primaryGold}15` : COLORS.luxuryBlackLight}
      mb="$3"
    >
      <HStack space="md" alignItems="center">
        <Checkbox
          value={item.id}
          isChecked={item.selected}
          onChange={(isChecked: boolean) => setProductSelected(item.id, isChecked)}
          size="md"
        >
          <CheckboxIndicator borderColor={item.selected ? COLORS.primaryGold : COLORS.darkBorder} bg={item.selected ? COLORS.primaryGold : 'transparent'}>
            <CheckboxIcon as={CheckIcon} color={COLORS.luxuryBlack} />
          </CheckboxIndicator>
        </Checkbox>

        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            alt={item.title}
            h={60}
            w={60}
            rounded="$sm"
            resizeMode="cover"
          />
        ) : (
          <Box
            h={60}
            w={60}
            rounded="$sm"
            bg={COLORS.luxuryBlackLighter}
            alignItems="center"
            justifyContent="center"
          >
            <Package size={24} color={COLORS.textMuted} />
          </Box>
        )}

        <VStack flex={1} space="xs">
          <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={2}>
            {item.title}
          </Text>
          <Text size="sm" color={COLORS.textMuted}>
            ${item.startingBid || item.price || '0'}
          </Text>
          <Text size="xs" color={COLORS.textSecondary}>
            {item.condition}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );

  if (loading) {
    return (
      <Box flex={1} bg={COLORS.luxuryBlack} safeArea>
        <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
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
            <Heading size="md" color={COLORS.textPrimary}>
              Add Products
            </Heading>
          </HStack>
        </Box>
        <Box flex={1} justifyContent="center" alignItems="center">
          <VStack space="lg" alignItems="center">
            <Spinner size="large" color={COLORS.primaryGold} />
            <Text fontWeight="$bold" color={COLORS.textSecondary}>
              Loading Products...
            </Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  const availableCount = products.length;

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />
      <Box safeAreaTop />

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
                Add Products
              </Heading>
              <Text size="xs" color={COLORS.textMuted}>
                {availableCount} available
              </Text>
            </VStack>
          </HStack>
          
          {selectedCount > 0 && (
            <Box bg={COLORS.primaryGold} px="$3" py="$1" rounded="$sm">
              <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="sm">
                {selectedCount} selected
              </Text>
            </Box>
          )}
        </HStack>
      </Box>

      {availableCount === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center" px="$10">
          <VStack space="xl" alignItems="center">
            <Box
              p="$8"
              bg={COLORS.luxuryBlackLight}
              rounded="$lg"
              borderWidth={1}
              borderColor={COLORS.darkBorder}
            >
              <Package size={48} color={COLORS.textMuted} />
            </Box>
            <VStack space="sm" alignItems="center">
              <Heading size="md" color={COLORS.textPrimary} textAlign="center">
                No Products Available
              </Heading>
              <Text color={COLORS.textSecondary} textAlign="center">
                All your products have already been added to this stream, or you haven't created any products yet.
              </Text>
            </VStack>
            <Button
              size="lg"
              onPress={() => router.push('/seller/add-product')}
              bg={COLORS.primaryGold}
              mt="$4"
            >
              <ButtonText color={COLORS.luxuryBlack}>Create New Product</ButtonText>
            </Button>
          </VStack>
        </Box>
      ) : (
        <>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Action Bar */}
          <Box
            bg={COLORS.luxuryBlack}
            px="$6"
            py="$4"
            borderTopWidth={1}
            borderColor={COLORS.darkBorder}
          >
            <Button
              size="xl"
              onPress={handleAddProducts}
              bg={COLORS.primaryGold}
              rounded="$sm"
              h={56}
              isDisabled={selectedCount === 0 || adding}
            >
              <ButtonText fontWeight="$black" size="md" color={COLORS.luxuryBlack}>
                {adding 
                  ? 'Adding...' 
                  : `Add ${selectedCount > 0 ? `${selectedCount} ` : ''}Product${selectedCount !== 1 ? 's' : ''}`
                }
              </ButtonText>
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
