import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  Box,
  Heading,
  Text,
  VStack,
  Input,
  InputField,
  Button,
  ButtonText,
  Center,
  Pressable,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@gluestack-ui/themed";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Always redirect to email verification screen
      // User must verify email before they can log in
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: email },
      });
    } catch (error: any) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            // Removed heavy top padding to allow justifyContent center to work properly
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Added flex={1} and justifyContent='center' here to perfectly center the form */}
          <Box px="$8" flex={1} justifyContent="center">
            <VStack space="xl" w="$full">
              {/* Header: Centered for better visual balance */}
              <VStack space="xs" mb="$4" alignItems="center">
                <Heading
                  size="3xl"
                  color={COLORS.textPrimary}
                  fontWeight="$black"
                  textAlign="center"
                >
                  Create Account
                </Heading>
                <Text color={COLORS.textSecondary} size="md" textAlign="center">
                  Join the live shopping revolution
                </Text>
              </VStack>

              <VStack space="xl">
                <FormControl>
                  <FormControlLabel mb="$2">
                    <FormControlLabelText
                      color={COLORS.textPrimary}
                      fontWeight="$bold"
                      size="sm"
                    >
                      Email Address
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    h={56}
                    borderColor={COLORS.darkBorder}
                    rounded="$xl"
                    mb="$2"
                    justifyContent="center"
                    bg={COLORS.luxuryBlackLight}
                    sx={{ ":focus": { borderColor: COLORS.primaryGold } }}
                  >
                    <InputField
                      placeholder="name@example.com"
                      color={COLORS.textPrimary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor={COLORS.textMuted}
                      style={{ paddingLeft: 16 }}
                    />
                  </Input>
                </FormControl>

                <FormControl>
                  <FormControlLabel mb="$2">
                    <FormControlLabelText
                      color={COLORS.textPrimary}
                      fontWeight="$bold"
                      size="sm"
                    >
                      Password
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    h={56}
                    borderColor={COLORS.darkBorder}
                    rounded="$xl"
                    justifyContent="center"
                    bg={COLORS.luxuryBlackLight}
                    sx={{ ":focus": { borderColor: COLORS.primaryGold } }}
                  >
                    <InputField
                      placeholder="••••••••"
                      color={COLORS.textPrimary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      placeholderTextColor={COLORS.textMuted}
                      style={{ paddingLeft: 16 }}
                    />
                  </Input>
                </FormControl>

                <Button
                  size="xl"
                  variant="solid"
                  isDisabled={loading}
                  onPress={handleRegister}
                  bg={COLORS.primaryGold}
                  rounded="$full"
                  h={56}
                  flex={1}
                  justifyContent="center"
                  mt="$4"
                  p="$1"
                  sx={{ ":active": { opacity: 0.9 } }}
                >
                  <ButtonText
                    fontWeight="$bold"
                    color={COLORS.luxuryBlack}
                    textAlign="center"
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                  </ButtonText>
                </Button>
              </VStack>

              <Center flexDirection="row" mt="$8">
                <Text color={COLORS.textSecondary} size="sm">
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text color={COLORS.primaryGold} fontWeight="$bold" size="sm">
                    Sign In
                  </Text>
                </Pressable>
              </Center>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
