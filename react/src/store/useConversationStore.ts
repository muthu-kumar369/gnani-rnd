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
}

interface ConversationStore {
  messages: ConversationMessage[]; // Visible messages
  allMessages: ConversationMessage[]; // All messages (tree)
  sessionId: string | null;
  currentLeafId: string | null;
  title: string | null;

  // Actions
  setSessionId: (id: string | null) => void;
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  getMessagesByType: (type: ConversationMessage['type']) => ConversationMessage[];
  regenerateResponse: (messageId: string, accessToken: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string, accessToken: string) => Promise<void>;
  refreshConversation: (accessToken: string) => Promise<void>;
  navigateToBranch: (messageId: string, direction: 'prev' | 'next') => void;
  
  // Helpers
  _deriveVisibleMessages: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      messages: [],
      allMessages: [],
      sessionId: null,
      currentLeafId: null,
      title: null,

      setSessionId: (id) => set({ sessionId: id }),

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
        const { sessionId, currentLeafId } = get();
        if (!sessionId || !accessToken) return;

        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${sessionId}`, {
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

      regenerateResponse: async (messageId, accessToken) => {
        const { sessionId } = get();
        if (!sessionId || !accessToken) return;

        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${messageId}/regenerate`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId })
          });

          if (!response.ok) throw new Error('Failed to regenerate response');
          
          const newAssistantMessage = await response.json();
          // Update currentLeafId to the new message to switch to this branch
          set({ currentLeafId: newAssistantMessage._id || newAssistantMessage.id });
          
          await get().refreshConversation(accessToken);
        } catch (error) {
          errorLogger.error('Error regenerating response', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

      editMessage: async (messageId, newContent, accessToken) => {
        const { sessionId } = get();
        if (!sessionId || !accessToken) return;

        try {
          const response = await fetch(`${API_BASE_URL}/conversations/${messageId}/edit`, {
            method: 'POST',
            headers: {
              'x-auth-token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, newContent })
          });

          if (!response.ok) throw new Error('Failed to edit message');
          
          const { newAssistantMessage } = await response.json();
          // Update currentLeafId to the new assistant response to switch to this branch
          set({ currentLeafId: newAssistantMessage._id || newAssistantMessage.id });
          
          await get().refreshConversation(accessToken);
        } catch (error) {
          errorLogger.error('Error editing message', error as Error, { context: 'useConversationStore' });
          throw error;
        }
      },

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
      partialize: (state) => ({ allMessages: state.allMessages, currentLeafId: state.currentLeafId }),
      onRehydrateStorage: () => (state) => {
        state?._deriveVisibleMessages();
      }
    }
  )
);
