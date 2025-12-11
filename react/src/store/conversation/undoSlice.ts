import type { StateCreator } from 'zustand';
import type { ConversationStore, UndoSlice } from './types';
import { conversationService } from '../../services/conversationService';
import errorLogger from '../../utils/errorLogger';
import { messageCache } from '../../utils/messageCache';

export const createUndoSlice: StateCreator<ConversationStore, [], [], UndoSlice> = (set, get) => ({
    undoData: null,
    undoStack: [],
    currentUndoToast: null,

    pushUndo: (action) => set(state => ({ undoStack: [...state.undoStack, action] })),

    popUndo: (messageId) => {
        const { undoStack } = get();
        const index = undoStack.findIndex(a => a.messageId === messageId);
        if (index !== -1) {
            const action = undoStack[index];
            const newStack = [...undoStack];
            newStack.splice(index, 1);
            set({ undoStack: newStack });
            return action;
        }
        return undefined;
    },

    showUndoToast: (message, onUndo) => {
        set({
            currentUndoToast: {
                message,
                onUndo,
                expiresAt: Date.now() + 5000
            }
        });
        setTimeout(() => {
            set(state => {
                if (state.currentUndoToast && state.currentUndoToast.message === message) {
                    return { currentUndoToast: null };
                }
                return {};
            });
        }, 5000);
    },

    setUndoData: (data) => set({ undoData: data }),
    dismissUndo: () => set({ currentUndoToast: null, undoData: null }),

    executeUndo: async (accessToken) => {
        const { currentUndoToast } = get();
        if (currentUndoToast) currentUndoToast.onUndo();
    },

    undoDelete: async (messageId, accessToken) => {
        const action = get().popUndo(messageId);
        const { undoData, conversationId } = get();

        if (!action && (!undoData || undoData.messageId !== messageId)) {
            return;
        }

        if (!conversationId) return;

        try {
            if (undoData && undoData.messageId === messageId) {
                await conversationService.restoreMessage(conversationId, undoData.undoToken, accessToken);
            } else {
                if (undoData)
                    await conversationService.restoreMessage(conversationId, undoData.undoToken, accessToken);
            }

            await get().refreshConversation(accessToken);
            set({ undoData: null, currentUndoToast: null });
            errorLogger.info('Message restored successfully');
        } catch (error) {
            errorLogger.error('Error restoring deleted message', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    undoEdit: async (messageId, accessToken) => {
        const action = get().popUndo(messageId);
        if (!action || action.type !== 'edit') return;
        const { conversationId } = get();
        if (!conversationId) return;

        try {
            await conversationService.undoEdit(conversationId, messageId, action.previousState.content, accessToken);
            await get().refreshConversation(accessToken);
            set({ currentUndoToast: null });
            errorLogger.info('Message edit undone successfully');
        } catch (error) {
            errorLogger.error('Error undoing message edit', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    undoRegenerate: async (messageId, accessToken) => {
        const action = get().popUndo(messageId);
        if (!action || action.type !== 'regenerate') return;

        const { conversationId } = get();
        if (!conversationId) return;

        try {
            await conversationService.undoRegenerate(conversationId, messageId, action.previousState, accessToken);
            await get().refreshConversation(accessToken);
            set({ currentUndoToast: null });
            errorLogger.info('Regeneration undone successfully');
        } catch (error) {
            errorLogger.error('Error undoing regeneration', error as Error, { context: 'useConversationStore' });
            throw error;
        }
    },

    restoreMessage: async (messageId, undoToken, accessToken) => {
        const { conversationId } = get();
        if (!conversationId) return;
        await conversationService.restoreMessage(conversationId, undoToken, accessToken);
        await get().refreshConversation(accessToken);
    },
});
