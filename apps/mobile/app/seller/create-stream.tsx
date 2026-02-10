import React, { useState, useEffect, useCallback } from "react";
import { StatusBar, Alert, ScrollView, Platform, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { streamsService } from "../../lib/api/services/streams";
import { categoriesService } from "../../lib/api/services/categories";
import { productsService } from "../../lib/api/services/products";
import { ChevronLeft, Check } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { COLORS } from "../../constants/colors";

// Extracted Components
import { ThumbnailUpload } from "../../components/seller/ThumbnailUpload";
import { CategoryPicker } from "../../components/seller/CategoryPicker";
import { StreamForm } from "../../components/seller/StreamForm";

export default function CreateStreamScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [scheduleStart, setScheduleStart] = useState(
    new Date(Date.now() + 3600000),
  );
  const [showPicker, setShowPicker] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.findAll();
      if (data) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      setFetchingProducts(true);
      const data = await productsService.getMyProducts();
      const productList = data || [];
      setProducts(productList);
      setSelectedProductIds((prev) =>
        prev.filter((id) => productList.some((product: any) => product.id === id)),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleCategoryCreated = (newCategory: { id: string; name: string }) => {
    // Add new category to list and select it
    setCategories(prev => [...prev, newCategory]);
    setSelectedCategory(newCategory.id);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setScheduleStart(selectedDate);
        // After date is picked, open time picker
        DateTimePickerAndroid.open({
          value: selectedDate,
          onChange: (tEvent, tDate) => {
            if (tEvent.type === "set" && tDate) {
              setScheduleStart(tDate);
            }
          },
          mode: "time",
          is24Hour: true,
        });
      }
    } else {
      if (selectedDate) {
        setScheduleStart(selectedDate);
      }
    }
    setShowPicker(false);
  };

  const showDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: scheduleStart,
        onChange: onDateChange,
        mode: "date",
        minimumDate: new Date(),
      });
    } else {
      setShowPicker(true);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setLocalImage(asset.uri);
    uploadThumbnail(asset);
  };

  const uploadThumbnail = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `streams/${user.id}/${Date.now()}.${fileExt}`;

      if (!asset.base64) throw new Error("Failed to read image data.");

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, decode(asset.base64), {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(filePath);

      setThumbnailUrl(publicUrl);
    } catch (error: any) {
      console.error("Thumbnail upload error:", error);
      Alert.alert(
        "Upload Error",
        error.message || "Failed to upload thumbnail.",
      );
    } finally {
      setUploading(false);
    }
  };

  const setProductSelected = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };


  const handleCreate = async () => {
    if (!title || !selectedCategory) {
      Alert.alert("Missing Fields", "Please provide a title and category.");
      return;
    }

    if (selectedProductIds.length === 0) {
      Alert.alert(
        "Products Required",
        "Please select at least one product for this stream.",
      );
      return;
    }

    if (uploading) {
      Alert.alert("Please Wait", "Image is still uploading.");
      return;
    }

    setLoading(true);
    try {
      const stream = await streamsService.create({
        title,
        description,
        categoryId: selectedCategory,
        scheduledStart: scheduleStart.toISOString(),
        thumbnailUrl: thumbnailUrl || undefined,
      });

      const selectedProducts = products.filter((product: any) =>
        selectedProductIds.includes(product.id),
      );

      try {
        for (let i = 0; i < selectedProducts.length; i++) {
          const product = selectedProducts[i];
          await streamsService.addProduct(stream.id, {
            productId: product.id,
            displayOrder: i,
          });
        }
      } catch (error: any) {
        console.error("Error adding products to stream:", error);
        Alert.alert(
          "Stream Created",
          "Stream created, but some products failed to add. You can add them from the stream dashboard.",
        );
      }

      // Navigate to stream management page
      router.replace({
        pathname: `/seller/stream/${stream.id}`,
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW STREAM</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <ThumbnailUpload
            localImage={localImage}
            uploading={uploading}
            onPickImage={pickImage}
          />

          <StreamForm
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            scheduleStart={scheduleStart}
            onShowDatePicker={showDatePicker}
            showPicker={showPicker}
            onDateChange={onDateChange}
          />

          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onCategoryCreated={handleCategoryCreated}
          />

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

            {fetchingProducts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primaryGold} />
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No products yet. Create one to add it to your stream.
                </Text>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.map((product: any) => {
                  const selected = selectedProductIds.includes(product.id);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => setProductSelected(product.id)}
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

                      {/* Placeholder for Product Image logic since native image handles uri slightly differently */}
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
            )}

            {selectedProductIds.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedProductIds.length} product{selectedProductIds.length === 1 ? "" : "s"} selected
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || uploading}
              style={[
                styles.createButton,
                (loading || uploading) && styles.createButtonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.luxuryBlack} />
              ) : (
                <Text style={styles.createButtonText}>Create Stream</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  content: {
    padding: 24,
    gap: 24,
  },
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
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
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
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: COLORS.primaryGold,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
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
    backgroundColor: COLORS.luxuryBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  productPrice: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  selectionCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    marginTop: 24,
  },
  createButton: {
    height: 56,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
