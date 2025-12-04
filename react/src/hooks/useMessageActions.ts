import { useState } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

const API_BASE_URL = 'http://localhost:3000/api';

export const useMessageActions = (conversationId: string | null) => {
    const { accessToken } = useUserStore();
    const { regenerateResponse, editMessage: storeEditMessage, refreshConversation } = useConversationStore();
    const [isLoading, setIsLoading] = useState(false);

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

    const editMessage = async (messageId: string, newContent: string) => {
        if (!conversationId || !accessToken) return;
        setIsLoading(true);
        try {
            await storeEditMessage(messageId, newContent, accessToken);
        } catch (error) {
            console.error('Failed to edit message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!conversationId || !accessToken) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': accessToken
                }
            });

            if (!response.ok) throw new Error('Failed to delete message');

            // Refresh conversation to get updated tree
            await refreshConversation(accessToken);
        } catch (error) {
            console.error('Failed to delete message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        regenerateMessage,
        editMessage,
        deleteMessage,
        isLoading
    };
};
