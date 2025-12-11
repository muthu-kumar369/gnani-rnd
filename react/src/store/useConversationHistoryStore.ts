import { create } from 'zustand';

export interface Conversation {
    conversationId: string;
    title: string;
    timestamp: Date;
    updatedAt: Date;
    messageCount: number;
    preview: string;
}

interface ConversationHistoryStore {
    conversations: Conversation[];
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    searchQuery: string;
    sortBy: 'date' | 'name' | 'messageCount';
    sortOrder: 'asc' | 'desc';

    setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
    setIsLoading: (isLoading: boolean) => void;
    setHasMore: (hasMore: boolean) => void;
    setPage: (page: number) => void;
    setSearchQuery: (query: string) => void;
    setSortBy: (sortBy: 'date' | 'name' | 'messageCount') => void;
    setSortOrder: (sortOrder: 'asc' | 'desc') => void;
    updateConversationTitle: (conversationId: string, title: string) => void;
}

export const useConversationHistoryStore = create<ConversationHistoryStore>((set) => ({
    conversations: [],
    isLoading: false,
    hasMore: true,
    page: 1,
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',

    setConversations: (conversations) => set((state) => ({
        conversations: typeof conversations === 'function' ? conversations(state.conversations) : conversations
    })),
    setIsLoading: (isLoading) => set({ isLoading }),
    setHasMore: (hasMore) => set({ hasMore }),
    setPage: (page) => set({ page }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    updateConversationTitle: (conversationId, title) => set((state) => ({
        conversations: state.conversations.map(conv =>
            conv.conversationId === conversationId ? { ...conv, title } : conv
        )
    })),
}));
