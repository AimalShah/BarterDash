import React, { useEffect, useRef } from "react";
import { View, Animated, StatusBar, Dimensions, TouchableOpacity, StyleSheet, Text as RNText } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Box,
  Heading,
  Text,
  Button,
  ButtonText,
  Center,
  VStack,
  HStack,
} from "@gluestack-ui/themed";
import { CheckCircle2, Sparkles, ShoppingBag, Users, Trophy, Shop } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";

const { width } = Dimensions.get("window");

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const { profile } = useAuthStore();
  const isSeller = profile?.is_seller === true;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.replace("/(tabs)");
  };

  const handleBecomeSeller = () => {
    router.push("/seller/onboarding");
  };

  const renderConfetti = () => {
    const particles = [];
    const colors = [COLORS.primaryGold, COLORS.successGreen, COLORS.warningAmber, COLORS.liveIndicator];
    
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * width;
      const delay = Math.random() * 500;
      const duration = 1000 + Math.random() * 1000;
      const size = 8 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particles.push(
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left,
            top: -20,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: size / 2,
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 600],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        />
      );
    }
    return particles;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar barStyle="light-content" />
      <Box safeAreaTop />

      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
        {renderConfetti()}
      </View>

      <Box flex={1} px="$8" justifyContent="center" alignItems="center">
        <VStack space="xl" alignItems="center" maxWidth={400}>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Center
              w={120}
              h={120}
              rounded="$full"
              bg={COLORS.successGreen}
              borderWidth={4}
              borderColor={COLORS.primaryGold}
              mb="$4"
            >
              <CheckCircle2 size={60} color={COLORS.luxuryBlack} strokeWidth={3} />
            </Center>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
            }}
          >
            <HStack space="sm" alignItems="center" mb="$2">
              <Sparkles size={24} color={COLORS.primaryGold} />
              <Text color={COLORS.primaryGold} fontWeight="$bold" size="md" letterSpacing={1}>
                WELCOME ABOARD
              </Text>
              <Sparkles size={24} color={COLORS.primaryGold} />
            </HStack>

            <Heading
              size="3xl"
              color={COLORS.textPrimary}
              fontWeight="$black"
              textAlign="center"
              mb="$4"
            >
              You're All Set!
            </Heading>

            <Text
              color={COLORS.textSecondary}
              size="md"
              textAlign="center"
              lineHeight="$xl"
              mb="$8"
              px="$4"
            >
              Your profile is ready. Start exploring live auctions, connect with sellers, and discover unique items.
            </Text>
          </Animated.View>

          {!isSeller && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                width: "100%",
              }}
            >
              <View style={styles.sellerBox}>
                <View style={styles.sellerIcon}>
                  <Sparkles size={24} color={COLORS.primaryGold} />
                </View>
                <View style={styles.sellerText}>
                  <RNText style={styles.sellerTitle}>Ready to Sell?</RNText>
                  <RNText style={styles.sellerSubtitle}>
                    Turn your passion into profit. Join our seller community.
                  </RNText>
                </View>
                <TouchableOpacity
                  style={styles.sellerButton}
                  onPress={handleBecomeSeller}
                >
                  <LinearGradient
                    colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                    style={styles.sellerGradient}
                  >
                    <Shop size={18} color={COLORS.luxuryBlack} />
                    <RNText style={styles.sellerButtonText}>Become a Seller</RNText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              width: "100%",
            }}
          >
            <Button
              size="xl"
              variant="solid"
              onPress={handleGetStarted}
              bg={COLORS.primaryGold}
              rounded="$full"
              h={60}
              justifyContent="center"
              alignItems="center"
              sx={{
                ":active": { opacity: 0.9, transform: [{ scale: 0.98 }] },
                shadowColor: COLORS.primaryGold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <ButtonText
                fontWeight="$bold"
                color={COLORS.luxuryBlack}
                textAlign="center"
                flex={1}
                size="lg"
              >
                Start Exploring
              </ButtonText>
            </Button>
          </Animated.View>
        </VStack>
      </Box>

      <Box pb={Math.max(insets.bottom, 24)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sellerBox: {
    width: '100%',
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  sellerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.luxuryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sellerText: {
    marginBottom: 16,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sellerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sellerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sellerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sellerButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.luxuryBlack,
  },
});
