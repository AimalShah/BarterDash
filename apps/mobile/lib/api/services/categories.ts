import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface Category {
    id: string;
    name: string;
    slug: string;
    iconUrl?: string;
    subcategories?: Category[];
}

export interface CreateCategoryPayload {
    name: string;
    parentId?: string | null;
}

export const categoriesService = {
    findAll: async (): Promise<Category[]> => {
        const response = await apiClient.get<ApiResponse<Category[]>>("/categories");
        const data = response.data?.data;
        return Array.isArray(data) ? data : [];
    },

    create: async (payload: CreateCategoryPayload): Promise<Category> => {
        const response = await apiClient.post<ApiResponse<Category>>("/categories", payload);
        return response.data.data;
    },
};
