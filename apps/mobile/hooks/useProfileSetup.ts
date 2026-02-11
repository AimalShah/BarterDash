import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useUpdateProfileMutation } from "../lib/api/hooks/useUser";

export interface ProfileFormData {
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
}

interface UseProfileSetupReturn {
  formData: ProfileFormData;
  userId: string | null;
  uploading: boolean;
  isUpdating: boolean;
  completedFields: number;
  errors: { username?: string; fullName?: string; bio?: string };
  updateField: (field: keyof ProfileFormData, value: string) => void;
  pickAndUploadImage: () => Promise<void>;
  validateAndSubmit: (onSuccess: () => void) => void;
  skipProfile: (onSuccess: () => void) => void;
  progressPercent: number;
}

export function useProfileSetup(): UseProfileSetupReturn {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    fullName: "",
    bio: "",
    avatarUrl: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; fullName?: string; bio?: string }>({});

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata?.full_name || "",
          username: user.email
            ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
            : "",
        }));
      }
    });
  }, []);

  const completedFields = [
    formData.fullName.trim(),
    formData.username.trim() && !errors.username,
    formData.bio.trim(),
    formData.avatarUrl,
  ].filter(Boolean).length;

  const progressPercent = Math.min((completedFields / 4) * 100, 100);

  const updateField = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "username" || field === "fullName" || field === "bio") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const pickAndUploadImage = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "User session not found.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const asset = result.assets[0];
      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      if (!asset.base64) throw new Error("Failed to read image data.");

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(asset.base64), {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }));
    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { username?: string; fullName?: string; bio?: string } = {};

    if (formData.fullName.trim() && formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, and underscores allowed";
    }

    if (formData.bio.trim() && formData.bio.trim().length > 160) {
      newErrors.bio = "Bio must be 160 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitProfile = useCallback(
    (data: ProfileFormData, onSuccess: () => void) => {
      updateProfile(
        {
          id: userId!,
          username: data.username.trim().toLowerCase(),
          full_name: data.fullName.trim() || undefined,
          avatar_url: data.avatarUrl || undefined,
          bio: data.bio.trim() || undefined,
          onboarding_step: "interests",
        },
        {
          onSuccess: async () => {
            await useAuthStore.getState().fetchProfile(true);
            onSuccess();
          },
          onError: (error: any) => {
            if (error.message?.includes("username")) {
              setErrors((prev) => ({ ...prev, username: error.message }));
            } else {
              Alert.alert("Error", error.message || "Something went wrong.");
            }
          },
        }
      );
    },
    [userId, updateProfile]
  );

  const validateAndSubmit = useCallback(
    (onSuccess: () => void) => {
      if (!validateForm()) return;
      submitProfile(formData, onSuccess);
    },
    [formData, validateForm, submitProfile]
  );

  const skipProfile = useCallback(
    (onSuccess: () => void) => {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const submitData: ProfileFormData = {
        username: formData.username.trim() || `user_${randomSuffix}`,
        fullName: formData.fullName.trim() || "BarterDash User",
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
      };
      submitProfile(submitData, onSuccess);
    },
    [formData, submitProfile]
  );

  return {
    formData,
    userId,
    uploading,
    isUpdating,
    completedFields,
    errors,
    updateField,
    pickAndUploadImage,
    validateAndSubmit,
    skipProfile,
    progressPercent,
  };
}
