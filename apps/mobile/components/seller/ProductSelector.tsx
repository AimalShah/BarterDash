import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Check } from "lucide-react-native";
import { router } from "expo-router";
import { COLORS } from "../../constants/colors";

interface Product {
  id: string;
  title: string;
  buyNowPrice?: string;
  startingBid?: string;
  price?: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductIds: string[];
  fetchingProducts: boolean;
  onToggleProduct: (productId: string) => void;
}

const styles = StyleSheet.create({
  productsSection: {
    gap: 12,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  addButton: {
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    backgroundColor: COLORS.luxuryBlackLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.luxuryBlackLight,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  productsList: {
    gap: 8,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlackLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    gap: 12,
  },
  productCardSelected: {
    borderColor: COLORS.primaryGold,
    backgroundColor: `${COLORS.primaryGold}15`,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  productPrice: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '800',
  },
  selectionCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default function ProductSelector({
  products,
  selectedProductIds,
  fetchingProducts,
  onToggleProduct,
}: ProductSelectorProps) {
  if (fetchingProducts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primaryGold} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No products yet. Create one to add it to your stream.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.productsSection}>
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>
          PRODUCTS (REQUIRED)
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/seller/add-product")}
        >
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productsList}>
        {products.map((product: Product) => {
          const selected = selectedProductIds.includes(product.id);
          return (
            <TouchableOpacity
              key={product.id}
              onPress={() => onToggleProduct(product.id)}
              activeOpacity={0.8}
              style={[
                styles.productCard,
                selected && styles.productCardSelected
              ]}
            >
              <View style={[
                styles.checkbox,
                selected && styles.checkboxSelected
              ]}>
                {selected && <Check size={12} color={COLORS.luxuryBlack} />}
              </View>

              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImageText}>IMG</Text>
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>
                  ${product.buyNowPrice || product.startingBid || product.price || "0"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedProductIds.length > 0 && (
        <Text style={styles.selectionCount}>
          {selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected
        </Text>
      )}
    </View>
  );
}
