import apiClient from "../client";
import {
  Seller,
  RegisterSellerPayload,
  SellerDashboard,
  ApiResponse,
  CreateSellerApplicationPayload,
  UploadSellerDocumentPayload,
  SubmitSellerApplicationPayload,
  SellerApplicationStatusResponse,
  SellerVerificationSession,
  SellerApplication,
} from "../../../types";

export const sellersService = {
  register: async (payload: RegisterSellerPayload): Promise<Seller> => {
    const response = await apiClient.post<ApiResponse<Seller>>("/sellers/register", payload);
    return response.data.data;
  },

  startApplication: async (
    payload: CreateSellerApplicationPayload,
  ): Promise<SellerApplication> => {
    const response = await apiClient.post<ApiResponse<SellerApplication>>(
      "/sellers/apply",
      payload,
    );
    return response.data.data;
  },

  getDashboard: async (): Promise<SellerDashboard> => {
    const response = await apiClient.get<ApiResponse<SellerDashboard>>("/sellers/dashboard");
    return response.data.data;
  },

  getActiveDashboard: async (): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>("/sellers/active-dashboard");
    return response.data.data;
  },

  uploadDocument: async (
    payload: UploadSellerDocumentPayload,
  ): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/sellers/apply/documents",
      payload,
    );
    return response.data.data;
  },

  submitApplication: async (
    payload: SubmitSellerApplicationPayload,
  ): Promise<SellerApplication> => {
    const response = await apiClient.post<ApiResponse<SellerApplication>>(
      "/sellers/apply/submit",
      payload,
    );
    return response.data.data;
  },

  getApplicationStatus: async (): Promise<SellerApplicationStatusResponse | null> => {
    const response = await apiClient.get<ApiResponse<SellerApplicationStatusResponse | null>>(
      "/sellers/apply/status",
    );
    return response.data.data;
  },

  createVerificationSession: async (): Promise<SellerVerificationSession> => {
    const response = await apiClient.post<ApiResponse<SellerVerificationSession>>(
      "/sellers/verify/session",
    );
    return response.data.data;
  },
};
