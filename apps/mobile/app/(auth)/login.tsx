
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Pressable,
} from "@gluestack-ui/themed";
import { useAuthStore } from "@/store/authStore";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <Input
                  variant="rounded"
                  size="xl"
                  style={styles.input}
                  isDisabled={loading}
                >
                  <InputField
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    color={COLORS.textPrimary}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </Input>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <Input
                  variant="rounded"
                  size="xl"
                  style={styles.input}
                  isDisabled={loading}
                >
                  <InputField
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    color={COLORS.textPrimary}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </Input>
                <Pressable
                  onPress={() => router.push("/(auth)/forgot-password")}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              </View>

              <Button
                size="xl"
                variant="solid"
                action="primary"
                isDisabled={loading}
                onPress={handleLogin}
                style={styles.signInButton}
              >
                <ButtonText style={styles.signInText}>
                  {loading ? "Signing in..." : "Sign In"}
                </ButtonText>
              </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </Pressable>
            </View>
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
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    height: 56,
    borderRadius: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: "600",
  },
  signInButton: {
    backgroundColor: COLORS.primaryGold,
    height: 56,
    borderRadius: 28,
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: "700",
  },
});
