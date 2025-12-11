import type { ConversationMessage } from '../../store/useConversationStore';
import apiClient from '../../api/client';

/**
 * MessageService - Handles message-related operations
 * Extracted from useConversationStore for better testability
 */
export class MessageService {
    /**
     * Regenerate a message response
     */
    async regenerateResponse(messageId: string, accessToken: string) {
        const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post(
                `/messages/${messageId}/regenerate`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        ));
        return response.data;
    }

    /**
     * Edit a message
     */
    async editMessage(messageId: string, newContent: string, accessToken: string) {
        const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.patch(
                `/messages/${messageId}`,
                { content: newContent },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        ));
        return response.data;
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string, accessToken: string) {
        const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.delete(`/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        ));
        return response.data;
    }

    /**
     * Restore a deleted message
     */
    async restoreMessage(messageId: string, undoToken: string, accessToken: string) {
        const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post(
                `/messages/${messageId}/restore`,
                { undoToken },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        ));
        return response.data;
    }

    /**
     * Upload a file attachment
     */
    async uploadFile(file: File, accessToken: string): Promise<{ fileId: string; url: string; filename: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post('/upload', formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
        ));

        return response.data;
    }
}

export const messageService = new MessageService();
