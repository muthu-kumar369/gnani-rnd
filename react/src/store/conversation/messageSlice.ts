import type { StateCreator } from 'zustand';
import type { ConversationStore, ConversationMessage, MessageSlice } from './types';
import { conversationService } from '../../services/conversationService';
import errorLogger from '../../utils/errorLogger';
import { useUserStore } from '../useUserStore';
import { useAnalyticsStore } from '../useAnalyticsStore'; // Fixed path
import { messageCache } from '../../utils/messageCache';

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createMessageSlice: StateCreator<ConversationStore, [], [], MessageSlice> = (set, get) => ({
    messages: [],
    allMessages: [],
    currentLeafId: null,
    isStreaming: false,
    streamProgress: 0,
    isFetchingMessages: false,
    hasMoreMessages: false,
    abortController: null,
    progressInterval: null,

    // Undo state removed - managed by undoSlice

    setIsStreaming: (isStreaming: boolean) => {
        set((state) => {
            if (state.progressInterval) clearInterval(state.progressInterval);
            let newInterval = null;

            if (isStreaming) {
                state.setStreamProgress(10);
                newInterval = setInterval(() => {
                    set((currentState) => {
                        const current = currentState.streamProgress;
                        if (current < 90) {
                            const increment = Math.max(0.5, (90 - current) / 20);
                            return { streamProgress: Math.min(90, current + increment) };
                        }
                        return {};
                    });
                }, 200);
            } else {
                state.setStreamProgress(100);
                setTimeout(() => state.setStreamProgress(0), 500);
            }

            return {
                isStreaming,
                progressInterval: newInterval
            };
        });
    },

    setStreamProgress: (progress: number) => set({ streamProgress: progress }),

    addMessage: (message) => {
        const { currentLeafId, allMessages, conversationId } = get();
        const newMessage: ConversationMessage = {
            ...message,
            id: message._id || generateId(),
            timestamp: Date.now(),
            parentId: currentLeafId || undefined
        };

        const updatedAllMessages = [...allMessages, newMessage];

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

        if (conversationId) {
            messageCache.set(conversationId, updatedAllMessages);
        }
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

        while (currentId) {
            const msg = msgMap.get(currentId);
            if (!msg) break;
            path.unshift(msg);
            currentId = msg.parentId;
        }

        const isBrokenChain = path.length < allMessages.length && path.length === 1;

        if (isBrokenChain) {
            const sortedMessages = [...allMessages].sort((a, b) => a.timestamp - b.timestamp);
            set({ messages: sortedMessages });
        } else {
            set({ messages: path });
        }
    },

    fetchPreviousMessages: async (conversationId: string, before?: string) => {
        const { isFetchingMessages, hasMoreMessages } = get();
        const accessToken = useUserStore.getState().accessToken;
        if (isFetchingMessages || !hasMoreMessages || !accessToken) return;

        set({ isFetchingMessages: true });
        try {
            const result = await conversationService.getPreviousMessages(conversationId, before, accessToken);
            set(state => ({
                allMessages: [...result.messages, ...state.allMessages],
                hasMoreMessages: result.hasMore
            }));
            get()._deriveVisibleMessages();
        } catch (error) {
            errorLogger.error('Error fetching previous messages', error as Error);
        } finally {
            set({ isFetchingMessages: false });
        }
    },

    uploadFile: async (file, accessToken) => {
        try {
            return await conversationService.uploadFile(file, accessToken);
        } catch (error) {
            errorLogger.error('Error uploading file', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    sendMessage: async (text, accessToken, attachments = [], sendViaGrpc) => {
        if (!navigator.onLine) {
            console.log('[Offline Mode] Queuing message:', text);
            get().addMessage({
                type: 'user',
                message: text,
                metadata: { status: 'queued' }
            });

            const { offlineQueue } = await import('../../utils/offlineQueue'); // Fixed local path? No, utils is ../../utils
            offlineQueue.add(
                `${import.meta.env.VITE_API_URL}/conversations/${get().conversationId}/messages`,
                'POST',
                { text, attachments },
                { Authorization: `Bearer ${accessToken}` }
            );
            return;
        }

        const { conversationId } = get();
        useAnalyticsStore.getState().trackEvent('message_sent', { conversationId });
        useAnalyticsStore.getState().incrementMessages();

        get().addMessage({ type: 'user', message: text });

        const assistantPlaceholderId = generateId();
        get().addMessage({
            _id: assistantPlaceholderId,
            type: 'gnani',
            message: ''
        });

        const controller = new AbortController();
        get().setIsStreaming(true);
        set({ abortController: controller });

        if (sendViaGrpc) {
            try {
                errorLogger.info('Attempting to send via gRPC', { context: 'useConversationStore' });
                sendViaGrpc(text);
                return;
            } catch (error) {
                errorLogger.warn('gRPC send failed, falling back to REST', { context: 'useConversationStore', error });
            }
        }

        try {
            await conversationService.sendMessage(
                { text, conversationId: conversationId || '', attachments },
                accessToken,
                {
                    onChunk: ({ content }) => {
                        get().updateMessageContent(assistantPlaceholderId, content, true);
                    },
                    onComplete: async (content, newConversationId) => {
                        get().updateMessageContent(assistantPlaceholderId, content, false);
                        if (newConversationId && newConversationId !== conversationId) {
                            set({ conversationId: newConversationId });
                            await get().fetchConversations(accessToken);
                        }
                        window.dispatchEvent(new CustomEvent('tts:speak', {
                            detail: { text: content, type: 'complete_response' }
                        }));
                    },
                    onError: (err) => { throw err; }
                },
                controller.signal
            );
        } catch (error: any) {
            if (error.name === 'AbortError') {
                errorLogger.info('Message sending cancelled by user');
            } else {
                const { parseError } = await import('../../utils/errorParser');
                const { useErrorStore } = await import('../useErrorStore'); // Store is in ..
                const parsedError = parseError(error);
                useErrorStore.getState().addError(
                    parsedError.message,
                    parsedError.action === 'Retry' ? () => get().sendMessage(text, accessToken, attachments, sendViaGrpc) : undefined
                );
                errorLogger.error('Failed to send message via REST', error as Error, { context: 'useConversationStore' });
            }
        } finally {
            get().setIsStreaming(false);
            set({ abortController: null });
        }
    },

    updateMessageContent: (messageId, content, append = false) => {
        set((state) => {
            const allMessages = state.allMessages.map(msg => {
                if (msg.id === messageId || msg._id === messageId) {
                    return {
                        ...msg,
                        message: append ? (msg.message + content) : content,
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

    cancelStream: async (sessionId, accessToken) => {
        const { abortController, conversationId } = get();
        if (abortController) {
            abortController.abort();
            set({ abortController: null });
        }
        get().setIsStreaming(false);
        if (conversationId && accessToken) {
            await conversationService.cancelStream(conversationId, sessionId, accessToken);
        }
    },

    regenerateResponse: async (messageId, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        const message = get().allMessages.find(m => m.id === messageId || m._id === messageId);
        if (message) {
            get().pushUndo({
                type: 'regenerate',
                messageId,
                previousState: message,
                timestamp: Date.now()
            });
        }

        const controller = new AbortController();
        get().setIsStreaming(true);
        set({ abortController: controller });

        try {
            const newAssistantMessage = await conversationService.regenerate(
                conversationId,
                messageId,
                accessToken,
                controller.signal
            );
            set({ currentLeafId: newAssistantMessage._id || newAssistantMessage.id });
            await get().refreshConversation(accessToken);
            get().showUndoToast('Response regenerated', () => get().undoRegenerate(messageId, accessToken));
        } catch (error: any) {
            if (error.name === 'AbortError') {
                errorLogger.info('Regeneration cancelled by user');
            } else {
                errorLogger.error('Error regenerating response', error as Error, { context: 'useConversationStore' });
                throw error;
            }
        } finally {
            get().setIsStreaming(false);
            set({ abortController: null });
        }
    },

    editMessage: async (messageId, newContent, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        const message = get().allMessages.find(m => m.id === messageId || m._id === messageId);
        if (message) {
            get().pushUndo({
                type: 'edit',
                messageId,
                previousState: { content: message.message },
                timestamp: Date.now()
            });
        }

        const controller = new AbortController();
        get().setIsStreaming(true);
        set({ abortController: controller });

        try {
            const { newResponse } = await conversationService.editMessage(
                conversationId,
                messageId,
                newContent,
                accessToken,
                controller.signal
            );

            if (newResponse) {
                set({ currentLeafId: newResponse._id || newResponse.id });
            }

            messageCache.invalidate(conversationId);
            await get().refreshConversation(accessToken);
            get().showUndoToast('Message edited', () => get().undoEdit(messageId, accessToken));
        } catch (error: any) {
            if (error.name === 'AbortError') {
                errorLogger.info('Edit cancelled by user');
            } else {
                errorLogger.error('Error editing message', error as Error, { context: 'useConversationStore' });
                throw error;
            }
        } finally {
            get().setIsStreaming(false);
            set({ abortController: null });
        }
    },

    deleteMessage: async (messageId, accessToken) => {
        const { conversationId } = get();
        if (!conversationId || !accessToken) return;

        try {
            const message = get().allMessages.find(m => m.id === messageId || m._id === messageId);
            if (message) {
                get().pushUndo({
                    type: 'delete',
                    messageId,
                    previousState: message,
                    timestamp: Date.now()
                });
            }

            const result = await conversationService.deleteMessage(conversationId, messageId, accessToken);

            if (result.undoToken) {
                set({
                    undoData: {
                        messageId,
                        undoToken: result.undoToken
                    }
                });
                setTimeout(() => {
                    const currentUndo = get().undoData;
                    if (currentUndo && currentUndo.undoToken === result.undoToken) {
                        set({ undoData: null });
                    }
                }, 30000);
            }

            const { allMessages } = get();
            const parentOfDeleted = allMessages.find(m => m.children && m.children.includes(messageId));
            if (parentOfDeleted) {
                set({ currentLeafId: parentOfDeleted.id });
            }

            messageCache.invalidate(conversationId);
            await get().refreshConversation(accessToken);
            get().showUndoToast('Message deleted', () => get().undoDelete(messageId, accessToken));
        } catch (error) {
            errorLogger.error('Error deleting message', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    // Undo methods removed

    navigateToBranch: (messageId, direction) => {
        const { allMessages } = get();
        const message = allMessages.find(m => m.id === messageId);
        if (!message) return;

        if (!message.parentId) return;
        const parent = allMessages.find(m => m.id === message.parentId);
        if (!parent || !parent.children) return;

        const currentIndex = parent.children.indexOf(messageId);
        if (currentIndex === -1) return;

        const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

        if (nextIndex >= 0 && nextIndex < parent.children.length) {
            const nextMessageId = parent.children[nextIndex];
            // Find leaf
            let leaf = nextMessageId;
            // Optimization: Precompute map? No, loop is fine for now.
            // Actually we need to traverse down to find the *active* leaf of that branch?
            // Or just the latest leaf?
            // Simplest is to traverse down picking the last child/active child?
            // Gnani logic usually picks the last generated child.
            // Let's just walk down.
            // Note: `allMessages` isn't a tree structure in memory, just array.

            const childrenMap = new Map();
            allMessages.forEach(m => {
                if (m.parentId) {
                    if (!childrenMap.has(m.parentId)) childrenMap.set(m.parentId, []);
                    childrenMap.get(m.parentId).push(m);
                }
            });

            let current = nextMessageId;
            while (childrenMap.has(current)) {
                const children = childrenMap.get(current);
                // Default to last child (most recent branch)
                current = children[children.length - 1].id;
            }

            set({ currentLeafId: current });
            get()._deriveVisibleMessages();
        }
    },

    navigateToGeneration: (messageId, direction) => get().navigateToBranch(messageId, direction)
});
