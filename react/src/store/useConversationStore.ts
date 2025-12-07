import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GnaniState, StateTrigger } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

const API_BASE_URL = 'http://localhost:3000/api';

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
  };
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
  };
}

interface ConversationStore {
  messages: ConversationMessage[]; // Visible messages
  allMessages: ConversationMessage[]; // All messages (tree)
  conversationId: string | null;
  currentLeafId: string | null;
  title: string | null;
  selectedModel: string | null;
  selectedTemplate: string | null;
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
  restoreMessage: (messageId: string, undoToken: string, accessToken: string) => Promise<void>;
  dismissUndo: () => void;
  refreshConversation: (accessToken: string) => Promise<void>;
  createConversation: (accessToken: string, systemPrompt?: string) => Promise<string>;
  sendMessage: (text: string, accessToken: string, sendViaGrpc?: (text: string) => void) => Promise<void>;
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

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      messages: [],
      allMessages: [],
      conversationId: null,
      currentLeafId: null,
      title: null,
      selectedModel: null,
      selectedTemplate: null,
      isStreaming: false,
      abortController: null,
      undoData: null,

      setConversationId: (id) => set({ conversationId: id }),

      setSelectedModel: (modelId) => set({ selectedModel: modelId }),

      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),

      updateConversationTemplate: async (conversationId, templateId, accessToken) => {
        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/template`, {
            method: 'PATCH',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ templateId })
          });

          if (!response.ok) throw new Error('Failed to update template');

          set({ selectedTemplate: templateId });
        } catch (error) {
          errorLogger.error('Error updating conversation template', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      updateConversationModel: async (conversationId, modelId, accessToken) => {
        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/model`, {
            method: 'PATCH',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelId })
          });

          if (!response.ok) throw new Error('Failed to update model');

          set({ selectedModel: modelId });
        } catch (error) {
          errorLogger.error('Error updating conversation model', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      addMessage: (message) => {
        const { currentLeafId, allMessages } = get();
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

        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
            headers: { 'x-auth-token': accessToken }
          });

          if (!response.ok) throw new Error('Failed to fetch conversation');

          const data = await response.json();

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

          let newLeafId = currentLeafId;
          // If currentLeafId is not set, or not in new messages, reset to latest
          if (!currentLeafId || !mappedMessages.find(m => m.id === currentLeafId)) {
            if (mappedMessages.length > 0) {
              const latest = mappedMessages.reduce((prev, current) =>
                (prev.timestamp > current.timestamp) ? prev : current
              );
              newLeafId = latest.id;
            } else {
              newLeafId = null;
            }
          }

          set({
            allMessages: mappedMessages,
            currentLeafId: newLeafId
          });
          get()._deriveVisibleMessages();

          errorLogger.info('Refreshed conversation', { count: mappedMessages.length });
        } catch (error) {
          errorLogger.error('Error refreshing conversation', error as Error, { context: 'useConversationStore' });
        }
      },

      createConversation: async (accessToken, systemPrompt) => {
        try {
          const response = await fetch(`${API_BASE_URL}/conversations`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ systemPrompt })
          });

          if (!response.ok) throw new Error('Failed to create conversation');

          const data = await response.json();
          const conversationId = data.conversationId; // Backend returns conversationId

          set({
            conversationId,
            messages: [],
            allMessages: [],
            currentLeafId: null,
            title: data.title
          });

          return conversationId;
        } catch (error) {
          errorLogger.error('Error creating conversation', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      sendMessage: async (text, accessToken, sendViaGrpc) => {
        const { conversationId, addMessage } = get();

        // REMOVED: Optimistic UI Update
        // The backend will echo the message back via stream:final, which useConversationSync will add
        // Adding it here causes duplicates
        // addMessage({
        //   type: 'user',
        //   message: text
        // });

        // 2. Try gRPC if available (always try if function is provided)
        if (sendViaGrpc) {
          try {
            errorLogger.info('Attempting to send via gRPC', { context: 'useConversationStore' });
            sendViaGrpc(text);
            // gRPC will handle the response via stream events
            return;
          } catch (error) {
            errorLogger.warn('gRPC send failed, falling back to REST', { context: 'useConversationStore', error });
            // Fall through to REST
          }
        } else {
          errorLogger.info('gRPC not available, using REST', { context: 'useConversationStore' });
        }

        // 3. Fallback to REST
        const controller = new AbortController();
        set({ isStreaming: true, abortController: controller });

        try {
          const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': accessToken
            },
            body: JSON.stringify({
              message: text,
              conversationId: conversationId,
            }),
            signal: controller.signal
          });

          if (!response.ok) throw new Error('Failed to send message via REST');

          const data = await response.json();

          // If backend returns a new conversation ID, update it
          if (data.conversationId && data.conversationId !== conversationId) {
            set({ conversationId: data.conversationId });
          }

          // If backend returns the assistant response immediately (REST style), add it and trigger TTS
          if (data.message) {
            addMessage({
              type: 'gnani',
              message: data.message
            });

            // Trigger TTS for REST response
            errorLogger.info('Triggering TTS for REST response', { context: 'useConversationStore', messageLength: data.message.length });

            // Dispatch custom event to trigger TTS
            window.dispatchEvent(new CustomEvent('tts:speak', {
              detail: {
                text: data.message,
                type: 'complete_response'
              }
            }));
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            errorLogger.info('Message sending cancelled by user');
          } else {
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
            await fetch(`${API_BASE_URL}/conversations/${conversationId}/cancel-stream`, {
              method: 'POST',
              headers: {
                'x-auth-token': accessToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ messageId: sessionId }) // sessionId is used as messageId/streamId context often
            });
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
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/regenerate`, {
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
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/edit`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageId, content: newContent, autoRegenerate: true }),
            signal: controller.signal
          });

          if (!response.ok) throw new Error('Failed to edit message');

          const { newAssistantMessage } = await response.json();
          // Update currentLeafId to the new assistant response to switch to this branch
          set({ currentLeafId: newAssistantMessage._id || newAssistantMessage.id });

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
          const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': accessToken }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete message');
          }

          const data = await response.json();

          if (data.undoToken) {
            set({ undoData: { messageId, undoToken: data.undoToken } });
          }

          // Refresh conversation
          await get().refreshConversation(accessToken);
        } catch (error) {
          errorLogger.error('Error deleting message', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      restoreMessage: async (messageId, undoToken, accessToken) => {
        try {
          // Assuming endpoint is similar to delete but restore
          const response = await fetch(`${API_BASE_URL}/conversations/messages/${messageId}/restore`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ undoToken })
          });

          if (!response.ok) throw new Error('Failed to restore message');

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
        conversationId: state.conversationId // Only persist current conversation ID
      }),
      onRehydrateStorage: () => () => {
        // Messages will be fetched from backend when conversationId is set
        // GnaniCore.tsx handles this via useEffect on conversationId change
      }
    }
  )
);
