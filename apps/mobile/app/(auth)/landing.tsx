import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";

export default function LandingScreen() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <ShoppingBag size={40} color={COLORS.luxuryBlack} />
          </LinearGradient>
          
          <Text style={styles.title}>BarterDash</Text>
          <Text style={styles.subtitle}>
            The global stage for elite auctions and luxury collectibles.
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("(auth)/register")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primaryGold, COLORS.secondaryGold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>Create New Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("(auth)/login")}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Terms Section */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By joining, you agree to our{"\n"}
            <Text style={styles.termsLink}>Terms of Curation</Text>
            {" "}&{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: -1,
    textTransform: "uppercase",
    fontStyle: "italic",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  buttonsContainer: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.luxuryBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.luxuryBlack,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  termsContainer: {
    marginTop: 48,
    alignItems: "center",
  },
  termsText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
});
