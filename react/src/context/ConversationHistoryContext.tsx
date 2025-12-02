import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Conversation {
    id: string;
    sessionId: string;
    title: string;
    preview: string;
    updatedAt: string;
    lastMessageAt: string;
}

interface ConversationHistoryState {
    conversations: Conversation[];
    currentConversationId: string | null;
    isLoading: boolean;
    searchQuery: string;
    hasMore: boolean;
    page: number;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setCurrentConversationId: (id: string | null) => void;
    setIsLoading: (loading: boolean) => void;
    setSearchQuery: (query: string) => void;
    setHasMore: (hasMore: boolean) => void;
    setPage: (page: number) => void;
    addConversation: (conversation: Conversation) => void;
}

const ConversationHistoryContext = createContext<ConversationHistoryState | undefined>(undefined);

export const ConversationHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const addConversation = (conversation: Conversation) => {
        setConversations(prev => [conversation, ...prev]);
    };

    return (
        <ConversationHistoryContext.Provider value={{
            conversations,
            currentConversationId,
            isLoading,
            searchQuery,
            hasMore,
            page,
            setConversations,
            setCurrentConversationId,
            setIsLoading,
            setSearchQuery,
            setHasMore,
            setPage,
            addConversation
        }}>
            {children}
        </ConversationHistoryContext.Provider>
    );
};

export const useConversationHistoryContext = () => {
    const context = useContext(ConversationHistoryContext);
    if (!context) {
        throw new Error('useConversationHistoryContext must be used within a ConversationHistoryProvider');
    }
    return context;
};
