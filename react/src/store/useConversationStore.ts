import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GnaniState, StateTrigger } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';
import { messageCache } from '../utils/messageCache'; // STAGE R1: New message cache
import { useAnalyticsStore } from './useAnalyticsStore'; // STAGE 20
import { useModelStore } from './useModelStore'; // STAGE 23
import apiClient from '../api/client'; // STAGE 1
import { MessageTreeValidator } from '../utils/messageTreeValidator'; // STAGE 1: Message validation

export interface ConversationMessage {
  id: string;
  _id?: string;
  type: 'user' | 'gnani' | 'tts' | 'action' | 'system';
  message: string;
  timestamp: number;
  parentId?: string;
  children?: string[];
  branchIndex?: number;
  metadata?: {
    segmentId?: string;
    state?: GnaniState;
    trigger?: StateTrigger;
    actionType?: string;
    fromState?: GnaniState;
    toState?: GnaniState;
    image?: string;
    mimeType?: string;
    edited?: boolean; // NEW: Track if message was edited
    status?: 'queued' | 'sending' | 'failed' | 'sent'; // STAGE 16: Offline mode status
    model?: string; // STAGE 23: Model used for this message
  };
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface LlmModel {
  id: string;
  displayName: string;
  description?: string;
  provider?: string;
}

interface ConversationStore {
  messages: ConversationMessage[]; // Visible messages
  allMessages: ConversationMessage[]; // All messages (tree)
  conversations: ConversationSummary[];
  isLoadingConversations: boolean;
  conversationId: string | null;
  currentLeafId: string | null;
  title: string | null;
  selectedModel: string | null;
  selectedTemplate: string | null;
  models: LlmModel[]; // List of available models
  isLoadingModels: boolean;
  isStreaming: boolean;
  abortController: AbortController | null;

  undoData: { messageId: string; undoToken: string } | null;

  // Actions
  setConversationId: (id: string | null) => void;
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  getMessagesByType: (type: ConversationMessage['type']) => ConversationMessage[];
  regenerateResponse: (messageId: string, accessToken: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string, accessToken: string) => Promise<void>;
  deleteMessage: (messageId: string, accessToken: string) => Promise<void>;
  deleteConversation: (conversationId: string, accessToken: string) => Promise<void>;
  updateTitle: (conversationId: string, title: string, accessToken: string) => Promise<void>;
  restoreMessage: (messageId: string, undoToken: string, accessToken: string) => Promise<void>;
  dismissUndo: () => void;
  refreshConversation: (accessToken: string) => Promise<void>;
  fetchConversations: (accessToken: string) => Promise<void>;
  fetchModels: (accessToken: string) => Promise<void>;
  uploadFile: (file: File, accessToken: string) => Promise<{ fileId: string; url: string; filename: string }>;
  createConversation: (accessToken: string, systemPrompt?: string) => Promise<string>;
  sendMessage: (text: string, accessToken: string, attachments?: any[], sendViaGrpc?: (text: string) => void) => Promise<void>;
  navigateToBranch: (messageId: string, direction: 'prev' | 'next') => void;
  navigateToGeneration: (messageId: string, direction: 'prev' | 'next') => void; // Alias for consistency
  setSelectedModel: (modelId: string) => void;
  setSelectedTemplate: (templateId: string) => void;
  updateConversationTemplate: (conversationId: string, templateId: string, accessToken: string) => Promise<void>;
  updateConversationModel: (conversationId: string, modelId: string, accessToken: string) => Promise<void>;
  setIsStreaming: (isStreaming: boolean) => void;
  cancelStream: (sessionId: string, accessToken: string) => Promise<void>;
  updateLastMessageContent: (content: string, append?: boolean) => void;
  updateMessageContent: (messageId: string, content: string, append?: boolean) => void;

  // Helpers
  _deriveVisibleMessages: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// STAGE R1: Using new messageCache utility (no need for local cache instance)

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      messages: [],
      allMessages: [],
      conversations: [],
      isLoadingConversations: false,
      conversationId: null,
      currentLeafId: null,
      title: null,
      selectedModel: null,
      selectedTemplate: null,
      models: [],
      isLoadingModels: false,
      isStreaming: false,
      abortController: null,
      undoData: null,

      setConversationId: (id) => set({ conversationId: id }),

      setSelectedModel: (modelId) => set({ selectedModel: modelId }),

      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),

      updateConversationTemplate: async (conversationId, templateId, accessToken) => {
        try {
          // STAGE 1: Use apiClient
          await apiClient.patch(`/conversations/${conversationId}/template`, { templateId });
          set({ selectedTemplate: templateId });
        } catch (error) {
          errorLogger.error('Error updating conversation template', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      updateConversationModel: async (conversationId, modelId, accessToken) => {
        try {
          // STAGE 1: Use apiClient
          await apiClient.patch(`/conversations/${conversationId}/model`, { modelId });
          set({ selectedModel: modelId });
        } catch (error) {
          errorLogger.error('Error updating conversation model', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      addMessage: (message) => {
        const { currentLeafId, allMessages, conversationId } = get();
        const newMessage: ConversationMessage = {
          ...message,
          id: message._id || generateId(),
          timestamp: Date.now(),
          parentId: currentLeafId || undefined
        };

        const updatedAllMessages = [...allMessages, newMessage];

        // Update parent's children
        if (currentLeafId) {
          const parentIndex = updatedAllMessages.findIndex(m => m.id === currentLeafId);
          if (parentIndex !== -1) {
            const parent = updatedAllMessages[parentIndex];
            updatedAllMessages[parentIndex] = {
              ...parent,
              children: [...(parent.children || []), newMessage.id]
            };
          }
        }

        set({
          allMessages: updatedAllMessages,
          currentLeafId: newMessage.id
        });

        get()._deriveVisibleMessages();

        // STAGE R1: Update cache with new message
        if (conversationId) {
          messageCache.set(conversationId, updatedAllMessages);
        }

        errorLogger.debug('Added message to conversation', {
          context: 'useConversationStore',
          type: message.type
        });
      },

      clearMessages: () => {
        set({
          allMessages: [],
          messages: [],
          currentLeafId: null,
          title: null
        });
      },

      getMessagesByType: (type) => {
        return get().messages.filter(msg => msg.type === type);
      },

      _deriveVisibleMessages: () => {
        const { currentLeafId, allMessages } = get();
        if (!currentLeafId || allMessages.length === 0) {
          set({ messages: [] });
          return;
        }

        const path: ConversationMessage[] = [];
        let currentId: string | undefined = currentLeafId;
        const msgMap = new Map(allMessages.map(m => [m.id, m]));

        // 1. Try to traverse the tree from leaf to root
        while (currentId) {
          const msg = msgMap.get(currentId);
          if (!msg) break;
          path.unshift(msg);
          currentId = msg.parentId;
        }

        // 2. Check for broken chains or missing parents
        // If we have multiple messages but the path only has 1 (and it's not the only message),
        // or if we have messages with null parentId that are not at the start of the path.

        // Fallback: If the path length is significantly smaller than allMessages length,
        // and we suspect broken links (e.g. multiple roots), let's try to be smart.

        // For now, if we have a broken tree (assistant message with null parent), 
        // the path will be just the assistant message.

        // Heuristic: If path has 1 item, but allMessages has > 1, and the item in path is NOT the oldest message,
        // then we likely have a broken link.

        const isBrokenChain = path.length < allMessages.length && path.length === 1;

        if (isBrokenChain) {
          // Fallback to linear sort by timestamp for this branch
          // This is a simplification but handles the "broken parentId" case
          const sortedMessages = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
          set({ messages: sortedMessages });
        } else {
          set({ messages: path });
        }
      },

      refreshConversation: async (accessToken) => {
        const { conversationId, currentLeafId } = get();
        if (!conversationId || !accessToken) return;

        // STAGE R1: Check cache first
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

        // Cache miss - fetch from backend
        try {
          // STAGE 1: Use apiClient
          const response = await apiClient.get(`/conversations/${conversationId}`);
          const data = response.data;

          set({ title: data.title });

          const mappedMessages: ConversationMessage[] = data.messages.map((msg: any) => ({
            id: msg.id || msg._id,
            _id: msg.id || msg._id,
            type: msg.role === 'assistant' ? 'gnani' : msg.role,
            message: msg.content,
            timestamp: new Date(msg.timestamp).getTime(),
            parentId: msg.parentId,
            children: msg.children,
            branchIndex: msg.branchIndex,
            metadata: msg.metadata
          }));

          // STAGE 1: Validate and repair message tree
          const validation = MessageTreeValidator.validate(mappedMessages);
          let finalMessages = mappedMessages;

          if (!validation.isValid) {
            errorLogger.warn('Message tree validation failed', {
              context: 'useConversationStore',
              errors: validation.errors,
              repairs: validation.repairs
            });
            finalMessages = MessageTreeValidator.repair(mappedMessages);
            errorLogger.info('Message tree repaired', {
              context: 'useConversationStore',
              originalCount: mappedMessages.length,
              repairedCount: finalMessages.length
            });
          }

          let newLeafId = currentLeafId;
          // If currentLeafId is not set, or not in new messages, reset to latest
          if (!currentLeafId || !finalMessages.find(m => m.id === currentLeafId)) {
            if (finalMessages.length > 0) {
              const latest = finalMessages.reduce((prev, current) =>
                (prev.timestamp > current.timestamp) ? prev : current
              );
              newLeafId = latest.id;
            } else {
              newLeafId = null;
            }
          }

          set({
            allMessages: finalMessages,
            currentLeafId: newLeafId
          });

          // STAGE R1: Update cache
          messageCache.set(conversationId, finalMessages);

          get()._deriveVisibleMessages();

          errorLogger.info('Refreshed conversation', { count: mappedMessages.length });
        } catch (error) {
          errorLogger.error('Error refreshing conversation', error as Error, { context: 'useConversationStore' });
        }
      },

      fetchConversations: async (accessToken) => {
        set({ isLoadingConversations: true });
        try {
          // STAGE 1: Use apiClient
          const response = await apiClient.get('/conversations');
          const data = response.data;
          // Backend returns { conversations: [], total, page, ... }
          const conversationList = data.conversations || [];

          const mapped = conversationList.map((c: any) => ({
            id: c.conversationId || c.id || c._id,
            title: c.title || 'Untitled Conversation',
            updatedAt: c.updatedAt || new Date().toISOString()
          }));

          // Sort by recent
          mapped.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          set({ conversations: mapped });
        } catch (error) {
          errorLogger.error('Error fetching conversations', error as Error, { context: 'useConversationStore' });
        } finally {
          set({ isLoadingConversations: false });
        }
      },

      loadConversation: async (conversationId: string, accessToken: string) => {
        try {
          // STAGE 1: Use apiClient
          // Assuming apiClient is configured to include auth token
          const response = await apiClient.get(`/conversations/${conversationId}`);
          const data = response.data;

          set({
            conversationId,
            allMessages: data.messages || [],
            currentLeafId: data.currentLeafId || null,
            selectedModel: data.modelId || null,
            selectedTemplate: data.templateId || null
          });
        } catch (error) {
          errorLogger.error('Error loading conversation', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      fetchModels: async (accessToken) => {
        set({ isLoadingModels: true });
        try {
          // STAGE 1: Use apiClient
          const response = await apiClient.get('/llm/models');
          const data = response.data;
          set({ models: data.models || [] });
        } catch (error) {
          errorLogger.error('Error fetching models', error as Error, { context: 'useConversationStore' });
        } finally {
          set({ isLoadingModels: false });
        }
      },

      uploadFile: async (file, accessToken) => {
        try {
          const formData = new FormData();
          formData.append('file', file);

          // STAGE 1: Use apiClient for file upload
          const response = await apiClient.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data;
        } catch (error) {
          errorLogger.error('Error uploading file', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      createConversation: async (accessToken, systemPrompt) => {
        try {
          // STAGE 1: Use apiClient
          const response = await apiClient.post('/conversations', { systemPrompt });
          const data = response.data;
          const conversationId = data.conversationId; // Backend returns conversationId

          set({
            conversationId,
            messages: [],
            allMessages: [],
            currentLeafId: null,
            title: data.title || 'New Conversation'
          });

          return conversationId;
        } catch (error) {
          errorLogger.error('Error creating conversation', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      sendMessage: async (text, accessToken, attachments = [], sendViaGrpc) => {
        // STAGE 16: Check if offline and queue message
        if (!navigator.onLine) {
          console.log('[Offline Mode] Queuing message:', text);

          // Add user message with 'queued' status
          get().addMessage({
            type: 'user',
            message: text,
            metadata: { status: 'queued' }
          });

          // Queue the request for later
          const { offlineQueue } = await import('../utils/offlineQueue');
          offlineQueue.add(
            `${import.meta.env.VITE_API_URL}/conversations/${get().conversationId}/messages`,
            'POST',
            { text, attachments },
            { Authorization: `Bearer ${accessToken}` }
          );

          return;
        }

        const { conversationId, addMessage } = get();

        // STAGE 20: Track message sent
        useAnalyticsStore.getState().trackEvent('message_sent', { conversationId });
        useAnalyticsStore.getState().incrementMessages();

        // Optimistic UI Update: Add user message immediately
        addMessage({
          type: 'user',
          message: text
        });

        // FIX: Add placeholder assistant message for streaming
        const assistantPlaceholderId = generateId();
        addMessage({
          _id: assistantPlaceholderId,
          type: 'gnani',
          message: '' // Empty placeholder
        });

        // Set streaming state immediately for UI feedback (Stop button etc)
        const controller = new AbortController();
        set({ isStreaming: true, abortController: controller });

        // 2. Try gRPC if available (always try if function is provided)
        if (sendViaGrpc) {
          try {
            errorLogger.info('Attempting to send via gRPC', { context: 'useConversationStore' });
            sendViaGrpc(text);
            // gRPC will handle the response via stream events
            // We do NOT set isStreaming false here; GnaniCore handles it on complete_response or error
            return;
          } catch (error) {
            errorLogger.warn('gRPC send failed, falling back to REST', { context: 'useConversationStore', error });
            // Fall through to REST
          }
        } else {
          errorLogger.info('gRPC not available, using REST', { context: 'useConversationStore' });
        }

        // 3. Fallback to REST
        // controller is already created above

        try {
          // STAGE 1: Use apiClient for sending message
          const response = await apiClient.post(
            `/conversations/${conversationId}/messages`,
            { text, attachments },
            {
              signal: controller.signal,
              headers: {
                'x-auth-token': accessToken,
                'Content-Type': 'application/json'
              },
              responseType: 'stream' // Indicate that we expect a stream
            }
          );

          // Handle streaming response
          const reader = response.data.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete JSON objects from the buffer
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.substring(0, newlineIndex).trim();
              buffer = buffer.substring(newlineIndex + 1);

              if (line) {
                try {
                  const event = JSON.parse(line);
                  if (event.type === 'message_chunk') {
                    get().updateMessageContent(assistantPlaceholderId, event.content, true);
                  } else if (event.type === 'complete_response') {
                    // Final message content is already updated by chunks, but ensure final state
                    get().updateMessageContent(assistantPlaceholderId, event.content, false);

                    // If backend returns a new conversation ID, update it
                    if (event.conversationId && event.conversationId !== conversationId) {
                      set({ conversationId: event.conversationId });
                      // FIX: Refresh conversation list when new conversation is created
                      await get().fetchConversations(accessToken);
                    }

                    // Trigger TTS for complete response
                    errorLogger.info('Triggering TTS for streaming response', { context: 'useConversationStore', messageLength: event.content.length });
                    window.dispatchEvent(new CustomEvent('tts:speak', {
                      detail: {
                        text: event.content,
                        type: 'complete_response'
                      }
                    }));
                  } else if (event.type === 'error') {
                    throw new Error(event.message || 'Streaming error');
                  }
                } catch (parseError) {
                  errorLogger.error('Error parsing stream chunk', parseError as Error, { context: 'useConversationStore', chunk: line });
                }
              }
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            errorLogger.info('Message sending cancelled by user');
          } else {
            // STAGE 17: Parse error for user-friendly message
            const { parseError } = await import('../utils/errorParser');
            const { useErrorStore } = await import('./useErrorStore');
            const parsedError = parseError(error);

            // Add to error store for toast display
            useErrorStore.getState().addError(
              parsedError.message,
              parsedError.action === 'Retry' ? () => get().sendMessage(text, accessToken, attachments, sendViaGrpc) : undefined
            );

            // Log for debugging
            console.error('[SendMessage Error]', {
              code: parsedError.code,
              title: parsedError.title,
              original: parsedError.originalError
            });

            errorLogger.error('Failed to send message via REST', error as Error, { context: 'useConversationStore' });
            // TODO: Mark message as failed in UI?
          }
        } finally {
          set({ isStreaming: false, abortController: null });
        }
      },

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      cancelStream: async (sessionId, accessToken) => {
        const { abortController, conversationId } = get();
        if (abortController) {
          abortController.abort();
          set({ abortController: null });
        }

        // Always reset streaming state
        set({ isStreaming: false });

        // Also notify backend to cancel processing
        if (conversationId && accessToken) {
          try {
            // STAGE 1: Use apiClient
            await apiClient.post(
              `/conversations/${conversationId}/cancel-stream`,
              { messageId: sessionId },
              {
                headers: {
                  'x-auth-token': accessToken,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (e) {
            errorLogger.warn('Failed to notify backend of cancellation', { error: e });
          }
        }
      },

      updateMessageContent: (messageId, content, append = false) => {
        set((state) => {
          const allMessages = state.allMessages.map(msg => {
            if (msg.id === messageId || msg._id === messageId) {
              return {
                ...msg,
                message: append ? (msg.message + content) : content,
                // Ensure type is 'gnani' if we are appending content (assistant response)
                type: (msg.type === 'gnani' || msg.type === 'action') ? msg.type : 'gnani'
              };
            }
            return msg;
          });
          return { allMessages };
        });
        get()._deriveVisibleMessages();
      },

      updateLastMessageContent: (content, append = true) => {
        const { currentLeafId } = get();
        if (!currentLeafId) return;
        get().updateMessageContent(currentLeafId, content, append);
      },

      regenerateResponse: async (messageId, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        const controller = new AbortController();
        set({ isStreaming: true, abortController: controller });

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationId}/regenerate`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageId }),
            signal: controller.signal
          });

          if (!response.ok) throw new Error('Failed to regenerate response');

          const newAssistantMessage = await response.json();
          // Update currentLeafId to the new message to switch to this branch
          // Backend returns the message object directly
          set({ currentLeafId: newAssistantMessage._id || newAssistantMessage.id });

          await get().refreshConversation(accessToken);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            errorLogger.info('Regeneration cancelled by user');
          } else {
            errorLogger.error('Error regenerating response', error as Error, { context: 'useConversationStore' });
            throw error;
          }
        } finally {
          set({ isStreaming: false, abortController: null });
        }
      },

      editMessage: async (messageId, newContent, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        const controller = new AbortController();
        set({ isStreaming: true, abortController: controller });

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationId}/edit`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageId, content: newContent, autoRegenerate: true }),
            signal: controller.signal
          });

          if (!response.ok) throw new Error('Failed to edit message');

          const { newResponse } = await response.json();
          // Update currentLeafId to the new assistant response to switch to this branch
          if (newResponse) {
            set({ currentLeafId: newResponse._id || newResponse.id });
          } else {
            // If no new response (e.g. autoRegenerate=false), just refresh.
            // But we probably want to stay on the user message? Or the last leaf of that branch?
            //refreshConversation handles finding the leaf if we don't set it.
          }

          // STAGE R1: Invalidate cache before refresh
          messageCache.invalidate(conversationId);

          await get().refreshConversation(accessToken);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            errorLogger.info('Edit cancelled by user');
          } else {
            errorLogger.error('Error editing message', error as Error, { context: 'useConversationStore' });
            throw error;
          }
        } finally {
          set({ isStreaming: false, abortController: null });
        }
      },

      deleteMessage: async (messageId, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        try {
          // STAGE 1: Use apiClient
          await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);

          // Remove message from local state
          set((state) => ({
            allMessages: state.allMessages.filter(m => m.id !== messageId && m._id !== messageId)
          }));

          // STAGE R1: Invalidate cache before refresh
          messageCache.invalidate(conversationId);

          // Refresh conversation
          await get().refreshConversation(accessToken);
        } catch (error) {
          errorLogger.error('Error deleting message', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      deleteConversation: async (conversationId, accessToken) => {
        try {
          // STAGE 1: Use apiClient
          await apiClient.delete(`/conversations/${conversationId}`);

          // STAGE R1: Invalidate cache
          messageCache.invalidate(conversationId);

          // Remove from local list
          set((state) => ({
            conversations: state.conversations.filter(c => c.id !== conversationId),
            // Reset active if deleted
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
          // STAGE 1: Use apiClient
          await apiClient.patch(
            `/conversations/${conversationId}/title`,
            { title },
            {
              headers: {
                'x-auth-token': accessToken,
                'Content-Type': 'application/json'
              }
            }
          );

          // Update local list
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

      restoreMessage: async (messageId, undoToken, accessToken) => {
        try {
          // STAGE 1: Use apiClient
          await apiClient.post(`/conversations/messages/${messageId}/restore`, { undoToken });

          set({ undoData: null });

          // Refresh current conversation
          const { conversationId } = get();
          if (conversationId) {
            await get().refreshConversation(accessToken);
          }
        } catch (error) {
          errorLogger.error('Error restoring message', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      dismissUndo: () => set({ undoData: null }),

      navigateToGeneration: (messageId, direction) => get().navigateToBranch(messageId, direction),

      navigateToBranch: (messageId, direction) => {
        const { allMessages } = get();
        const message = allMessages.find(m => m.id === messageId);
        if (!message || !message.parentId) return;

        const parent = allMessages.find(m => m.id === message.parentId);
        if (!parent || !parent.children) return;

        const currentIndex = parent.children.indexOf(messageId);
        if (currentIndex === -1) return;

        let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (targetIndex < 0) targetIndex = parent.children.length - 1;
        if (targetIndex >= parent.children.length) targetIndex = 0;

        const targetId = parent.children[targetIndex];

        // Find the latest leaf descendant of the target sibling
        let bestLeafId = targetId;
        let latestTimestamp = 0;

        const findLeaf = (rootId: string) => {
          const root = allMessages.find(m => m.id === rootId);
          if (!root) return;

          if (!root.children || root.children.length === 0) {
            if (root.timestamp > latestTimestamp) {
              latestTimestamp = root.timestamp;
              bestLeafId = root.id;
            }
          } else {
            // Default to last child (latest branch)
            findLeaf(root.children[root.children.length - 1]);
          }
        };

        findLeaf(targetId);

        set({ currentLeafId: bestLeafId });
        get()._deriveVisibleMessages();
      }
    }),
    {
      name: 'gnani_conversation_history',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // We do NOT persist conversationId anymore, so we start fresh (New Chat) on every load
        // conversationId: state.conversationId 
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure conversationId is null on rehydrate just in case
        if (state) {
          state.conversationId = null;
          state.messages = [];
          state.currentLeafId = null;
        }
      }
    }
  )
);
