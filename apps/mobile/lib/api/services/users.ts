import apiClient from "../client";
import { User, UpdateProfilePayload, ApiResponse, DataExportResponse } from "../../../types";

export const usersService = {
  syncProfile: async (data: User): Promise<void> => {
    await apiClient.post("/auth/sync", data);
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  },

  getProfile: async (id: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(
      "/users/profile",
      payload,
    );
    return response.data.data;
  },

  verifyAge: async (data: { dateOfBirth: string }): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(
      "/users/age-verification",
      data,
    );
    return response.data.data;
  },

  exportData: async (): Promise<DataExportResponse> => {
    const response = await apiClient.post<ApiResponse<DataExportResponse>>("/users/me/export");
    return response.data.data;
  },
};
