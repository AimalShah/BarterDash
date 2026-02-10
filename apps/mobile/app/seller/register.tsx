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
  Center,
  Spinner,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Button,
  ButtonText,
} from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useToast } from "@/context/ToastContext";
import { ChevronLeft, Check, Store, FileText, CheckCircle2 } from "lucide-react-native";
import { sellersService } from "@/lib/api/services/sellers";
import { supabase } from "@/lib/supabase";
import { COLORS } from '../../constants/colors';
import { VerificationDocumentType } from "@/types";

const STEPS = ["Business Info", "KYC Documents", "Review"];
const BUSINESS_TYPES: Array<{ label: string; value: "individual" | "business" }> = [
  { label: "Individual", value: "individual" },
  { label: "Business", value: "business" },
];
const DOCUMENT_TYPES: Array<{ label: string; value: VerificationDocumentType; required?: boolean }> = [
  { label: "Government ID (Front)", value: "id_front", required: true },
  { label: "Government ID (Back)", value: "id_back", required: true },
  { label: "Tax Form (W-9)", value: "tax_form" },
  { label: "Business License", value: "business_license" },
  { label: "Bank Statement", value: "bank_statement" },
];

type PickedDocument = {
  docType: VerificationDocumentType;
  file: {
    uri: string;
    name: string;
    mimeType?: string;
  };
};

const getApiErrorMessage = (error: any) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const getApiErrorCode = (error: any) => error?.response?.data?.error?.code;

const resolveMimeType = (name?: string, mimeType?: string) => {
  if (mimeType) return mimeType;
  const ext = name?.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
};

export default function SellerApplicationScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const [applicationStarted, setApplicationStarted] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessType, setBusinessType] = useState<"individual" | "business">("individual");
  const [documents, setDocuments] = useState<PickedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType>("id_front");

  // Form validation errors
  const [errors, setErrors] = useState<{ businessName?: string; taxId?: string }>({});

  const pickDocument = async () => {
    if (!selectedDocType) {
      Alert.alert("Select Document Type", "Please choose a document type before uploading.");
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setDocuments((prev) => {
        const filtered = prev.filter((doc) => doc.docType !== selectedDocType);
        return [...filtered, { docType: selectedDocType, file: asset }];
      });
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  const requiredDocTypes = DOCUMENT_TYPES.filter((doc) => doc.required).map((doc) => doc.value);
  const getMissingRequiredDocs = () =>
    requiredDocTypes.filter((type) => !documents.some((doc) => doc.docType === type));

  const validateStep = (): boolean => {
    const newErrors: { businessName?: string; taxId?: string } = {};

    if (step === 0) {
      if (!businessName.trim()) {
        newErrors.businessName = "Business name is required";
      }
      if (!taxId.trim()) {
        newErrors.taxId = "Tax ID / SSN is required for verification";
      } else if (taxId.length < 5) {
        newErrors.taxId = "Please enter a valid Tax ID";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (loading) return;
    if (!validateStep()) return;

    if (step === 0) {
      try {
        setLoading(true);
        await sellersService.startApplication({
          business_type: businessType,
          business_name: businessName.trim(),
          tax_id: taxId.trim(),
        });
        setApplicationStarted(true);
        setStep(step + 1);
      } catch (error: any) {
        const message = getApiErrorMessage(error);
        const code = getApiErrorCode(error);
        if (
          code === "CONFLICT" ||
          (typeof message === "string" && message.toLowerCase().includes("already has a seller application"))
        ) {
          try {
            const statusResponse = await sellersService.getApplicationStatus();
            const status = statusResponse?.application?.status;
            if (status && !["draft", "more_info_needed"].includes(status)) {
              Alert.alert(
                "Application In Progress",
                `Your application status is "${status.replace(/_/g, " ")}". You can continue once it's back in draft.`,
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
          "Please upload your Government ID (front and back) before continuing.",
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
    console.log('🚀 Starting handleSubmit...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ handleSubmit: Not authenticated');
        throw new Error("Not authenticated");
      }
      console.log('✅ Authenticated user:', user.id);

      if (!applicationStarted) {
        console.log('📝 Starting backend application...');
        await sellersService.startApplication({
          business_type: businessType,
          business_name: businessName.trim(),
          tax_id: taxId.trim(),
        });
        setApplicationStarted(true);
        console.log('✅ Backend application started');
      } else {
        console.log('ℹ️ Application already started, skipping startApplication');
      }

      console.log('📄 Starting document upload for', documents.length, 'files');
      for (const doc of documents) {
        try {
          console.log(`📤 Processing ${doc.docType}: ${doc.file.name}`);
          const fileExt = doc.file.name?.split('.').pop() || "jpg";
          const fileName = `${user.id}/${Date.now()}-${doc.docType}.${fileExt}`;

          console.log(`📖 Reading file: ${doc.file.uri}`);
          let fileBase64 = await FileSystem.readAsStringAsync(doc.file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (fileBase64.includes(';base64,')) {
            console.log(`✂️ Stripping base64 prefix for ${doc.docType}`);
            fileBase64 = fileBase64.split(';base64,').pop() || '';
          }
          fileBase64 = fileBase64.replace(/\s/g, '');

          console.log(`🧩 Decoding ${doc.docType}...`);
          const fileData = decode(fileBase64);
          console.log(`✅ Decoded ${doc.docType}, size:`, fileData.byteLength);

          const contentType = resolveMimeType(doc.file.name, doc.file.mimeType);
          console.log(`☁️ Uploading to storage: ${fileName} (${contentType})`);

          const { error: uploadError } = await supabase.storage
            .from('seller-documents')
            .upload(fileName, fileData, {
              contentType,
              upsert: true
            });

          if (uploadError) {
            console.error(`❌ Storage upload error for ${doc.docType}:`, uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('seller-documents')
            .getPublicUrl(fileName);

          console.log(`🔗 Public URL for ${doc.docType}:`, publicUrl);

          console.log(`📡 Linking document to application: ${doc.docType}`);
          await sellersService.uploadDocument({
            document_type: doc.docType,
            file_url: publicUrl,
            file_name: doc.file.name,
          });
          console.log(`✅ Successfully uploaded and linked ${doc.docType}`);
        } catch (fileErr: any) {
          console.error(`❌ Detailed error with ${doc.docType}:`, fileErr);
          throw new Error(`Failed to upload document (${doc.docType}): ${fileErr.message || "Unknown error"}`);
        }
      }

      console.log('🚀 Submitting final application...');
      await sellersService.submitApplication({ confirm_documents: true });
      console.log('✅ Final application submitted successfully');
      showSuccess("Application submitted!");

      Alert.alert(
        "Application Submitted",
        "Your application is submitted successfully. We will review it shortly.",
        [
          { text: "Verify Now", onPress: () => handleStartVerification() },
          { text: "Later", style: "cancel" },
        ],
      );
    } catch (error: any) {
      console.error('❌ Registration submission failed:', error);
      console.error('Detailed Error Object:', JSON.stringify(error, null, 2));

      const message = getApiErrorMessage(error);
      const detail = error?.message || "";

      showError(message || "Failed to submit application");
      Alert.alert(
        "Submission Error",
        `${message}\n\nDetails: ${detail}\n\nPlease check your connection and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const response = await sellersService.createVerificationSession();
      const supported = await Linking.canOpenURL(response.url);
      if (!supported) {
        Alert.alert("Unable to Open", "Please open the verification link in your browser.");
        return;
      }
      await Linking.openURL(response.url);
    } catch (error: any) {
      console.error("Verification error:", error);
      const message = getApiErrorMessage(error);
      showError(message || "Failed to start verification");
      Alert.alert("Error", message || "Failed to start verification.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <HStack justifyContent="center" alignItems="center" px="$4" py="$4">
      {STEPS.map((s, i) => (
        <HStack key={s} alignItems="center" flex={i < STEPS.length - 1 ? 1 : 0} justifyContent="center">
          <VStack alignItems="center">
            <Center
              w={40}
              h={40}
              rounded="$full"
              borderWidth={2}
              bg={i < step ? COLORS.primaryGold : i === step ? COLORS.primaryGold : COLORS.luxuryBlackLight}
              borderColor={i < step ? COLORS.primaryGold : i === step ? COLORS.primaryGold : COLORS.darkBorder}
            >
              {i < step ? (
                <Check size={20} color={COLORS.luxuryBlack} />
              ) : (
                <Text color={i === step ? COLORS.luxuryBlack : COLORS.textMuted} fontWeight="$bold" size="sm">
                  {i + 1}
                </Text>
              )}
            </Center>
            <Text size="2xs" mt="$1" fontWeight="$medium" color={i <= step ? COLORS.textPrimary : COLORS.textMuted} textAlign="center" numberOfLines={1}>
              {s}
            </Text>
          </VStack>
          {i < STEPS.length - 1 && (
            <Box h={2} flex={1} mx="$2" bg={i < step ? COLORS.primaryGold : COLORS.darkBorder} rounded="$full" />
          )}
        </HStack>
      ))}
    </HStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center">
          <Pressable onPress={() => router.back()} mr="$4">
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </Pressable>
          <VStack>
            <Heading color={COLORS.textPrimary} size="xl" fontWeight="$bold">Become a Seller</Heading>
            <Text color={COLORS.textMuted} size="xs">Step {step + 1} of {STEPS.length}</Text>
          </VStack>
        </HStack>
      </Box>

      {/* Progress Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? (insets.top > 0 ? insets.top : 20) : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box px="$6" pt="$4" pb="$4" alignItems="stretch">
            {/* Step 1: Business Info */}
            {step === 0 && (
              <VStack space="xl">
                <Center mb="$6">
                  <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
                    <Store size={32} color={COLORS.textPrimary} />
                  </Center>
                  <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">Business Information</Heading>
                  <Text color={COLORS.textMuted} textAlign="center" mt="$1">Tell us about your business</Text>
                </Center>

                <FormControl isInvalid={!!errors.businessName}>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText color={COLORS.textPrimary} fontWeight="$bold" size="sm">
                      Legal Business Name *
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    h={56}
                    borderColor={errors.businessName ? COLORS.errorRed : COLORS.darkBorder}
                    rounded="$xl"
                    bg={COLORS.luxuryBlackLight}
                  >
                    <InputField
                      placeholder="Registered Business Name"
                      value={businessName}
                      onChangeText={(text) => {
                        setBusinessName(text);
                        if (errors.businessName) setErrors(prev => ({ ...prev, businessName: undefined }));
                      }}
                      color={COLORS.textPrimary}
                      placeholderTextColor={COLORS.textMuted}
                      style={{ paddingHorizontal: 16 }}
                    />
                  </Input>
                  {errors.businessName && (
                    <Text color={COLORS.errorRed} size="xs" mt="$1">{errors.businessName}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.taxId}>
                  <FormControlLabel mb="$1">
                    <FormControlLabelText color={COLORS.textPrimary} fontWeight="$bold" size="sm">
                      Tax ID / SSN / EIN *
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input
                    variant="outline"
                    h={56}
                    borderColor={errors.taxId ? COLORS.errorRed : COLORS.darkBorder}
                    rounded="$xl"
                    bg={COLORS.luxuryBlackLight}
                  >
                    <InputField
                      placeholder="XX-XXXXXXX"
                      value={taxId}
                      onChangeText={(text) => {
                        setTaxId(text);
                        if (errors.taxId) setErrors(prev => ({ ...prev, taxId: undefined }));
                      }}
                      color={COLORS.textPrimary}
                      placeholderTextColor={COLORS.textMuted}
                      style={{ paddingHorizontal: 16 }}
                    />
                  </Input>
                  {errors.taxId && (
                    <Text color={COLORS.errorRed} size="xs" mt="$1">{errors.taxId}</Text>
                  )}
                </FormControl>

                <VStack space="xs">
                  <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold" mb="$1">
                    Business Type
                  </Text>
                  <HStack space="md" alignItems="center">
                    {BUSINESS_TYPES.map(type => (
                      <Pressable
                        key={type.value}
                        onPress={() => setBusinessType(type.value)}
                        flex={1}
                        py="$3"
                        rounded="$xl"
                        borderWidth={2}
                        alignItems="center"
                        bg={businessType === type.value ? COLORS.primaryGold : COLORS.luxuryBlackLight}
                        borderColor={businessType === type.value ? COLORS.primaryGold : COLORS.darkBorder}
                      >
                        <Text fontWeight="$semibold" color={businessType === type.value ? COLORS.luxuryBlack : COLORS.textMuted}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </HStack>
                </VStack>
              </VStack>
            )}

            {/* Step 2: KYC Documents */}
            {step === 1 && (
              <VStack space="xl">
                <Center mb="$6">
                  <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
                    <FileText size={32} color={COLORS.textPrimary} />
                  </Center>
                  <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">Verification Documents</Heading>
                  <Text color={COLORS.textMuted} textAlign="center" mt="$1" px="$4">
                    Upload documents to verify your business identity
                  </Text>
                </Center>

                <VStack space="md">
                  <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold">
                    Select Document Type
                  </Text>
                  <VStack space="sm">
                    {DOCUMENT_TYPES.map((doc) => (
                      <Pressable
                        key={doc.value}
                        onPress={() => setSelectedDocType(doc.value)}
                        px="$4"
                        py="$3"
                        rounded="$xl"
                        borderWidth={1}
                        borderColor={selectedDocType === doc.value ? COLORS.primaryGold : COLORS.darkBorder}
                        bg={selectedDocType === doc.value ? COLORS.primaryGold : COLORS.luxuryBlackLight}
                      >
                        <HStack alignItems="center" justifyContent="space-between">
                          <VStack>
                            <Text
                              fontWeight="$semibold"
                              color={selectedDocType === doc.value ? COLORS.luxuryBlack : COLORS.textPrimary}
                            >
                              {doc.label}
                            </Text>
                            {doc.required && (
                              <Text
                                size="2xs"
                                color={selectedDocType === doc.value ? COLORS.luxuryBlack : COLORS.textMuted}
                              >
                                Required
                              </Text>
                            )}
                          </VStack>
                          {selectedDocType === doc.value && (
                            <Check size={18} color={COLORS.luxuryBlack} />
                          )}
                        </HStack>
                      </Pressable>
                    ))}
                  </VStack>
                  <Text color={COLORS.textMuted} size="xs">
                    Required: Government ID (front and back).
                  </Text>
                </VStack>

                <Pressable
                  onPress={pickDocument}
                  h={128}
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={COLORS.darkBorder}
                  rounded="$2xl"
                  alignItems="center"
                  justifyContent="center"
                  bg={COLORS.luxuryBlackLight}
                >
                  <Ionicons name="cloud-upload-outline" size={40} color={COLORS.textPrimary} />
                  <Text color={COLORS.textPrimary} fontWeight="$semibold" mt="$3">Tap to Upload Selected Document</Text>
                  <Text color={COLORS.textMuted} size="xs" mt="$1">PDF, JPG, or PNG</Text>
                </Pressable>

                {documents.length > 0 && (
                  <VStack space="md">
                    <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold">
                      Uploaded Files ({documents.length})
                    </Text>
                    {documents.map((doc, index) => (
                      <Box key={index} flexDirection="row" alignItems="center" justifyContent="space-between" bg={COLORS.luxuryBlackLight} p="$4" rounded="$2xl" borderWidth={1} borderColor={COLORS.darkBorder}>
                        <HStack alignItems="center" flex={1} mr="$4" space="md">
                          <Center h="$10" w="$10" rounded="$xl" bg={COLORS.primaryGold}>
                            <Ionicons name="document-text" size={20} color={COLORS.luxuryBlack} />
                          </Center>
                          <VStack flex={1}>
                            <Text color={COLORS.textPrimary} fontWeight="$medium" numberOfLines={1}>
                              {doc.file.name}
                            </Text>
                            <Text color={COLORS.textMuted} size="2xs">
                              {DOCUMENT_TYPES.find((type) => type.value === doc.docType)?.label || doc.docType}
                            </Text>
                          </VStack>
                        </HStack>
                        <Box flex={0}>
                          <Pressable onPress={() => removeDocument(index)} p="$2">
                            <Ionicons name="close-circle" size={24} color={COLORS.errorRed} />
                          </Pressable>
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}

            {/* Step 3: Review */}
            {step === 2 && (
              <VStack space="xl">
                <Center mb="$6">
                  <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
                    <CheckCircle2 size={32} color={COLORS.textPrimary} />
                  </Center>
                  <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">Review & Submit</Heading>
                  <Text color={COLORS.textMuted} textAlign="center" mt="$1">Confirm your application details</Text>
                </Center>

                <VStack bg={COLORS.luxuryBlackLight} rounded="$2xl" borderWidth={1} borderColor={COLORS.darkBorder} p="$5" space="md">
                  <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                    <Text color={COLORS.textMuted}>Business Name</Text>
                    <Text color={COLORS.textPrimary} fontWeight="$semibold">{businessName}</Text>
                  </HStack>
                  <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                    <Text color={COLORS.textMuted}>Business Type</Text>
                    <Text color={COLORS.textPrimary} fontWeight="$semibold">
                      {businessType === "individual" ? "Individual" : "Business"}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                    <Text color={COLORS.textMuted}>Tax ID</Text>
                    <Text color={COLORS.textPrimary} fontWeight="$semibold">••••{taxId.slice(-4)}</Text>
                  </HStack>
                  <VStack space="xs">
                    <HStack justifyContent="space-between">
                      <Text color={COLORS.textMuted}>Documents</Text>
                      <Text color={COLORS.textPrimary} fontWeight="$semibold">{documents.length} file(s)</Text>
                    </HStack>
                    <Text color={COLORS.textMuted} size="xs">
                      {documents.length > 0
                        ? documents
                          .map((doc) => DOCUMENT_TYPES.find((type) => type.value === doc.docType)?.label || doc.docType)
                          .join(", ")
                        : "No documents uploaded"}
                    </Text>
                  </VStack>
                </VStack>

                <Box bg={COLORS.glowGold} borderWidth={1} borderColor={COLORS.goldDark} rounded="$2xl" p="$4">
                  <Text color={COLORS.textPrimary} size="sm" lineHeight="$lg" textAlign="center">
                    By submitting, you agree to our Terms of Service and Seller Agreement.
                    You'll complete identity verification before final approval.
                  </Text>
                </Box>
              </VStack>
            )}
          </Box>
        </ScrollView>

        {/* Bottom Actions - Fixed */}
        <Box
          px="$6"
          pb="$6"
          pt="$4"
          borderTopWidth={1}
          borderColor={COLORS.darkBorder}
          bg={COLORS.luxuryBlack}
        >
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
                justifyContent="center"
                alignItems="center"
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
              w={step > 0 ? undefined : '$full'}
              bg={step === STEPS.length - 1 ? COLORS.primaryGold : COLORS.luxuryBlackLight}
              h={56}
              rounded="$full"
              justifyContent="center"
              alignItems="center"
              sx={{ ":active": { opacity: 0.9 } }}
            >
              {loading ? <Spinner color={step === STEPS.length - 1 ? COLORS.luxuryBlack : COLORS.textPrimary} /> : (
                <ButtonText fontWeight="$bold" color={step === STEPS.length - 1 ? COLORS.luxuryBlack : COLORS.textPrimary}>
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
