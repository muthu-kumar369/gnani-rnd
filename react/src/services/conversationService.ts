import apiClient from '../api/client';
import { logger } from '../utils/logger';
import { apiCircuitBreaker, llmCircuitBreaker } from '../utils/circuitBreaker';
import errorLogger from '../utils/errorLogger';
import { MessageTreeValidator } from '../utils/messageTreeValidator';
import type { ConversationMessage, ConversationSummary, LlmModel } from '../store/useConversationStore';

// Types for responses and parameters
export interface ConversationDetail {
    conversationId: string;
    title: string;
    messages: ConversationMessage[];
    hasMoreMessages: boolean;
    currentLeafId: string | null;
    modelId: string | null;
    templateId: string | null;
}

export interface SendMessageCallbacks {
    onChunk: (chunk: { content: string; conversationId?: string; type: string }) => void;
    onComplete: (fullContent: string, newConversationId?: string) => void;
    onError: (error: Error) => void;
}

class ConversationService {
    /**
     * Fetch all conversations
     */
    async getAll(accessToken: string): Promise<ConversationSummary[]> {
        logger.debug('Fetching conversations', { context: 'ConversationService' });
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.get('/conversations')
            );

            const conversationList = response.data.conversations || [];
            const mapped = conversationList.map((c: any) => ({
                id: c.conversationId || c.id || c._id,
                conversationId: c.conversationId || c.id || c._id,
                title: c.title || 'Untitled Conversation',
                updatedAt: c.updatedAt || new Date().toISOString(),
                timestamp: new Date(c.updatedAt || Date.now()),
                preview: c.lastMessage || c.preview || 'No preview available',
                isPinned: c.isPinned || false,
            }));

            mapped.sort((a: any, b: any) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });

            logger.info('Conversations fetched successfully', {
                context: 'ConversationService',
                count: mapped.length
            });

            return mapped;
        } catch (error) {
            logger.error('Failed to fetch conversations', error);
            throw error;
        }
    }

    /**
     * Search conversations
     */
    async search(query: string, accessToken: string): Promise<ConversationSummary[]> {
        try {
            // STAGE R4: Use search circuit breaker
            const response = await import('../utils/circuitBreaker').then(m => m.searchCircuitBreaker.execute(() =>
                apiClient.post('/conversations/search', { query })
            ));
            const conversationList = response.data.results || response.data || [];

            return conversationList.map((c: any) => ({
                id: c.conversationId || c.id || c._id,
                conversationId: c.conversationId || c.id || c._id,
                title: c.title || 'Untitled Conversation',
                updatedAt: c.updatedAt || new Date().toISOString(),
                timestamp: new Date(c.updatedAt || Date.now()),
                preview: c.snippet || c.lastMessage || c.preview || 'No preview available',
            }));
        } catch (error) {
            const { isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) {
                logger.warn('Search disabled (Circuit Breaker Open)');
                return [];
            }
            errorLogger.error('Error searching conversations', error as Error);
            throw error;
        }
    }

    /**
     * Create a new conversation
     */
    async create(accessToken: string, systemPrompt?: string): Promise<{ conversationId: string; title: string }> {
        logger.debug('Creating new conversation', { context: 'ConversationService' });
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.post('/conversations', { systemPrompt })
            );

            const data = response.data;
            logger.info('Conversation created successfully', {
                context: 'ConversationService',
                conversationId: data.conversationId
            });

            return {
                conversationId: data.conversationId,
                title: data.title || 'New Conversation'
            };
        } catch (error) {
            logger.error('Failed to create conversation', error);
            throw error;
        }
    }

    /**
     * Get conversation details including messages
     */
    async getById(conversationId: string, accessToken: string): Promise<ConversationDetail> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.get(`/conversations/${conversationId}`)
            );
            const data = response.data;

            const mappedMessages: ConversationMessage[] = data.messages.map((msg: any) => ({
                id: msg.id || msg._id,
                _id: msg.id || msg._id,
                type: msg.role === 'assistant' ? 'gnani' : msg.role,
                message: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                parentId: msg.parentId,
                children: msg.children,
                branchIndex: msg.branchIndex,
                tokenUsage: msg.tokenUsage,
                feedback: msg.feedback ? {
                    rating: msg.feedback.rating,
                    comment: msg.feedback.comment,
                    category: msg.feedback.category
                } : undefined
            }));

            // Validate and repair message tree
            const validation = MessageTreeValidator.validate(mappedMessages);
            let finalMessages = mappedMessages;

            if (!validation.isValid) {
                errorLogger.warn('Message tree validation failed', {
                    context: 'ConversationService',
                    errors: validation.errors,
                    repairs: validation.repairs
                });
                finalMessages = MessageTreeValidator.repair(mappedMessages);
            }

            // Determine current leaf ID
            let currentLeafId = data.currentLeafId || null;
            if (!currentLeafId || !finalMessages.find(m => m.id === currentLeafId)) {
                if (finalMessages.length > 0) {
                    const latest = finalMessages.reduce((prev, current) =>
                        (prev.timestamp > current.timestamp) ? prev : current
                    );
                    currentLeafId = latest.id;
                } else {
                    currentLeafId = null;
                }
            }

            return {
                conversationId,
                title: data.title,
                messages: finalMessages,
                hasMoreMessages: data.hasMoreMessages || false,
                currentLeafId,
                modelId: data.modelId || null,
                templateId: data.templateId || null
            };
        } catch (error) {
            errorLogger.error('Error getting conversation', error as Error, { context: 'ConversationService' });
            throw error;
        }
    }

    /**
     * Fetch previous messages (pagination)
     */
    async getPreviousMessages(conversationId: string, before: string | undefined, accessToken: string): Promise<{ messages: ConversationMessage[]; hasMore: boolean }> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.get(`/conversations/${conversationId}/messages`, {
                    params: {
                        limit: 50,
                        before
                    }
                })
            );

            const { messages: newMessages, hasMore } = response.data;

            const mappedMessages: ConversationMessage[] = newMessages.map((msg: any) => ({
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

            return { messages: mappedMessages, hasMore };
        } catch (error) {
            errorLogger.error('Error fetching previous messages', error as Error);
            throw error;
        }
    }

    /**
     * Upload a file
     */
    async uploadFile(file: File, accessToken: string): Promise<{ fileId: string; url: string; filename: string }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiCircuitBreaker.execute(() =>
                apiClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            );
            return response.data;
        } catch (error) {
            errorLogger.error('Error uploading file', error as Error, { context: 'ConversationService' });
            throw error;
        }
    }

    /**
     * Update conversation title
     */
    async updateTitle(conversationId: string, title: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.patch(`/conversations/${conversationId}/title`, { title })
            );
        } catch (error) {
            errorLogger.error('Error updating title', error as Error);
            throw error;
        }
    }

    /**
     * Delete conversation
     */
    async delete(conversationId: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.delete(`/conversations/${conversationId}`)
            );
        } catch (error) {
            errorLogger.error('Error deleting conversation', error as Error);
            throw error;
        }
    }

    /**
     * Update model
     */
    async updateModel(conversationId: string, modelId: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.patch(`/conversations/${conversationId}/model`, { modelId })
            );
        } catch (error) {
            errorLogger.error('Error updating conversation model', error as Error);
            throw error;
        }
    }

    /**
     * Update template
     */
    async updateTemplate(conversationId: string, templateId: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.patch(`/conversations/${conversationId}/template`, { templateId })
            );
        } catch (error) {
            errorLogger.error('Error updating conversation template', error as Error);
            throw error;
        }
    }

    /**
     * Toggle pin
     */
    async togglePin(conversationId: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.patch(`/conversations/${conversationId}/pin`, {}, { headers: { 'x-auth-token': accessToken } })
            );
        } catch (error) {
            errorLogger.error('Error toggling pin status', error as Error);
            throw error;
        }
    }

    /**
     * Fetch available LLM models
     */
    async getModels(accessToken: string): Promise<LlmModel[]> {
        logger.debug('Fetching LLM models', { context: 'ConversationService' });
        try {
            const response = await llmCircuitBreaker.execute(() =>
                apiClient.get('/llm/models')
            );
            return response.data.models || [];
        } catch (error) {
            const { DEFAULT_MODELS, isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) {
                return DEFAULT_MODELS;
            }
            logger.error('Failed to fetch models', error);
            throw error;
        }
    }

    /**
     * Send a message and handle streaming response
     */
    async sendMessage(
        params: { text: string; conversationId: string; attachments?: any[] },
        accessToken: string,
        callbacks: SendMessageCallbacks,
        abortSignal?: AbortSignal
    ): Promise<void> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${params.conversationId}/messages`,
                    { text: params.text, attachments: params.attachments },
                    {
                        signal: abortSignal,
                        headers: {
                            'x-auth-token': accessToken,
                            'Content-Type': 'application/json'
                        },
                        responseType: 'stream'
                    }
                )
            );

            const reader = response.data.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                let newlineIndex;
                while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.substring(0, newlineIndex).trim();
                    buffer = buffer.substring(newlineIndex + 1);

                    if (line) {
                        try {
                            const event = JSON.parse(line);
                            if (event.type === 'message_chunk') {
                                fullContent += event.content;
                                callbacks.onChunk({ content: event.content, type: event.type });
                            } else if (event.type === 'complete_response') {
                                callbacks.onComplete(event.content, event.conversationId);
                            } else if (event.type === 'error') {
                                throw new Error(event.message || 'Streaming error');
                            }
                        } catch (parseError) {
                            errorLogger.error('Error parsing stream chunk', parseError as Error, { context: 'ConversationService', chunk: line });
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.info('Message sending cancelled by user');
            } else {
                // Check if circuit breaker is open
                const { isCircuitOpenError } = await import('../utils/fallbacks');
                if (isCircuitOpenError(error)) {
                    // Queue for offline
                    const { offlineQueue } = await import('../utils/offlineQueue');
                    offlineQueue.add(
                        `/conversations/${params.conversationId}/messages`,
                        'POST',
                        { text: params.text, attachments: params.attachments }
                    );

                    // Respond gracefully
                    const offlineMsg = "🔴 **Service Offline**: Your message has been queued.";
                    callbacks.onChunk({ content: offlineMsg, type: 'message_chunk' });
                    callbacks.onComplete(offlineMsg);
                    return;
                }

                callbacks.onError(error as Error);
                throw error;
            }
        }
    }

    /**
     * Cancel streaming response
     */
    async cancelStream(conversationId: string, messageId: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${conversationId}/cancel-stream`,
                    { messageId },
                    {
                        headers: {
                            'x-auth-token': accessToken,
                            'Content-Type': 'application/json'
                        }
                    }
                )
            );
        } catch (error) {
            errorLogger.warn('Failed to notify backend of cancellation', { error });
        }
    }

    /**
     * Regenerate response
     */
    async regenerate(conversationId: string, messageId: string, accessToken: string, signal?: AbortSignal): Promise<ConversationMessage> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${conversationId}/regenerate`,
                    { messageId },
                    { signal, headers: { 'x-auth-token': accessToken } }
                )
            );
            return response.data;
        } catch (error) {
            errorLogger.error('Error regenerating response', error as Error);
            throw error;
        }
    }

    /**
     * Edit message
     */
    async editMessage(conversationId: string, messageId: string, content: string, accessToken: string, signal?: AbortSignal): Promise<{ newResponse?: ConversationMessage }> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${conversationId}/edit`,
                    { messageId, content, autoRegenerate: true },
                    { signal, headers: { 'x-auth-token': accessToken } }
                )
            );
            return response.data;
        } catch (error) {
            errorLogger.error('Error editing message', error as Error);
            throw error;
        }
    }

    /**
     * Delete message
     */
    async deleteMessage(conversationId: string, messageId: string, accessToken: string): Promise<{ undoToken?: string }> {
        try {
            const response = await apiCircuitBreaker.execute(() =>
                apiClient.delete(
                    `/conversations/${conversationId}/messages/${messageId}`,
                    { headers: { 'x-auth-token': accessToken } }
                )
            );
            return response.data;
        } catch (error) {
            errorLogger.error('Error deleting message', error as Error);
            throw error;
        }
    }

    /**
     * Restore deleted message
     */
    async restoreMessage(conversationId: string, message: any, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${conversationId}/messages/restore`,
                    { message },
                    { headers: { 'x-auth-token': accessToken } }
                )
            );
        } catch (error) {
            errorLogger.error('Error restoring message', error as Error);
            throw error;
        }
    }

    /**
     * Undo edit
     */
    async undoEdit(conversationId: string, messageId: string, oldContent: string, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.patch(
                    `/conversations/${conversationId}/messages/${messageId}`,
                    { content: oldContent },
                    { headers: { 'x-auth-token': accessToken } }
                )
            );
        } catch (error) {
            errorLogger.error('Error undoing edit', error as Error);
            throw error;
        }
    }

    /**
     * Undo regenerate
     */
    async undoRegenerate(conversationId: string, messageId: string, previousMessage: any, accessToken: string): Promise<void> {
        try {
            await apiCircuitBreaker.execute(() =>
                apiClient.post(
                    `/conversations/${conversationId}/messages/restore-generation`,
                    { messageId, previousMessage },
                    { headers: { 'x-auth-token': accessToken } }
                )
            );
        } catch (error) {
            errorLogger.error('Error undoing regeneration', error as Error);
            throw error;
        }
    }
}

export const conversationService = new ConversationService();
