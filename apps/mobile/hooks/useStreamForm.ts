import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { streamsService } from "../lib/api/services/streams";

interface StreamFormData {
  title: string;
  description: string;
  categoryId: string | null;
  scheduledStart: Date;
  thumbnailUrl: string | null;
}

interface UseStreamFormReturn {
  formData: StreamFormData;
  loading: boolean;
  uploading: boolean;
  localImage: string | null;
  updateField: <K extends keyof StreamFormData>(field: K, value: StreamFormData[K]) => void;
  setLocalImage: (uri: string | null) => void;
  setThumbnailUrl: (url: string | null) => void;
  setUploading: (uploading: boolean) => void;
  handleCreate: (productIds: string[], products: any[]) => Promise<void>;
  validate: (productIds: string[]) => boolean;
}

export function useStreamForm(): UseStreamFormReturn {
  const [formData, setFormData] = useState<StreamFormData>({
    title: "",
    description: "",
    categoryId: null,
    scheduledStart: new Date(Date.now() + 3600000),
    thumbnailUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof StreamFormData>(
    field: K,
    value: StreamFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback((productIds: string[]): boolean => {
    if (!formData.title || !formData.categoryId) {
      Alert.alert("Missing Fields", "Please provide a title and category.");
      return false;
    }

    if (productIds.length === 0) {
      Alert.alert(
        "Products Required",
        "Please select at least one product for this stream."
      );
      return false;
    }

    if (uploading) {
      Alert.alert("Please Wait", "Image is still uploading.");
      return false;
    }

    return true;
  }, [formData.title, formData.categoryId, uploading]);

  const handleCreate = useCallback(async (
    productIds: string[],
    products: any[]
  ): Promise<void> => {
    setLoading(true);
    try {
      const stream = await streamsService.create({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId!,
        scheduledStart: formData.scheduledStart.toISOString(),
        thumbnailUrl: formData.thumbnailUrl || undefined,
      });

      const selectedProducts = products.filter((product: any) =>
        productIds.includes(product.id)
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
          "Stream created, but some products failed to add. You can add them from the stream dashboard."
        );
      }

      router.replace({
        pathname: `/seller/stream/${stream.id}`,
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to create stream");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const setThumbnailUrl = useCallback((url: string | null) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
  }, []);

  return {
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
  };
}
