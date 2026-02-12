import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ButtonText,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
  Pressable,
  Icon,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  FileText,
  CreditCard,
  User,
  Building2,
  Upload,
  X,
  Check,
} from '@gluestack-ui/themed';
import { useSellerApplication } from '@/hooks/useSellerApplication';
import { sellersService } from '@/lib/api/services/sellers';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';

const STEPS = [
  { id: 'business', label: 'Business Info', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'verification', label: 'Verification', icon: User },
  { id: 'review', label: 'Review', icon: CheckCircle },
];

const DOCUMENT_TYPES = [
  { value: 'id_front', label: 'ID Front (Required)' },
  { value: 'id_back', label: 'ID Back (Required)' },
  { value: 'business_license', label: 'Business License (Optional)' },
  { value: 'tax_form', label: 'Tax Form (Optional)' },
];

export default function SellerOnboardingScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const { profile, isOnboarded } = useAuthStore();

  const {
    formData,
    selectedDocType,
    errors,
    loading,
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

  // Check for existing application and handle return from Stripe Identity
  useEffect(() => {
    checkExistingApplication();
  }, []);

  // Handle return from Stripe Identity verification
  useEffect(() => {
    if (status === 'verified') {
      Alert.alert(
        'Verification Complete',
        'Your identity has been verified. Your application is now under review.',
        [{ text: 'OK', onPress: () => router.replace('/seller/dashboard') }]
      );
    } else if (status === 'requires_input') {
      Alert.alert(
        'Additional Information Needed',
        'Please provide additional information to complete your verification.',
        [{ text: 'Continue', onPress: () => setCurrentStep(2) }]
      );
    } else if (status === 'canceled') {
      Alert.alert(
        'Verification Canceled',
        'You can restart the verification process when ready.',
        [{ text: 'OK' }]
      );
    }
  }, [status]);

  const checkExistingApplication = async () => {
    try {
      const applicationStatus = await sellersService.getApplicationStatus();
      if (applicationStatus?.application) {
        setExistingApplication(applicationStatus.application);
        // Skip to appropriate step based on status
        if (applicationStatus.application.status === 'draft') {
          setCurrentStep(0);
          setApplicationStarted(true);
        } else if (applicationStatus.application.status === 'submitted') {
          setCurrentStep(2); // Go to verification step
        } else if (applicationStatus.application.status === 'in_review') {
          Alert.alert(
            'Application Under Review',
            'Your application is being reviewed. We\'ll notify you once it\'s approved.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        } else if (applicationStatus.application.status === 'approved') {
          Alert.alert(
            'Application Approved',
            'Congratulations! You are now a verified seller.',
            [{ text: 'Go to Dashboard', onPress: () => router.replace('/seller/dashboard') }]
          );
        } else if (applicationStatus.application.status === 'rejected') {
          Alert.alert(
            'Application Rejected',
            applicationStatus.application.rejectionReason || 'Your application was not approved. Please contact support for more information.',
            [{ text: 'OK' }]
          );
        } else if (applicationStatus.application.status === 'more_info_needed') {
          Alert.alert(
            'More Information Needed',
            'Please upload additional documents to complete your application.',
            [{ text: 'Continue', onPress: () => setCurrentStep(1) }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check if user has completed profile onboarding
  useEffect(() => {
    if (!checkingStatus && !isOnboarded()) {
      Alert.alert(
        'Complete Setup First',
        'Please finish setting up your profile before becoming a seller.',
        [
          {
            text: 'Continue Setup',
            onPress: () => router.replace('/(onboarding)/profile-setup'),
          },
          {
            text: 'Go Home',
            onPress: () => router.replace('/(tabs)'),
            style: 'cancel',
          },
        ]
      );
    }
  }, [checkingStatus, isOnboarded]);

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate business info
      if (!validateStep(0)) return;

      try {
        await startApplication();
        setCurrentStep(1);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to start application');
      }
    } else if (currentStep === 1) {
      // Check required documents
      const missingDocs = getMissingRequiredDocs();
      if (missingDocs.length > 0) {
        Alert.alert(
          'Missing Required Documents',
          `Please upload: ${missingDocs.map(d => DOCUMENT_TYPES.find(dt => dt.value === d)?.label).join(', ')}`
        );
        return;
      }

      try {
        await submitApplication();
        Alert.alert(
          'Application Submitted',
          'Your documents have been uploaded. Now let\'s verify your identity.',
          [{ text: 'Continue', onPress: () => setCurrentStep(2) }]
        );
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to submit application');
      }
    } else if (currentStep === 2) {
      // Start Stripe Identity verification
      try {
        const verificationUrl = await startVerification();
        // Open Stripe Identity in browser
        const supported = await Linking.canOpenURL(verificationUrl);
        if (supported) {
          await Linking.openURL(verificationUrl);
        } else {
          Alert.alert('Error', 'Cannot open verification URL');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to start verification');
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleDocumentPick = async () => {
    try {
      await pickDocument();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick document');
    }
  };

  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
          <Text color={COLORS.textSecondary} mt="$4">
            Checking application status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const StepIndicator = () => (
    <HStack justifyContent="space-between" px="$4" py="$6">
      {STEPS.map((s, index) => {
        const Icon = s.icon;
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <VStack key={s.id} alignItems="center" flex={1}>
            <Box
              w={48}
              h={48}
              borderRadius="$full"
              backgroundColor={
                isCompleted
                  ? COLORS.successGreen
                  : isCurrent
                  ? COLORS.primaryGold
                  : COLORS.luxuryBlackLight
              }
              alignItems="center"
              justifyContent="center"
              borderWidth={2}
              borderColor={
                isCurrent ? COLORS.primaryGold : COLORS.darkBorder
              }
            >
              {isCompleted ? (
                <Check color={COLORS.luxuryBlack} size={24} />
              ) : (
                <Icon
                  color={
                    isCurrent ? COLORS.luxuryBlack : COLORS.textMuted
                  }
                  size={24}
                />
              )}
            </Box>
            <Text
              size="xs"
              color={
                isCurrent || isCompleted
                  ? COLORS.textPrimary
                  : COLORS.textMuted
              }
              mt="$2"
              fontWeight={isCurrent ? '$bold' : '$normal'}
            >
              {s.label}
            </Text>
            {index < STEPS.length - 1 && (
              <Box
                position="absolute"
                top="$6"
                right="$-10"
                w="$full"
                h={2}
                backgroundColor={
                  isCompleted ? COLORS.successGreen : COLORS.darkBorder
                }
              />
            )}
          </VStack>
        );
      })}
    </HStack>
  );

  const renderBusinessStep = () => (
    <VStack space="md">
      <FormControl isInvalid={!!errors.businessName}>
        <FormControlLabel>
          <FormControlLabelText color={COLORS.textSecondary}>
            Business Name *
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          variant="outline"
          size="md"
          borderColor={COLORS.darkBorder}
          backgroundColor={COLORS.luxuryBlack}
        >
          <InputField
            color={COLORS.textPrimary}
            placeholder="Your business or display name"
            placeholderTextColor={COLORS.textMuted}
            value={formData.businessName}
            onChangeText={(text) => updateField('businessName', text)}
          />
        </Input>
        {errors.businessName && (
          <FormControlError>
            <FormControlErrorText color={COLORS.errorRed}>
              {errors.businessName}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      <FormControl isInvalid={!!errors.taxId}>
        <FormControlLabel>
          <FormControlLabelText color={COLORS.textSecondary}>
            Tax ID / SSN *
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          variant="outline"
          size="md"
          borderColor={COLORS.darkBorder}
          backgroundColor={COLORS.luxuryBlack}
        >
          <InputField
            color={COLORS.textPrimary}
            placeholder="XXX-XX-XXXX"
            placeholderTextColor={COLORS.textMuted}
            value={formData.taxId}
            onChangeText={(text) => updateField('taxId', text)}
            secureTextEntry
          />
        </Input>
        {errors.taxId && (
          <FormControlError>
            <FormControlErrorText color={COLORS.errorRed}>
              {errors.taxId}
            </FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      <FormControl>
        <FormControlLabel>
          <FormControlLabelText color={COLORS.textSecondary}>
            Business Type
          </FormControlLabelText>
        </FormControlLabel>
        <RadioGroup
          value={formData.businessType}
          onChange={(value) => updateField('businessType', value as any)}
        >
          <HStack space="md">
            <Radio value="individual">
              <RadioIndicator mr="$2">
                <RadioIcon as={Check} />
              </RadioIndicator>
              <RadioLabel color={COLORS.textPrimary}>Individual</RadioLabel>
            </Radio>
            <Radio value="business">
              <RadioIndicator mr="$2">
                <RadioIcon as={Check} />
              </RadioIndicator>
              <RadioLabel color={COLORS.textPrimary}>Business</RadioLabel>
            </Radio>
          </HStack>
        </RadioGroup>
      </FormControl>
    </VStack>
  );

  const renderDocumentsStep = () => (
    <VStack space="md">
      <Text color={COLORS.textSecondary} size="sm">
        Please upload the required documents for verification. All documents are securely stored and encrypted.
      </Text>

      <FormControl>
        <FormControlLabel>
          <FormControlLabelText color={COLORS.textSecondary}>
            Document Type
          </FormControlLabelText>
        </FormControlLabel>
        <Select selectedValue={selectedDocType} onValueChange={(value) => setSelectedDocType(value as any)}>
          <SelectTrigger variant="outline" size="md" borderColor={COLORS.darkBorder}>
            <SelectInput
              color={COLORS.textPrimary}
              placeholder="Select document type"
            />
            <Icon as={ChevronRight} color={COLORS.textMuted} mr="$3" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {DOCUMENT_TYPES.map((doc) => (
                <SelectItem key={doc.value} label={doc.label} value={doc.value} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      <Button
        variant="outline"
        borderColor={COLORS.darkBorder}
        onPress={handleDocumentPick}
        isDisabled={!selectedDocType}
      >
        <Icon as={Upload} color={COLORS.textSecondary} mr="$2" />
        <ButtonText color={COLORS.textSecondary}>Upload Document</ButtonText>
      </Button>

      {/* Show uploaded documents */}
      {formData.documents.length > 0 && (
        <VStack space="sm" mt="$4">
          <Text color={COLORS.textPrimary} fontWeight="$bold">
            Uploaded Documents
          </Text>
          {formData.documents.map((doc, index) => (
            <HStack
              key={index}
              backgroundColor={COLORS.luxuryBlackLight}
              p="$3"
              borderRadius="$md"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack alignItems="center" space="sm">
                <Icon as={FileText} color={COLORS.primaryGold} />
                <VStack>
                  <Text color={COLORS.textPrimary} size="sm">
                    {DOCUMENT_TYPES.find((dt) => dt.value === doc.docType)?.label}
                  </Text>
                  <Text color={COLORS.textMuted} size="xs">
                    {doc.file.name}
                  </Text>
                </VStack>
              </HStack>
              <Pressable onPress={() => removeDocument(index)}>
                <Icon as={X} color={COLORS.errorRed} />
              </Pressable>
            </HStack>
          ))}
        </VStack>
      )}

      {/* Show missing required documents */}
      {getMissingRequiredDocs().length > 0 && (
        <Box
          backgroundColor={`${COLORS.warningAmber}20`}
          p="$3"
          borderRadius="$md"
          borderWidth={1}
          borderColor={COLORS.warningAmber}
        >
          <Text color={COLORS.warningAmber} size="sm">
            Required documents missing:{' '}
            {getMissingRequiredDocs()
              .map((d) => DOCUMENT_TYPES.find((dt) => dt.value === d)?.label)
              .join(', ')}
          </Text>
        </Box>
      )}
    </VStack>
  );

  const renderVerificationStep = () => (
    <VStack space="md" alignItems="center">
      <Box
        w={100}
        h={100}
        borderRadius="$full"
        backgroundColor={`${COLORS.primaryGold}20`}
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={User} color={COLORS.primaryGold} size={48} />
      </Box>

      <Text color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">
        Identity Verification
      </Text>

      <Text color={COLORS.textSecondary} textAlign="center">
        To ensure the safety of our marketplace, we need to verify your identity using Stripe Identity. This is a quick and secure process.
      </Text>

      <VStack space="sm" w="$full" mt="$4">
        <HStack alignItems="center" space="sm">
          <Icon as={CheckCircle} color={COLORS.successGreen} size={20} />
          <Text color={COLORS.textSecondary} size="sm">
            Government-issued ID required
          </Text>
        </HStack>
        <HStack alignItems="center" space="sm">
          <Icon as={CheckCircle} color={COLORS.successGreen} size={20} />
          <Text color={COLORS.textSecondary} size="sm">
            Takes less than 2 minutes
          </Text>
        </HStack>
        <HStack alignItems="center" space="sm">
          <Icon as={CheckCircle} color={COLORS.successGreen} size={20} />
          <Text color={COLORS.textSecondary} size="sm">
            Data is encrypted and secure
          </Text>
        </HStack>
      </VStack>

      <Text color={COLORS.textMuted} size="xs" textAlign="center" mt="$4">
        By continuing, you agree to Stripe's Identity Verification Terms and Privacy Policy.
      </Text>
    </VStack>
  );

  const renderReviewStep = () => (
    <VStack space="md">
      <Box
        backgroundColor={`${COLORS.successGreen}20`}
        p="$4"
        borderRadius="$xl"
        borderWidth={2}
        borderColor={COLORS.successGreen}
        alignItems="center"
      >
        <Icon as={CheckCircle} color={COLORS.successGreen} size={48} />
        <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg" mt="$3">
          Application Submitted!
        </Text>
        <Text color={COLORS.textSecondary} textAlign="center" mt="$2">
          Your application has been submitted and is now under review. We'll notify you once it's approved.
        </Text>
      </Box>

      <Box backgroundColor={COLORS.luxuryBlackLight} p="$4" borderRadius="$xl">
        <Text color={COLORS.textPrimary} fontWeight="$bold" mb="$3">
          Application Summary
        </Text>
        <VStack space="sm">
          <HStack justifyContent="space-between">
            <Text color={COLORS.textMuted}>Business Name</Text>
            <Text color={COLORS.textPrimary}>{formData.businessName}</Text>
          </HStack>
          <HStack justifyContent="space-between">
            <Text color={COLORS.textMuted}>Business Type</Text>
            <Text color={COLORS.textPrimary}>
              {formData.businessType === 'individual' ? 'Individual' : 'Business'}
            </Text>
          </HStack>
          <HStack justifyContent="space-between">
            <Text color={COLORS.textMuted}>Documents</Text>
            <Text color={COLORS.textPrimary}>{formData.documents.length} uploaded</Text>
          </HStack>
        </VStack>
      </Box>

      <Text color={COLORS.textMuted} size="xs" textAlign="center">
        You can check your application status anytime in your seller dashboard.
      </Text>
    </VStack>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HStack px="$4" py="$4" alignItems="center" justifyContent="space-between">
        <Pressable onPress={handleBack} p="$2">
          <Icon as={ChevronLeft} color={COLORS.textPrimary} size={28} />
        </Pressable>
        <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
          Become a Seller
        </Text>
        <Box w={40} />
      </HStack>

      <StepIndicator />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Box px="$4" py="$4">
          {currentStep === 0 && renderBusinessStep()}
          {currentStep === 1 && renderDocumentsStep()}
          {currentStep === 2 && renderVerificationStep()}
          {currentStep === 3 && renderReviewStep()}
        </Box>
      </ScrollView>

      {/* Footer Buttons */}
      <Box px="$4" py="$4" borderTopWidth={1} borderTopColor={COLORS.darkBorder}>
        {currentStep === 3 ? (
          <Button
            size="lg"
            backgroundColor={COLORS.primaryGold}
            onPress={() => router.replace('/(tabs)')}
          >
            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
              Go Home
            </ButtonText>
          </Button>
        ) : (
          <HStack space="md">
            {currentStep > 0 && (
              <Button
                flex={1}
                variant="outline"
                borderColor={COLORS.darkBorder}
                onPress={handleBack}
                isDisabled={loading}
              >
                <ButtonText color={COLORS.textSecondary}>Back</ButtonText>
              </Button>
            )}
            <Button
              flex={currentStep > 0 ? 1 : undefined}
              size="lg"
              backgroundColor={COLORS.primaryGold}
              onPress={handleNext}
              isDisabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.luxuryBlack} />
              ) : (
                <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">
                  {currentStep === 2 ? 'Start Verification' : 'Continue'}
                </ButtonText>
              )}
            </Button>
          </HStack>
        )}
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlack,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
