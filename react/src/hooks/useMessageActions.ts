import { useState, useCallback } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

const API_BASE_URL = 'http://localhost:3000/api';

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
            await storeEditMessage(messageId, newContent, accessToken);
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

    // NEW: Get message generations for variant navigation
    const getMessageGenerations = useCallback(async (messageId: string) => {
        if (!conversationId || !accessToken) return [];

        try {
            const response = await fetch(
                `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}/generations`,
                {
                    headers: { 'x-auth-token': accessToken }
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.generations || [];
        } catch (error) {
            console.error('Failed to fetch generations:', error);
            return [];
        }
    }, [conversationId, accessToken]);

    return {
        // Actions
        regenerateMessage,
        editMessage,
        deleteMessage,
        restoreMessage,
        copyMessage,
        getMessageGenerations, // NEW

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

