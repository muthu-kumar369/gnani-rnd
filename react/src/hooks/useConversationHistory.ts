import { useCallback } from 'react';
import { useConversationHistoryStore, type Conversation } from '../store/useConversationHistoryStore';
import { useUserStore } from '../store/useUserStore';

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Adjust as needed

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
        setSearchQuery
    } = useConversationHistoryStore();

    const { accessToken } = useUserStore();

    const fetchConversations = useCallback(async (pageNum = 1, query = '') => {
        if (!accessToken) return;

        setIsLoading(true);
        try {
            let url = `${API_BASE_URL}/conversations?page=${pageNum}&limit=20`;
            let method = 'GET';
            let body = undefined;

            if (query) {
                url = `${API_BASE_URL}/conversations/search`;
                method = 'POST';
                body = JSON.stringify({ query, limit: 20 });
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                },
                body
            });

            if (!response.ok) throw new Error('Failed to fetch conversations');

            const data = await response.json();

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
    }, [accessToken, setConversations, setHasMore, setPage, setIsLoading]);

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
            const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': accessToken
                }
            });

            if (!response.ok) throw new Error('Failed to delete conversation');

            setConversations((prev: Conversation[]) => prev.filter((c: Conversation) => c.conversationId !== id));
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }, [accessToken, setConversations]);

    const updateTitle = useCallback(async (id: string, title: string) => {
        if (!accessToken) return;

        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${id}/title`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                },
                body: JSON.stringify({ title })
            });

            if (!response.ok) throw new Error('Failed to update title');

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
            const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/title/generate`, {
                method: 'POST',
                headers: {
                    'x-auth-token': accessToken
                }
            });

            if (!response.ok) throw new Error('Failed to generate title');

            const data = await response.json();

            // Update local conversation list with new title
            setConversations((prev: Conversation[]) => prev.map((c: Conversation) =>
                c.conversationId === conversationId ? { ...c, title: data.title } : c
            ));

            return data.title;
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
        generateTitle // Export new method
    };
};
