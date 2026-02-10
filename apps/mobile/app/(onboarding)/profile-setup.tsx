
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChevronRight,
  Sparkles,
  User,
  Camera,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfileMutation } from "@/lib/api/hooks/useUser";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { AvatarUpload } from "@/components/onboarding/AvatarUpload";
import { ProfileForm } from "@/components/onboarding/ProfileForm";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = ["Profile", "Interests", "Done"];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [completedFields, setCompletedFields] = useState(0);

  const [errors, setErrors] = useState<{
    username?: string;
    fullName?: string;
    bio?: string;
  }>({});

  // Calculate completion progress
  useEffect(() => {
    let count = 0;
    if (fullName.trim()) count++;
    if (username.trim() && !errors.username) count++;
    if (bio.trim()) count++;
    if (avatarUrl) count++;
    setCompletedFields(count);
  }, [fullName, username, bio, avatarUrl, errors]);

  useEffect(() => {
    // @ts-ignore - getUser exists on supabase.auth v2 but types are mismatching
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setFullName(user.user_metadata?.full_name || "");
        if (user.email) {
          const suggestedUsername = user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          setUsername(suggestedUsername);
        }
      } else {
        router.replace("/(auth)/landing");
      }
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { username?: string; fullName?: string; bio?: string } = {};

    if (fullName.trim() && fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Only letters, numbers, and underscores allowed";
    }

    if (bio.trim() && bio.trim().length > 160) {
      newErrors.bio = "Bio must be 160 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation();

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    const finalAvatarUrl = avatarUrl || null;

    updateProfile(
      {
        id: userId!,
        username: username.trim().toLowerCase(),
        full_name: fullName.trim() || undefined,
        avatar_url: finalAvatarUrl || undefined,
        bio: bio.trim() || undefined,
        onboarding_step: "interests",
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchProfile(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push("/(onboarding)/interests");
        },
        onError: (error: any) => {
          console.error("Profile setup error:", error);
          if (error.response?.status === 429) {
            Alert.alert(
              "Too Many Requests",
              "Please wait a moment before trying again.",
            );
          } else if (error.message?.includes("username") || error.message?.includes("Username")) {
            setErrors((prev) => ({
              ...prev,
              username: error.message || "Username is already taken",
            }));
          } else {
            Alert.alert(
              "Error",
              error.message || "Something went wrong saving your profile.",
            );
          }
        },
      },
    );
  };

  const pickImage = async () => {
    if (!userId) {
      Alert.alert("Error", "User session not found. Please try again.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;
      if (!result.assets || result.assets.length === 0) return;

      uploadAvatar(result.assets[0]);
    } catch (err) {
      console.error("ImagePicker error:", err);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);

      const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      if (!asset.base64) {
        throw new Error("Failed to read image data.");
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(asset.base64), {
          contentType: asset.mimeType ?? "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Upload Error", error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    let submitUsername = username.trim();
    let submitFullName = fullName.trim();

    if (!submitUsername) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      submitUsername = `user_${randomSuffix}`;
    }

    if (!submitFullName) {
      submitFullName = "BarterDash User";
    }

    updateProfile(
      {
        id: userId!,
        username: submitUsername.toLowerCase(),
        full_name: submitFullName,
        avatar_url: avatarUrl || undefined,
        bio: bio.trim() || undefined,
        onboarding_step: "interests",
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchProfile(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push("/(onboarding)/interests");
        },
        onError: (error: any) => {
          console.error("Skip profile error:", error);
          Alert.alert("Error", "Could not skip setup. Please try saving.");
        },
      },
    );
  };

  const isLoading = isUpdating || uploading;
  const progressPercent = Math.min((completedFields / 4) * 100, 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.luxuryBlack, '#1a1a1a', COLORS.luxuryBlack]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ height: insets.top }} />

      <OnboardingProgress steps={STEPS} currentStepIndex={0} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <User size={24} color={COLORS.luxuryBlack} />
              </View>
              <Sparkles size={24} color={COLORS.primaryGold} />
            </View>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>
              Let's make it yours. Add a photo and tell us about yourself.
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Profile completion</Text>
              <Text style={styles.progressValue}>{completedFields}/4</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` }
                ]}
              />
            </View>
          </View>

          <AvatarUpload
            avatarUrl={avatarUrl}
            uploading={uploading}
            onPickImage={pickImage}
          />

          <View style={styles.formContainer}>
            <ProfileForm
              fullName={fullName}
              username={username}
              bio={bio}
              errors={errors}
              onFullNameChange={(text: string) => {
                setFullName(text);
                if (errors.fullName)
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              onUsernameChange={(text: string) => {
                setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                if (errors.username)
                  setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              onBioChange={(text: string) => {
                setBio(text);
                if (errors.bio)
                  setErrors((prev) => ({ ...prev, bio: undefined }));
              }}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isUpdating ? "Saving..." : "Continue"}
              </Text>
              {!isUpdating && <ChevronRight size={20} color={COLORS.luxuryBlack} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              disabled={isLoading}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>
                {isLoading ? "Please wait..." : "Skip for now"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.luxuryBlackLighter,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primaryGold,
    borderRadius: 2,
  },
  formContainer: {
    marginTop: 8,
  },
  actionContainer: {
    marginTop: 48,
    marginBottom: 20,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
  },
  buttonText: {
    color: COLORS.luxuryBlack,
    fontSize: 18,
    fontWeight: "800",
  },
  skipButton: {
    marginTop: 20,
    alignItems: "center",
    padding: 10,
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});

