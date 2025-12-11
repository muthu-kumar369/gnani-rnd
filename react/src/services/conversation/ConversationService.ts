import apiClient from '../../api/client';
import errorLogger from '../../utils/errorLogger';
import type { ConversationMessage, ConversationSummary } from '../../store/useConversationStore';

/**
 * ConversationService - Handles all conversation-related API calls
 * Extracted from useConversationStore for better testability
 */
export class ConversationService {
    /**
     * Fetch all conversations for the user
     */
    async fetchConversations(accessToken: string, page: number = 1, limit: number = 20) {
        const response = await apiClient.get('/conversations', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { page, limit }
        });
        return response.data;
    }

    /**
     * Create a new conversation
     */
    async createConversation(accessToken: string, systemPrompt?: string) {
        const response = await apiClient.post('/conversations',
            { systemPrompt },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
    }

    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId: string, accessToken: string) {
        await apiClient.delete(`/conversations/${conversationId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    }

    /**
     * Update conversation title
     */
    async updateTitle(conversationId: string, title: string, accessToken: string) {
        const response = await apiClient.patch(
            `/conversations/${conversationId}`,
            { title },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
    }

    /**
     * Update conversation template
     */
    async updateTemplate(conversationId: string, templateId: string, accessToken: string) {
        const response = await apiClient.patch(
            `/conversations/${conversationId}`,
            { templateId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
    }

    /**
     * Update conversation model
     */
    async updateModel(conversationId: string, modelId: string, accessToken: string) {
        const response = await apiClient.patch(
            `/conversations/${conversationId}`,
            { modelId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
    }

    /**
     * Refresh conversation data
     */
    async refreshConversation(conversationId: string, accessToken: string) {
        const response = await apiClient.get(`/conversations/${conversationId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(
        conversationId: string,
        text: string,
        accessToken: string,
        attachments?: any[]
    ) {
        const response = await apiClient.post(
            `/conversations/${conversationId}/messages`,
            { text, attachments },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
    }

    /**
     * Cancel streaming response
     */
    async cancelStream(sessionId: string, accessToken: string) {
        await apiClient.post(
            '/stream/cancel',
            { sessionId },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
    }
}

export const conversationService = new ConversationService();
