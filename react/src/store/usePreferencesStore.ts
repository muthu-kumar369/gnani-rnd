import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE_URL = 'http://localhost:3000/api/v1';

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
                    const response = await fetch(`${API_BASE_URL}/user/preferences`, {
                        headers: { 'x-auth-token': accessToken }
                    });

                    if (!response.ok) {
                        console.warn('Failed to load preferences from server');
                        return;
                    }

                    const data = await response.json();

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
                    await fetch(`${API_BASE_URL}/user/preferences`, {
                        method: 'PATCH',
                        headers: {
                            'x-auth-token': accessToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            lastUsedModel,
                            lastUsedTemplate
                        })
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
