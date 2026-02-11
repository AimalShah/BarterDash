import { useState, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { sellersService } from "../lib/api/services/sellers";
import { supabase } from "../lib/supabase";
import { VerificationDocumentType } from "../types";

export type BusinessType = "individual" | "business";

export interface PickedDocument {
  docType: VerificationDocumentType;
  file: {
    uri: string;
    name: string;
    mimeType?: string;
  };
}

export interface SellerApplicationData {
  businessName: string;
  taxId: string;
  businessType: BusinessType;
  documents: PickedDocument[];
}

interface UseSellerApplicationReturn {
  formData: SellerApplicationData;
  selectedDocType: VerificationDocumentType;
  errors: { businessName?: string; taxId?: string };
  loading: boolean;
  applicationStarted: boolean;
  updateField: <K extends keyof SellerApplicationData>(field: K, value: SellerApplicationData[K]) => void;
  setSelectedDocType: (type: VerificationDocumentType) => void;
  pickDocument: () => Promise<void>;
  removeDocument: (index: number) => void;
  validateStep: (step: number) => boolean;
  startApplication: () => Promise<void>;
  submitApplication: () => Promise<void>;
  startVerification: () => Promise<string>;
  getMissingRequiredDocs: () => VerificationDocumentType[];
  setApplicationStarted: (started: boolean) => void;
}

const REQUIRED_DOCS: VerificationDocumentType[] = ["id_front", "id_back"];

const getApiErrorMessage = (error: any) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const resolveMimeType = (name?: string, mimeType?: string) => {
  if (mimeType) return mimeType;
  const ext = name?.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
};

export function useSellerApplication(): UseSellerApplicationReturn {
  const [formData, setFormData] = useState<SellerApplicationData>({
    businessName: "",
    taxId: "",
    businessType: "individual",
    documents: [],
  });
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType>("id_front");
  const [errors, setErrors] = useState<{ businessName?: string; taxId?: string }>({});
  const [loading, setLoading] = useState(false);
  const [applicationStarted, setApplicationStarted] = useState(false);

  const updateField = useCallback(<K extends keyof SellerApplicationData>(
    field: K,
    value: SellerApplicationData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "businessName" || field === "taxId") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const pickDocument = useCallback(async () => {
    if (!selectedDocType) return;
    
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setFormData((prev) => ({
        ...prev,
        documents: [
          ...prev.documents.filter((doc) => doc.docType !== selectedDocType),
          { docType: selectedDocType, file: asset },
        ],
      }));
    }
  }, [selectedDocType]);

  const removeDocument = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  }, []);

  const getMissingRequiredDocs = useCallback(() => {
    return REQUIRED_DOCS.filter(
      (type) => !formData.documents.some((doc) => doc.docType === type)
    );
  }, [formData.documents]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: { businessName?: string; taxId?: string } = {};

    if (step === 0) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business name is required";
      }
      if (!formData.taxId.trim()) {
        newErrors.taxId = "Tax ID / SSN is required for verification";
      } else if (formData.taxId.length < 5) {
        newErrors.taxId = "Please enter a valid Tax ID";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.businessName, formData.taxId]);

  const startApplication = useCallback(async () => {
    await sellersService.startApplication({
      business_type: formData.businessType,
      business_name: formData.businessName.trim(),
      tax_id: formData.taxId.trim(),
    });
    setApplicationStarted(true);
  }, [formData]);

  const submitApplication = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (!applicationStarted) {
      await startApplication();
    }

    for (const doc of formData.documents) {
      const fileExt = doc.file.name?.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}-${doc.docType}.${fileExt}`;

      let fileBase64 = await FileSystem.readAsStringAsync(doc.file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (fileBase64.includes(";base64,")) {
        fileBase64 = fileBase64.split(";base64,").pop() || "";
      }
      fileBase64 = fileBase64.replace(/\s/g, "");

      const fileData = decode(fileBase64);
      const contentType = resolveMimeType(doc.file.name, doc.file.mimeType);

      const { error: uploadError } = await supabase.storage
        .from("seller-documents")
        .upload(fileName, fileData, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("seller-documents")
        .getPublicUrl(fileName);

      await sellersService.uploadDocument({
        document_type: doc.docType,
        file_url: publicUrl,
        file_name: doc.file.name,
      });
    }

    await sellersService.submitApplication({ confirm_documents: true });
  }, [formData.documents, applicationStarted, startApplication]);

  const startVerification = useCallback(async () => {
    const response = await sellersService.createVerificationSession();
    return response.url;
  }, []);

  return {
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
  };
}
