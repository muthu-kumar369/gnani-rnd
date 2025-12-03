import { create } from 'zustand';

export interface Conversation {
    sessionId: string;
    title: string;
    timestamp: Date;
    updatedAt: Date;
    preview: string;
}

interface ConversationHistoryStore {
    conversations: Conversation[];
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    searchQuery: string;

    setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
    setIsLoading: (isLoading: boolean) => void;
    setHasMore: (hasMore: boolean) => void;
    setPage: (page: number) => void;
    setSearchQuery: (query: string) => void;
}

export const useConversationHistoryStore = create<ConversationHistoryStore>((set) => ({
    conversations: [],
    isLoading: false,
    hasMore: true,
    page: 1,
    searchQuery: '',

    setConversations: (conversations) => set((state) => ({
        conversations: typeof conversations === 'function' ? conversations(state.conversations) : conversations
    })),
    setIsLoading: (isLoading) => set({ isLoading }),
    setHasMore: (hasMore) => set({ hasMore }),
    setPage: (page) => set({ page }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
