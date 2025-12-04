import { apiClient } from './apiClient';

export interface Template {
    _id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon: string;
    tags: string[];
    isPublic: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export const templateService = {
    getAll: async (): Promise<Template[]> => {
        return apiClient.get<Template[]>('/templates');
    },

    create: async (data: Partial<Template>): Promise<Template> => {
        return apiClient.post<Template>('/templates', data);
    },

    update: async (id: string, data: Partial<Template>): Promise<Template> => {
        return apiClient.put<Template>(`/templates/${id}`, data);
    },

    delete: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/templates/${id}`);
    }
};
