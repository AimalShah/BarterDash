import React from "react";
import {
  ScrollView,
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
import { ChevronRight, Sparkles, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useProfileSetup } from "@/hooks/useProfileSetup";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { AvatarUpload } from "@/components/onboarding/AvatarUpload";
import { ProfileForm } from "@/components/onboarding/ProfileForm";

const STEPS = ["Profile", "Interests", "Done"];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const {
    formData,
    uploading,
    isUpdating,
    completedFields,
    errors,
    updateField,
    pickAndUploadImage,
    validateAndSubmit,
    skipProfile,
    progressPercent,
  } = useProfileSetup();

  const isLoading = isUpdating || uploading;

  const handleSuccess = () => {
    setTimeout(() => router.push("/(onboarding)/interests"), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.luxuryBlack, "#1a1a1a", COLORS.luxuryBlack]}
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
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
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
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <AvatarUpload
              avatarUrl={formData.avatarUrl}
              uploading={uploading}
              onPickImage={pickAndUploadImage}
            />
          </View>

          {/* Profile Form */}
          <View style={styles.formSection}>
            <ProfileForm
              username={formData.username}
              fullName={formData.fullName}
              bio={formData.bio}
              errors={errors}
              onUsernameChange={(text) => updateField("username", text)}
              onFullNameChange={(text) => updateField("fullName", text)}
              onBioChange={(text) => updateField("bio", text)}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={() => validateAndSubmit(handleSuccess)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.luxuryBlack} />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <ChevronRight size={20} color={COLORS.luxuryBlack} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => skipProfile(handleSuccess)} disabled={isLoading}>
              <Text style={styles.skipText}>Skip for now</Text>
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
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryGold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 280,
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
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryGold,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.darkBorder,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primaryGold,
    borderRadius: 3,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  actions: {
    gap: 16,
  },
  nextButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.luxuryBlack,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 8,
  },
});
