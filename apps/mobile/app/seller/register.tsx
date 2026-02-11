import React, { useState } from "react";
import {
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Pressable,
  Button,
  ButtonText,
  Spinner,
} from "@gluestack-ui/themed";
import { useToast } from "@/context/ToastContext";
import { ChevronLeft } from "lucide-react-native";
import { sellersService } from "@/lib/api/services/sellers";
import { COLORS } from "../../constants/colors";
import { useSellerApplication } from "../../hooks/useSellerApplication";

import StepIndicator from "../../components/seller/application/StepIndicator";
import BusinessInfoStep from "../../components/seller/application/BusinessInfoStep";
import DocumentUploadStep from "../../components/seller/application/DocumentUploadStep";
import ReviewStep from "../../components/seller/application/ReviewStep";

const STEPS = ["Business Info", "KYC Documents", "Review"];

const getApiErrorMessage = (error: any) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const getApiErrorCode = (error: any) => error?.response?.data?.error?.code;

export default function SellerApplicationScreen() {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    formData,
    selectedDocType,
    errors,
    applicationStarted,
    updateField,
    setSelectedDocType,
    pickDocument,
    removeDocument,
    validateStep,
    startApplication,
    submitApplication,
    startVerification,
    getMissingRequiredDocs,
    setApplicationStarted,
  } = useSellerApplication();

  const handleNext = async () => {
    if (loading) return;
    if (!validateStep(step)) return;

    if (step === 0) {
      try {
        setLoading(true);
        await startApplication();
        setStep(step + 1);
      } catch (error: any) {
        const message = getApiErrorMessage(error);
        const code = getApiErrorCode(error);
        if (
          code === "CONFLICT" ||
          (typeof message === "string" &&
            message.toLowerCase().includes("already has a seller application"))
        ) {
          try {
            const statusResponse = await sellersService.getApplicationStatus();
            const status = statusResponse?.application?.status;
            if (status && !["draft", "more_info_needed"].includes(status)) {
              Alert.alert(
                "Application In Progress",
                `Your application status is "${status.replace(/_/g, " ")}". You can continue once it's back in draft.`
              );
              return;
            }
          } catch (statusError) {
            console.warn("Failed to load application status:", statusError);
          }
          setApplicationStarted(true);
          setStep(step + 1);
          return;
        }
        showError(message);
        Alert.alert("Error", message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 1) {
      const missingDocs = getMissingRequiredDocs();
      if (missingDocs.length > 0) {
        Alert.alert(
          "Required Documents",
          "Please upload your Government ID (front and back) before continuing."
        );
        return;
      }
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitApplication();
      showSuccess("Application submitted!");
      Alert.alert(
        "Application Submitted",
        "Your application is submitted successfully. We will review it shortly.",
        [
          { text: "Verify Now", onPress: () => handleStartVerification() },
          { text: "Later", style: "cancel" },
        ]
      );
    } catch (error: any) {
      console.error("Registration submission failed:", error);
      const message = getApiErrorMessage(error);
      showError(message || "Failed to submit application");
      Alert.alert("Submission Error", `${message}\n\nPlease check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const url = await startVerification();
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to Open", "Please open the verification link in your browser.");
        return;
      }
      await Linking.openURL(url);
    } catch (error: any) {
      console.error("Verification error:", error);
      const message = getApiErrorMessage(error);
      showError(message || "Failed to start verification");
      Alert.alert("Error", message || "Failed to start verification.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <BusinessInfoStep
            businessName={formData.businessName}
            taxId={formData.taxId}
            businessType={formData.businessType}
            errors={errors}
            onUpdate={(field, value) => {
              if (field === "businessType") {
                updateField("businessType", value as "individual" | "business");
              } else {
                updateField(field as keyof typeof formData, value);
              }
            }}
          />
        );
      case 1:
        return (
          <DocumentUploadStep
            documents={formData.documents}
            selectedDocType={selectedDocType}
            onSelectDocType={setSelectedDocType}
            onPickDocument={pickDocument}
            onRemoveDocument={removeDocument}
          />
        );
      case 2:
        return (
          <ReviewStep
            businessName={formData.businessName}
            taxId={formData.taxId}
            businessType={formData.businessType}
            documents={formData.documents}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center">
          <Pressable onPress={() => router.back()} mr="$4">
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </Pressable>
          <VStack>
            <Heading color={COLORS.textPrimary} size="xl" fontWeight="$bold">
              Become a Seller
            </Heading>
            <Text color={COLORS.textMuted} size="xs">
              Step {step + 1} of {STEPS.length}
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Progress Indicator */}
      <StepIndicator currentStep={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? (insets.top > 0 ? insets.top : 20) : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box px="$6" pt="$4" pb="$4" alignItems="stretch">
            {renderStepContent()}
          </Box>
        </ScrollView>

        {/* Bottom Actions */}
        <Box px="$6" pb="$6" pt="$4" borderTopWidth={1} borderColor={COLORS.darkBorder} bg={COLORS.luxuryBlack}>
          <HStack space="md" justifyContent="center" alignItems="center">
            {step > 0 && (
              <Button
                size="xl"
                variant="outline"
                onPress={() => setStep(step - 1)}
                flex={1}
                h={56}
                rounded="$full"
                borderColor={COLORS.darkBorder}
                bg="transparent"
              >
                <ButtonText color={COLORS.textPrimary}>Back</ButtonText>
              </Button>
            )}
            <Button
              size="xl"
              variant="solid"
              onPress={handleNext}
              isDisabled={loading}
              flex={step > 0 ? 1 : undefined}
              w={step > 0 ? undefined : "$full"}
              bg={step === STEPS.length - 1 ? COLORS.primaryGold : COLORS.luxuryBlackLight}
              h={56}
              rounded="$full"
            >
              {loading ? (
                <Spinner color={step === STEPS.length - 1 ? COLORS.luxuryBlack : COLORS.textPrimary} />
              ) : (
                <ButtonText
                  fontWeight="$bold"
                  color={step === STEPS.length - 1 ? COLORS.luxuryBlack : COLORS.textPrimary}
                >
                  {step === STEPS.length - 1 ? "Submit Application" : "Continue"}
                </ButtonText>
              )}
            </Button>
          </HStack>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
