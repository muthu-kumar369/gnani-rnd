import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../api/client'; // STAGE 1

interface PreferencesStore {
    lastUsedModel: string | null;
    lastUsedTemplate: string | null;

    // Actions
    setLastUsedModel: (modelId: string) => void;
    setLastUsedTemplate: (templateId: string) => void;
    loadPreferences: (accessToken: string) => Promise<void>;
    savePreferences: (accessToken: string) => Promise<void>;
    clearPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
    persist(
        (set, get) => ({
            lastUsedModel: null,
            lastUsedTemplate: null,

            setLastUsedModel: (modelId) => {
                set({ lastUsedModel: modelId });
            },

            setLastUsedTemplate: (templateId) => {
                set({ lastUsedTemplate: templateId });
            },

            loadPreferences: async (accessToken) => {
                try {
                    // STAGE 1: Use apiClient instead of fetch
                    const response = await apiClient.get('/user/preferences');
                    const data = response.data; // Axios returns response.data

                    if (data.lastUsedModel) {
                        set({ lastUsedModel: data.lastUsedModel });
                    }
                    if (data.lastUsedTemplate) {
                        set({ lastUsedTemplate: data.lastUsedTemplate });
                    }
                } catch (error) {
                    console.error('Error loading preferences:', error);
                }
            },

            savePreferences: async (accessToken) => {
                const { lastUsedModel, lastUsedTemplate } = get();

                try {
                    // STAGE 1: Use apiClient instead of fetch
                    await apiClient.patch('/user/preferences', {
                        lastUsedModel,
                        lastUsedTemplate
                    });
                } catch (error) {
                    console.error('Error saving preferences:', error);
                }
            },

            clearPreferences: () => {
                set({
                    lastUsedModel: null,
                    lastUsedTemplate: null
                });
            }
        }),
        {
            name: 'gnani_user_preferences',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                lastUsedModel: state.lastUsedModel,
                lastUsedTemplate: state.lastUsedTemplate
            })
        }
    )
);
