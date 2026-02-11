import React, { useState, useEffect, useCallback } from "react";
import { StatusBar, ScrollView, Platform, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { categoriesService } from "../../lib/api/services/categories";
import { ChevronLeft } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { COLORS } from "../../constants/colors";
import { useStreamForm } from "../../hooks/useStreamForm";
import { useProductSelection } from "../../hooks/useProductSelection";

import { ThumbnailUpload } from "../../components/seller/ThumbnailUpload";
import { CategoryPicker } from "../../components/seller/CategoryPicker";
import { StreamForm } from "../../components/seller/StreamForm";
import ProductSelector from "../../components/seller/ProductSelector";

export default function CreateStreamScreen() {
  const {
    formData,
    loading,
    uploading,
    localImage,
    updateField,
    setLocalImage,
    setThumbnailUrl,
    setUploading,
    handleCreate,
    validate,
  } = useStreamForm();

  const {
    products,
    selectedProductIds,
    fetchingProducts,
    toggleProduct,
    refreshProducts,
  } = useProductSelection();

  const [categories, setCategories] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProducts();
    }, [refreshProducts]),
  );

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.findAll();
      if (data) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryCreated = (newCategory: { id: string; name: string }) => {
    setCategories(prev => [...prev, newCategory]);
    updateField('categoryId', newCategory.id);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        updateField('scheduledStart', selectedDate);
        DateTimePickerAndroid.open({
          value: selectedDate,
          onChange: (tEvent, tDate) => {
            if (tEvent.type === "set" && tDate) {
              updateField('scheduledStart', tDate);
            }
          },
          mode: "time",
          is24Hour: true,
        });
      }
    } else {
      if (selectedDate) {
        updateField('scheduledStart', selectedDate);
      }
    }
    setShowPicker(false);
  };

  const showDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: formData.scheduledStart,
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
      const { data: { user } } = await supabase.auth.getUser();
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

      const { data: { publicUrl } } = supabase.storage.from("thumbnails").getPublicUrl(filePath);
      setThumbnailUrl(publicUrl);
    } catch (error: any) {
      console.error("Thumbnail upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const onCreate = () => {
    if (validate(selectedProductIds)) {
      handleCreate(selectedProductIds, products);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            title={formData.title}
            onTitleChange={(title) => updateField('title', title)}
            description={formData.description}
            onDescriptionChange={(desc) => updateField('description', desc)}
            scheduleStart={formData.scheduledStart}
            onShowDatePicker={showDatePicker}
            showPicker={showPicker}
            onDateChange={onDateChange}
          />

          <CategoryPicker
            categories={categories}
            selectedCategory={formData.categoryId}
            onSelectCategory={(id) => updateField('categoryId', id)}
            onCategoryCreated={handleCategoryCreated}
          />

          <ProductSelector
            products={products}
            selectedProductIds={selectedProductIds}
            fetchingProducts={fetchingProducts}
            onToggleProduct={toggleProduct}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCreate}
              disabled={loading || uploading}
              style={[styles.createButton, (loading || uploading) && styles.createButtonDisabled]}
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
  footer: {
    marginTop: 16,
  },
  createButton: {
    backgroundColor: COLORS.primaryGold,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: '900',
  },
});
