import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Center,
  Pressable,
  Heading,
} from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import { FileText, Check } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";
import { VerificationDocumentType } from "../../../types";
import { PickedDocument } from "../../../hooks/useSellerApplication";

const DOCUMENT_TYPES: Array<{ label: string; value: VerificationDocumentType; required?: boolean }> = [
  { label: "Government ID (Front)", value: "id_front", required: true },
  { label: "Government ID (Back)", value: "id_back", required: true },
  { label: "Tax Form (W-9)", value: "tax_form" },
  { label: "Business License", value: "business_license" },
  { label: "Bank Statement", value: "bank_statement" },
];

interface DocumentUploadStepProps {
  documents: PickedDocument[];
  selectedDocType: VerificationDocumentType;
  onSelectDocType: (type: VerificationDocumentType) => void;
  onPickDocument: () => void;
  onRemoveDocument: (index: number) => void;
}

export default function DocumentUploadStep({
  documents,
  selectedDocType,
  onSelectDocType,
  onPickDocument,
  onRemoveDocument,
}: DocumentUploadStepProps) {
  return (
    <VStack space="xl">
      <Center mb="$6">
        <Center h="$16" w="$16" rounded="$2xl" bg={COLORS.glowGold} mb="$3">
          <FileText size={32} color={COLORS.textPrimary} />
        </Center>
        <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold" textAlign="center">
          Verification Documents
        </Heading>
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
              onPress={() => onSelectDocType(doc.value)}
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
                {selectedDocType === doc.value && <Check size={18} color={COLORS.luxuryBlack} />}
              </HStack>
            </Pressable>
          ))}
        </VStack>
        <Text color={COLORS.textMuted} size="xs">
          Required: Government ID (front and back).
        </Text>
      </VStack>

      <Pressable
        onPress={onPickDocument}
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
        <Text color={COLORS.textPrimary} fontWeight="$semibold" mt="$3">
          Tap to Upload Selected Document
        </Text>
        <Text color={COLORS.textMuted} size="xs" mt="$1">
          PDF, JPG, or PNG
        </Text>
      </Pressable>

      {documents.length > 0 && (
        <VStack space="md">
          <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold">
            Uploaded Files ({documents.length})
          </Text>
          {documents.map((doc, index) => (
            <Box
              key={index}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              bg={COLORS.luxuryBlackLight}
              p="$4"
              rounded="$2xl"
              borderWidth={1}
              borderColor={COLORS.darkBorder}
            >
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
                <Pressable onPress={() => onRemoveDocument(index)} p="$2">
                  <Ionicons name="close-circle" size={24} color={COLORS.errorRed} />
                </Pressable>
              </Box>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
