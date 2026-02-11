import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Package } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../../constants/colors";

interface Product {
  id: string;
  title: string;
  images?: string[];
  buyNowPrice?: string;
  startingBid?: string;
  price?: string;
}

interface ProductsSectionProps {
  products: Product[];
}

const ProductCard = ({ product }: { product: Product }) => (
  <TouchableOpacity
    onPress={() => router.push(`/product/${product.id}`)}
    style={styles.card}
    activeOpacity={0.9}
  >
    <View style={styles.imageContainer}>
      {product.images?.[0] && (
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
    </View>
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>
        {product.title}
      </Text>
      <Text style={styles.price}>
        ${product.buyNowPrice || product.startingBid || "0"}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function ProductsSection({ products }: ProductsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MY PRODUCTS</Text>
        <TouchableOpacity onPress={() => router.push("/seller/inventory")}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Package size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No products yet</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/seller/add-product")}
          >
            <LinearGradient
              colors={[COLORS.primaryGold, COLORS.secondaryGold]}
              style={styles.gradientButton}
            >
              <Text style={styles.addButtonText}>Add Your First Product</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  seeAllText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  card: {
    width: 140,
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  imageContainer: {
    width: "100%",
    height: 100,
    backgroundColor: COLORS.cardBackground,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    padding: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  price: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: "900",
  },
});
