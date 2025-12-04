import { apiClient } from './apiClient';

export interface Tool {
    _id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    icon: string;
    isEnabled: boolean;
    configSchema: Record<string, any>;
    config: Record<string, any>;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export const toolService = {
    getAll: async (): Promise<Tool[]> => {
        return apiClient.get<Tool[]>('/tools');
    },

    toggle: async (id: string, isEnabled: boolean): Promise<Tool> => {
        return apiClient.patch<Tool>(`/tools/${id}/toggle`, { isEnabled });
    },

    updateConfig: async (id: string, config: Record<string, any>): Promise<Tool> => {
        return apiClient.patch<Tool>(`/tools/${id}/config`, { config });
    }
};
