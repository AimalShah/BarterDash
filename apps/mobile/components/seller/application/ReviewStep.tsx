import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Center,
  Heading,
} from "@gluestack-ui/themed";
import { CheckCircle2 } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";
import { PickedDocument, BusinessType } from "../../../hooks/useSellerApplication";

const DOCUMENT_TYPES: Array<{ label: string; value: string }> = [
  { label: "Government ID (Front)", value: "id_front" },
  { label: "Government ID (Back)", value: "id_back" },
  { label: "Tax Form (W-9)", value: "tax_form" },
  { label: "Business License", value: "business_license" },
  { label: "Bank Statement", value: "bank_statement" },
];

interface ReviewStepProps {
  businessName: string;
  taxId: string;
  businessType: BusinessType;
  documents: PickedDocument[];
}

export default function ReviewStep({
  businessName,
  taxId,
  businessType,
  documents,
}: ReviewStepProps) {
  return (
    <VStack space="xl">
      <Center mb="$6">
        <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
          <CheckCircle2 size={32} color={COLORS.textPrimary} />
        </Center>
        <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">
          Review & Submit
        </Heading>
        <Text color={COLORS.textMuted} textAlign="center" mt="$1">
          Confirm your application details
        </Text>
      </Center>

      <VStack
        bg={COLORS.luxuryBlackLight}
        rounded="$2xl"
        borderWidth={1}
        borderColor={COLORS.darkBorder}
        p="$5"
        space="md"
      >
        <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
          <Text color={COLORS.textMuted}>Business Name</Text>
          <Text color={COLORS.textPrimary} fontWeight="$semibold">
            {businessName}
          </Text>
        </HStack>
        <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
          <Text color={COLORS.textMuted}>Business Type</Text>
          <Text color={COLORS.textPrimary} fontWeight="$semibold">
            {businessType === "individual" ? "Individual" : "Business"}
          </Text>
        </HStack>
        <HStack justifyContent="space-between" pb="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
          <Text color={COLORS.textMuted}>Tax ID</Text>
          <Text color={COLORS.textPrimary} fontWeight="$semibold">
            ••••{taxId.slice(-4)}
          </Text>
        </HStack>
        <VStack space="xs">
          <HStack justifyContent="space-between">
            <Text color={COLORS.textMuted}>Documents</Text>
            <Text color={COLORS.textPrimary} fontWeight="$semibold">
              {documents.length} file(s)
            </Text>
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
          By submitting, you agree to our Terms of Service and Seller Agreement. You'll complete identity
          verification before final approval.
        </Text>
      </Box>
    </VStack>
  );
}
