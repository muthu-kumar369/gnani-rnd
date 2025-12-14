import type { StateCreator } from 'zustand';
import type { ConversationStore, ConversationSlice } from './types';
import { conversationService } from '../../services/conversationService';
import errorLogger from '../../utils/errorLogger';
import { useUserStore } from '../useUserStore';
import { messageCache } from '../../utils/messageCache';

export const createConversationSlice: StateCreator<ConversationStore, [], [], ConversationSlice> = (set, get) => ({
    conversations: [],
    isLoadingConversations: false,
    conversationId: null,
    title: null,
    selectedModel: null,
    selectedTemplate: null,
    models: [],
    templates: [],
    isLoadingModels: false,
    isLoadingTemplates: false,
    isSearching: false,

    setConversationId: (id) => set({ conversationId: id }),
    setSelectedModel: (modelId) => set({ selectedModel: modelId }),
    setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),

    fetchConversations: async (accessToken) => {
        set({ isLoadingConversations: true });
        try {
            const conversations = await conversationService.getAll(accessToken);
            set({ conversations });
        } catch (error) {
            errorLogger.error('Error fetching conversations', error as Error, { context: 'useConversationStore' });
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    searchConversations: async (query: string) => {
        set({ isSearching: true });
        try {
            const accessToken = useUserStore.getState().accessToken || '';
            const conversations = await conversationService.search(query, accessToken);
            set({ conversations });
        } catch (error) {
            errorLogger.error('Error searching conversations', error as Error);
        } finally {
            set({ isSearching: false });
        }
    },

    createConversation: async (accessToken, systemPrompt) => {
        try {
            // Priority:
            // 1. Currently selected model (from Header dropdown in New Chat state)
            // 2. User's preferred model (Settings)
            // 3. First available model (Dynamic fallback)
            const state = get();
            const user = useUserStore.getState().user;
            const preferred = user?.settings?.preferredModel || user?.preferences?.lastUsedModel;
            const firstAvailable = state.models.length > 0 ? state.models[0].id : undefined;

            const modelToUse = state.selectedModel || preferred || firstAvailable;

            const result = await conversationService.create(accessToken, systemPrompt, modelToUse);
            set({
                conversationId: result.conversationId,
                messages: [],
                allMessages: [],
                currentLeafId: null,
                title: result.title,
                selectedModel: modelToUse // Ensure store reflects what we just used
            });
            return result.conversationId;
        } catch (error) {
            errorLogger.error('Error creating conversation', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    deleteConversation: async (conversationId, accessToken) => {
        try {
            await conversationService.delete(conversationId, accessToken);
            messageCache.invalidate(conversationId);
            set((state) => ({
                conversations: state.conversations.filter(c => c.id !== conversationId),
                conversationId: state.conversationId === conversationId ? null : state.conversationId,
                messages: state.conversationId === conversationId ? [] : state.messages
            }));
        } catch (error) {
            errorLogger.error('Error deleting conversation', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    updateTitle: async (conversationId, title, accessToken) => {
        try {
            await conversationService.updateTitle(conversationId, title, accessToken);
            set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === conversationId ? { ...c, title } : c
                ),
                title: state.conversationId === conversationId ? title : state.title
            }));
        } catch (error) {
            errorLogger.error('Error updating title', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    updateConversationTemplate: async (conversationId, templateId, accessToken) => {
        if (!conversationId || !templateId) return; // Guard against nulls
        try {
            await conversationService.updateTemplate(conversationId, templateId, accessToken);
            set({ selectedTemplate: templateId });
        } catch (error) {
            errorLogger.error('Error updating conversation template', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    updateConversationModel: async (conversationId, modelId, accessToken) => {
        if (!conversationId || !modelId) return; // Guard against nulls
        try {
            await conversationService.updateModel(conversationId, modelId, accessToken);
            set({ selectedModel: modelId });
        } catch (error) {
            errorLogger.error('Error updating conversation model', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    loadConversation: async (conversationId, accessToken) => {
        set({ isFetchingMessages: true, conversationId, allMessages: [], messages: [] });
        try {
            const data = await conversationService.getById(conversationId, accessToken);
            set({
                conversationId,
                allMessages: data.messages || [],
                hasMoreMessages: data.hasMoreMessages || false,
                currentLeafId: data.currentLeafId || null,
                selectedModel: data.modelId || null,
                selectedTemplate: data.templateId || null,
                title: data.title
            });
            get()._deriveVisibleMessages();
        } catch (error) {
            errorLogger.error('Error loading conversation', error as Error, { context: 'useConversationStore' });
            throw error;
        } finally {
            set({ isFetchingMessages: false });
        }
    },

    fetchModels: async (accessToken) => {
        set({ isLoadingModels: true });
        try {
            const models = await conversationService.getModels(accessToken);
            set({ models });

            // SMART DEFAULT LOGIC:
            // Priority:
            // 1. User's specific preferred model from settings (Explicit user choice)
            // 2. Last used model (History)
            // 3. First available model (Fallback)
            const user = useUserStore.getState().user;
            const preferredModelId = user?.settings?.preferredModel;
            const lastUsedModelId = user?.preferences?.lastUsedModel;

            // Decision Tree
            let modelToSelect = null;

            if (preferredModelId && models.some(m => m.id === preferredModelId)) {
                modelToSelect = preferredModelId;
            } else if (lastUsedModelId && models.some(m => m.id === lastUsedModelId)) {
                modelToSelect = lastUsedModelId;
            } else if (models.length > 0) {
                modelToSelect = models[0].id;
            }

            if (modelToSelect) {
                set({ selectedModel: modelToSelect });
            }
        } catch (error) {
            errorLogger.error('Error fetching models', error as Error, { context: 'useConversationStore' });
        } finally {
            set({ isLoadingModels: false });
        }
    },

    fetchTemplates: async () => {
        set({ isLoadingTemplates: true });
        try {
            const { templateService } = await import('../../api/templateService');
            const templates = await templateService.getAll();
            set({ templates });
        } catch (error) {
            errorLogger.error('Error fetching templates', error as Error, { context: 'useConversationStore' });
        } finally {
            set({ isLoadingTemplates: false });
        }
    },

    handleModelSelect: async (modelId: string) => {
        const { conversationId, updateConversationModel } = get();
        const accessToken = useUserStore.getState().accessToken || '';

        set({ selectedModel: modelId });

        // If we have an active conversation, update it on the backend
        if (conversationId && accessToken) {
            await updateConversationModel(conversationId, modelId, accessToken);
        }
    },

    refreshConversation: async (accessToken) => {
        const { conversationId, currentLeafId } = get();
        if (!conversationId || !accessToken) return;

        const cached = messageCache.get(conversationId);
        if (cached) {
            console.log(`[MessageCache] Using cached messages for ${conversationId}`);
            set({
                allMessages: cached,
                currentLeafId: currentLeafId || (cached.length > 0 ? cached[cached.length - 1].id : null)
            });
            get()._deriveVisibleMessages();
            return;
        }

        try {
            const data = await conversationService.getById(conversationId, accessToken);
            set({
                title: data.title,
                allMessages: data.messages,
                currentLeafId: data.currentLeafId,
                selectedModel: data.modelId,
                selectedTemplate: data.templateId
            });
            messageCache.set(conversationId, data.messages);
            get()._deriveVisibleMessages();
            errorLogger.info('Refreshed conversation', { count: data.messages.length });
        } catch (error) {
            errorLogger.error('Error refreshing conversation', error as Error, { context: 'useConversationStore' });
        }
    },
});
