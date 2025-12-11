import type { Template } from '../api/templateService';
import type { Tool } from '../api/toolService';
import type { LlmModel } from '../store/useConversationStore';

export const DEFAULT_TEMPLATES: Template[] = [
    {
        _id: 'default-assistant',
        name: 'General Assistant',
        description: 'A helpful AI assistant for general tasks (Offline Mode)',
        systemPrompt: 'You are a helpful AI assistant.',
        icon: 'robot',
        tags: ['general', 'offline'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'default-coder',
        name: 'Code Assistant',
        description: 'Specialized in programming (Offline Mode)',
        systemPrompt: 'You are an expert programmer.',
        icon: 'code',
        tags: ['coding', 'offline'],
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const DEFAULT_TOOLS: Tool[] = [
    {
        _id: 'default-search',
        name: 'Web Search',
        description: 'Search the web for information',
        version: '1.0.0',
        author: 'System',
        icon: 'search',
        isEnabled: true,
        configSchema: {},
        config: {},
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const DEFAULT_MODELS: LlmModel[] = [
    {
        id: 'offline-model',
        name: 'Offline Mode',
        provider: 'local',
        contextWindow: 4096,
        description: 'System is currently offline'
    }
];

export const isCircuitOpenError = (error: any): boolean => {
    return error?.message?.includes('Circuit breaker is open');
};

export const DEFAULT_PROFILE: any = {
    userId: 'offline-user',
    username: 'Offline User',
    email: 'offline@gnani.ai',
    roles: ['user'],
    permissions: [],
    profile: {
        firstName: 'Offline',
        lastName: 'User',
        avatar: '',
        bio: ''
    },
    preferences: {
        theme: 'system',
        notifications: false
    },
    isActive: true,
    isOnboarded: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
};

export const DEFAULT_SETTINGS: any = {
    settings: {
        general: { language: 'en', timeZone: 'UTC' },
        notifications: { email: false, push: false },
        privacy: { shareUsage: false }
    },
    preferences: {}
};
