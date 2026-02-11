import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Center,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  Pressable,
  Heading,
} from "@gluestack-ui/themed";
import { Store } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import { BusinessType } from "../../hooks/useSellerApplication";

interface BusinessInfoStepProps {
  businessName: string;
  taxId: string;
  businessType: BusinessType;
  errors: { businessName?: string; taxId?: string };
  onUpdate: (field: string, value: string | BusinessType) => void;
}

const BUSINESS_TYPES: Array<{ label: string; value: BusinessType }> = [
  { label: "Individual", value: "individual" },
  { label: "Business", value: "business" },
];

export default function BusinessInfoStep({
  businessName,
  taxId,
  businessType,
  errors,
  onUpdate,
}: BusinessInfoStepProps) {
  return (
    <VStack space="xl">
      <Center mb="$6">
        <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
          <Store size={32} color={COLORS.textPrimary} />
        </Center>
        <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">
          Business Information
        </Heading>
        <Text color={COLORS.textMuted} textAlign="center" mt="$1">
          Tell us about your business
        </Text>
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
            onChangeText={(text) => onUpdate("businessName", text)}
            color={COLORS.textPrimary}
            placeholderTextColor={COLORS.textMuted}
            style={{ paddingHorizontal: 16 }}
          />
        </Input>
        {errors.businessName && (
          <Text color={COLORS.errorRed} size="xs" mt="$1">
            {errors.businessName}
          </Text>
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
            onChangeText={(text) => onUpdate("taxId", text)}
            color={COLORS.textPrimary}
            placeholderTextColor={COLORS.textMuted}
            style={{ paddingHorizontal: 16 }}
          />
        </Input>
        {errors.taxId && (
          <Text color={COLORS.errorRed} size="xs" mt="$1">
            {errors.taxId}
          </Text>
        )}
      </FormControl>

      <VStack space="xs">
        <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold" mb="$1">
          Business Type
        </Text>
        <HStack space="md" alignItems="center">
          {BUSINESS_TYPES.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => onUpdate("businessType", type.value)}
              flex={1}
              py="$3"
              rounded="$xl"
              borderWidth={2}
              alignItems="center"
              bg={businessType === type.value ? COLORS.primaryGold : COLORS.luxuryBlackLight}
              borderColor={businessType === type.value ? COLORS.primaryGold : COLORS.darkBorder}
            >
              <Text
                fontWeight="$semibold"
                color={businessType === type.value ? COLORS.luxuryBlack : COLORS.textMuted}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </VStack>
    </VStack>
  );
}
