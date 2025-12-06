import { useState } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

export const useMessageActions = (conversationId: string | null) => {
    const { accessToken } = useUserStore();
    const {
        regenerateResponse,
        editMessage: storeEditMessage,
        deleteMessage: storeDeleteMessage,
        restoreMessage: storeRestoreMessage,
        refreshConversation,
        undoData,
        dismissUndo
    } = useConversationStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const regenerateMessage = async (messageId: string) => {
        if (!conversationId || !accessToken) return;
        setIsLoading(true);
        try {
            await regenerateResponse(messageId, accessToken);
        } catch (error) {
            console.error('Failed to regenerate message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const editMessage = async (messageId: string, newContent: string, autoRegenerate = true) => {
        if (!conversationId || !accessToken) return;
        setIsLoading(true);
        try {
            await storeEditMessage(messageId, newContent, accessToken, autoRegenerate);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to edit message:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!conversationId || !accessToken) return;
        setIsLoading(true);
        try {
            await storeDeleteMessage(messageId, accessToken);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Failed to delete message:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const restoreMessage = async () => {
        if (!undoData || !accessToken) return;
        setIsLoading(true);
        try {
            await storeRestoreMessage(undoData.messageId, undoData.undoToken, accessToken);
        } catch (error) {
            console.error('Failed to restore message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        // Optional: Show toast notification
    };

    return {
        // Actions
        regenerateMessage,
        editMessage,
        deleteMessage,
        restoreMessage,
        copyMessage,

        // UI State
        isLoading,
        isEditing,
        setIsEditing,
        showDeleteConfirm,
        setShowDeleteConfirm,

        // Undo state
        undoData,
        dismissUndo
    };
};
