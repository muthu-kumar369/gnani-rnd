import { create } from 'zustand';
import { conversationService } from '../services/conversationService';
import { useUserStore } from './useUserStore';

export interface Conversation {
    conversationId: string;
    title: string;
    timestamp: Date;
    updatedAt: Date;
    messageCount: number;
    preview: string;
    isPinned?: boolean;
    model?: string;
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
    togglePinConversation: (conversationId: string) => Promise<void>;
}

export const useConversationHistoryStore = create<ConversationHistoryStore>((set, get) => ({
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
    togglePinConversation: async (conversationId) => {
        const { conversations } = get();
        // Optimistic update
        const updatedConversations = conversations.map(conv =>
            conv.conversationId === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
        );

        // Re-sort: Pinned first, then by current sort criteria (default date)
        const sorted = [...updatedConversations].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Fallback to date sort (assuming desc for now, or use store state if available)
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        set({ conversations: sorted });

        try {
            const accessToken = useUserStore.getState().accessToken;
            if (accessToken) {
                await conversationService.togglePin(conversationId, accessToken);
            }
        } catch (error) {
            console.error('Failed to toggle pin:', error);
            // Revert
            set({ conversations });
        }
    },
}));
