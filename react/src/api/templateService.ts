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
        try {
            return await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                apiClient.get<Template[]>('/templates')
            ));
        } catch (error) {
            const { DEFAULT_TEMPLATES, isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) {
                return DEFAULT_TEMPLATES;
            }
            throw error;
        }
    },

    create: async (data: Partial<Template>): Promise<Template> => {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post<Template>('/templates', data)
        ));
    },

    update: async (id: string, data: Partial<Template>): Promise<Template> => {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.put<Template>(`/templates/${id}`, data)
        ));
    },

    delete: async (id: string): Promise<void> => {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.delete<void>(`/templates/${id}`)
        ));
    }
};
