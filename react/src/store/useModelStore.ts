import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModelConfig {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'local';
    maxTokens: number;
    temperature: number;
    description?: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        temperature: 0.7,
        description: 'Most capable OpenAI model',
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        temperature: 0.7,
        description: 'Fast and efficient',
    },
    {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 4096,
        temperature: 0.7,
        description: 'Most capable Anthropic model',
    },
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 4096,
        temperature: 0.7,
        description: 'Balanced performance',
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        maxTokens: 2048,
        temperature: 0.7,
        description: 'Google\'s advanced model',
    },
];

interface ModelState {
    currentModel: ModelConfig;
    setModel: (modelId: string) => void;
    updateModelConfig: (config: Partial<ModelConfig>) => void;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            currentModel: AVAILABLE_MODELS[1], // Default to GPT-3.5 Turbo

            setModel: (modelId: string) => {
                const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
                if (model) {
                    set({ currentModel: model });
                }
            },

            updateModelConfig: (config: Partial<ModelConfig>) => {
                set((state) => ({
                    currentModel: {
                        ...state.currentModel,
                        ...config,
                    },
                }));
            },
        }),
        {
            name: 'gnani-model-config',
        }
    )
);
