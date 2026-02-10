import React, { useEffect, useRef } from "react";
import { View, Animated, StatusBar, Dimensions } from "react-native";
import { router } from "expo-router";
import {
  Box,
  Heading,
  Text,
  Button,
  ButtonText,
  Center,
  VStack,
} from "@gluestack-ui/themed";
import { CheckCircle2, Sparkles, ShoppingBag, Users, Trophy } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebrate animation sequence
    Animated.sequence([
      // Scale up the checkmark
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Fade in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Slide up text
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Confetti burst
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

  // Confetti particles
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

      {/* Confetti overlay */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
        {renderConfetti()}
      </View>

      <Box flex={1} px="$8" justifyContent="center" alignItems="center">
        <VStack space="xl" alignItems="center" maxWidth={400}>
          {/* Success Icon */}
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

          {/* Feature highlights */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              width: "100%",
            }}
          >
            <VStack space="md" mb="$8">
              <HStack
                space="md"
                alignItems="center"
                bg={COLORS.luxuryBlackLight}
                p="$4"
                rounded="$xl"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
              >
                <Center w={48} h={48} rounded="$lg" bg={COLORS.primaryGold}>
                  <ShoppingBag size={24} color={COLORS.luxuryBlack} />
                </Center>
                <VStack flex={1}>
                  <Text color={COLORS.textPrimary} fontWeight="$bold" size="md">
                    Discover & Bid
                  </Text>
                  <Text color={COLORS.textMuted} size="sm">
                    Browse live auctions and place bids in real-time
                  </Text>
                </VStack>
              </HStack>

              <HStack
                space="md"
                alignItems="center"
                bg={COLORS.luxuryBlackLight}
                p="$4"
                rounded="$xl"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
              >
                <Center w={48} h={48} rounded="$lg" bg={COLORS.primaryGold}>
                  <Users size={24} color={COLORS.luxuryBlack} />
                </Center>
                <VStack flex={1}>
                  <Text color={COLORS.textPrimary} fontWeight="$bold" size="md">
                    Follow Sellers
                  </Text>
                  <Text color={COLORS.textMuted} size="sm">
                    Get notified when your favorites go live
                  </Text>
                </VStack>
              </HStack>

              <HStack
                space="md"
                alignItems="center"
                bg={COLORS.luxuryBlackLight}
                p="$4"
                rounded="$xl"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
              >
                <Center w={48} h={48} rounded="$lg" bg={COLORS.primaryGold}>
                  <Trophy size={24} color={COLORS.luxuryBlack} />
                </Center>
                <VStack flex={1}>
                  <Text color={COLORS.textPrimary} fontWeight="$bold" size="md">
                    Win Auctions
                  </Text>
                  <Text color={COLORS.textMuted} size="sm">
                    Secure unique items at great prices
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Animated.View>

          {/* CTA Button */}
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
