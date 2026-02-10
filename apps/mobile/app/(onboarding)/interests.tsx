
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { categoriesService } from "@/lib/api/services/categories";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfileMutation } from "@/lib/api/hooks/useUser";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = ["Profile", "Interests", "Done"];

// Fallback categories if API fails
const FALLBACK_INTERESTS = [
  { id: "1", name: "Sneakers" },
  { id: "2", name: "Trading Cards" },
  { id: "3", name: "Electronics" },
  { id: "4", name: "Watches" },
  { id: "5", name: "Streetwear" },
  { id: "6", name: "Vintage" },
  { id: "7", name: "Art" },
  { id: "8", name: "Comics" },
  { id: "9", name: "Toys" },
  { id: "10", name: "Coins" },
  { id: "11", name: "Luxury Bags" },
  { id: "12", name: "NFTs" },
];

export default function InterestsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation();

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.findAll();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(FALLBACK_INTERESTS);
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setCategories(FALLBACK_INTERESTS);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      setSelected(selected.filter((id) => id !== categoryId));
    } else {
      setSelected([...selected, categoryId]);
    }
  };

  const handleContinue = () => {
    const selectedInterests = selected.length > 0
      ? selected.map(id => {
        const category = categories.find(c => c.id === id);
        return category?.name || id;
      })
      : [];

    updateProfile(
      {
        interests: selectedInterests,
        onboarding_step: "notifications",
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchProfile(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push("/(onboarding)/notifications");
        },
        onError: (error: any) => {
          console.error("Interests save error:", error);
          router.push("/(onboarding)/notifications");
        },
      },
    );
  };

  const handleSkip = () => {
    updateProfile(
      { onboarding_step: "notifications" },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchProfile(true);
          router.push("/(onboarding)/notifications");
        },
        onError: () => router.push("/(onboarding)/notifications")
      }
    );
  };

  const isProcessing = loading || isUpdating;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={{ height: insets.top }} />

      <OnboardingProgress steps={STEPS} currentStepIndex={1} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={28} color={COLORS.primaryGold} />
              <Text style={styles.title}>Your Interests</Text>
            </View>
            <Text style={styles.subtitle}>
              Pick a few things you love. We'll show you the best live auctions for them.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryGold} />
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((category, index) => {
                const isSelected = selected.includes(category.id);
                return (
                  <TouchableOpacity
                    key={`${category.id}-${index}`}
                    onPress={() => toggleInterest(category.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected
                    ]}
                  >
                    <Text style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          disabled={isProcessing}
          onPress={selected.length > 0 ? handleContinue : handleSkip}
        >
          <Text style={styles.buttonText}>
            {isUpdating ? "Saving..." : selected.length > 0 ? "Continue" : "Skip"}
          </Text>
          {!isUpdating && <ChevronRight size={20} color={COLORS.luxuryBlack} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1.5,
    borderColor: COLORS.darkBorder,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  categoryTextSelected: {
    color: COLORS.luxuryBlack,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.darkBorder,
    backgroundColor: COLORS.luxuryBlack,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: "800",
  },
});
