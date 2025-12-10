// react/src/hooks/useMessageCache.ts
import { useCallback } from 'react';
import { messageCache } from '../utils/messageCache';
import type { ConversationMessage } from '../types/conversation';

export const useMessageCache = () => {
    /**
     * Get messages from cache or fetch from backend
     */
    const getCachedMessages = useCallback(
        async (
            conversationId: string,
            fetchFn: () => Promise<ConversationMessage[]>
        ): Promise<ConversationMessage[]> => {
            // Try cache first
            const cached = messageCache.get(conversationId);
            if (cached) {
                return cached;
            }

            // Cache miss - fetch from backend
            const messages = await fetchFn();
            messageCache.set(conversationId, messages);
            return messages;
        },
        []
    );

    /**
     * Invalidate cache for specific conversation
     */
    const invalidateConversation = useCallback((conversationId: string) => {
        messageCache.invalidate(conversationId);
    }, []);

    /**
     * Invalidate all cache
     */
    const invalidateAll = useCallback(() => {
        messageCache.invalidateAll();
    }, []);

    /**
     * Prefetch conversation on hover
     */
    const prefetchConversation = useCallback(
        async (conversationId: string, fetchFn: () => Promise<ConversationMessage[]>) => {
            await messageCache.prefetch(conversationId, fetchFn);
        },
        []
    );

    /**
     * Get cache statistics
     */
    const getCacheStats = useCallback(() => {
        return messageCache.getStats();
    }, []);

    return {
        getCachedMessages,
        invalidateConversation,
        invalidateAll,
        prefetchConversation,
        getCacheStats
    };
};
