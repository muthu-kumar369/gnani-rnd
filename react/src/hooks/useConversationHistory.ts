import { useCallback } from 'react';
import { useConversationHistoryStore, type Conversation } from '../store/useConversationHistoryStore';
import { useUserStore } from '../store/useUserStore';
import apiClient from '../api/client'; // STAGE 1: Use API client with retry logic

export const useConversationHistory = () => {
    const {
        conversations,
        setConversations,
        isLoading,
        setIsLoading,
        hasMore,
        setHasMore,
        page,
        setPage,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    } = useConversationHistoryStore();

    const { accessToken } = useUserStore();

    const fetchConversations = useCallback(async (pageNum = 1, query = '') => {
        if (!accessToken) return;

        setIsLoading(true);
        try {
            // STAGE 1: Use API client with retry logic
            let response;
            if (query) {
                response = await apiClient.post('/conversations/search', { query, limit: 20 });
            } else {
                response = await apiClient.get(`/conversations?page=${pageNum}&limit=20&sortBy=${sortBy}&sortOrder=${sortOrder}`);
            }

            const data = response.data;

            if (query) {
                // Search returns a list directly in data.conversations
                setConversations(data.conversations);
                setHasMore(false); // Search usually doesn't paginate the same way
            } else {
                if (pageNum === 1) {
                    setConversations(data.conversations);
                } else {
                    setConversations((prev: Conversation[]) => [...prev, ...data.conversations]);
                }
                setHasMore(data.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, setConversations, setHasMore, setPage, setIsLoading, sortBy, sortOrder]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore && !searchQuery) {
            fetchConversations(page + 1);
        }
    }, [isLoading, hasMore, searchQuery, page, fetchConversations]);

    const search = useCallback((query: string) => {
        setSearchQuery(query);
        fetchConversations(1, query);
    }, [setSearchQuery, fetchConversations]);

    const deleteConversation = useCallback(async (id: string) => {
        if (!accessToken) return;

        try {
            // STAGE 1: Use API client with retry logic
            await apiClient.delete(`/conversations/${id}`);

            setConversations((prev: Conversation[]) => prev.filter((c: Conversation) => c.conversationId !== id));
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }, [accessToken, setConversations]);

    const updateTitle = useCallback(async (id: string, title: string) => {
        if (!accessToken) return;

        try {
            // STAGE 1: Use API client with retry logic
            await apiClient.patch(`/conversations/${id}/title`, { title });

            setConversations((prev: Conversation[]) => prev.map((c: Conversation) =>
                c.conversationId === id ? { ...c, title } : c
            ));
        } catch (error) {
            console.error('Error updating title:', error);
        }
    }, [accessToken, setConversations]);

    const generateTitle = useCallback(async (conversationId: string) => {
        if (!accessToken) return;

        try {
            // STAGE 1: Use API client with retry logic
            const response = await apiClient.post(`/conversations/${conversationId}/title/generate`);

            // Update local conversation list with new title
            setConversations((prev: Conversation[]) => prev.map((c: Conversation) =>
                c.conversationId === conversationId ? { ...c, title: response.data.title } : c
            ));

            return response.data.title;
        } catch (error) {
            console.error('Error generating title:', error);
        }
    }, [accessToken, setConversations]);

    return {
        conversations,
        isLoading,
        hasMore,
        loadMore,
        search,
        deleteConversation,
        updateTitle,
        fetchConversations,
        generateTitle, // Export new method
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    };
};
