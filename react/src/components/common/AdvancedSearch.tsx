import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, SquarePen, MessageSquare, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import { useConversationHistoryStore, type Conversation } from '../../store/useConversationHistoryStore'; // Import conversation store
import { SearchHighlight } from './SearchHighlight';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';

interface AdvancedSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper for date grouping
const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: Record<string, Conversation[]> = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    conversations.forEach(conv => {
        const date = new Date(conv.updatedAt || conv.timestamp); // Use updatedAt if available
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            groups['Today'].push(conv);
        } else if (date.getTime() === yesterday.getTime()) {
            groups['Yesterday'].push(conv);
        } else if (date > lastWeek) {
            groups['Previous 7 Days'].push(conv);
        } else {
            groups['Older'].push(conv);
        }
    });

    return groups;
};

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ isOpen, onClose }) => {
    const {
        query,
        results,
        isSearching,
        setQuery,
        search,
        addToHistory,
        clearResults,
    } = useSearchStore();

    // Use Conversation History for initial view
    const { conversations: recentConversations } = useConversationHistoryStore();
    const { createConversation, loadConversation } = useConversationStore(); // Added loadConversation
    const { accessToken } = useUserStore();

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isDebouncing, setIsDebouncing] = useState(false);

    // Initial View Groups
    const groupedConversations = React.useMemo(() => {
        if (query) return {}; // Don't group if searching
        return groupConversationsByDate(recentConversations);
    }, [recentConversations, query]);

    // Handlers
    const handleSelectConversation = async (conversationId: string) => {
        if (accessToken) {
            await loadConversation(conversationId, accessToken);
            onClose();
        }
    };

    const handleSearch = () => {
        if (!query.trim()) return;
        addToHistory(query);
        setIsDebouncing(false); // Immediate search cancels debounce
        search();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsDebouncing(true);
    };

    const handleNewChat = async () => {
        if (accessToken) {
            await createConversation(accessToken);
            onClose();
        }
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsDebouncing(false);
            if (query.trim()) {
                search();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    // Focus & Cleanup
    useEffect(() => {
        if (!isOpen) {
            clearResults();
            setQuery('');
            setIsDebouncing(false);
        } else {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen, clearResults, setQuery]);

    if (!isOpen) return null;
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[100] grid place-items-center bg-bg-overlay backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    // Theme: Semantic Colors
                    className="w-full max-w-2xl bg-canvas-panel border border-glass-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    style={{ height: '600px', maxHeight: '90vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Input ONLY (No Search Icon, No Border) + Close */}
                    <div className="flex items-center px-4 py-4 gap-3 bg-canvas-surface/30">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search messages..."
                            // STRICT: No border, no outline, transparent bg, remove shadow, remove ring
                            className="flex-1 bg-transparent text-type-primary placeholder-type-muted appearance-none outline-none border-none focus:outline-none focus:ring-0 focus:border-none shadow-none focus:shadow-none text-base font-normal p-0"
                            style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                            autoFocus
                        />
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-glass-shimmer rounded text-type-muted hover:text-type-primary transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Divider - Subtle */}
                    <div className="h-px bg-line-base w-full" />

                    {/* Content Area */}
                    <div className={`p-2 flex-1 flex flex-col relative pb-20 ${(isSearching || isDebouncing)
                        ? 'overflow-hidden'
                        : 'overflow-y-auto custom-scrollbar'
                        }`}>

                        {/* 1. Loading State (Skeleton) - Increased Count & Better Fill */}
                        {(isSearching || isDebouncing) && (
                            <div className="space-y-4 p-2 w-full">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex flex-col gap-2 animate-pulse">
                                        <div className="h-4 bg-glass-shimmer rounded w-3/4"></div>
                                        <div className="h-3 bg-glass-shimmer rounded w-full"></div>
                                        <div className="h-3 bg-glass-shimmer rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. Initial View (New Chat + Recent History) */}
                        {!query && !isSearching && !isDebouncing && (
                            <div className="space-y-4">
                                {/* Static New Chat Row */}
                                <button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-glass-shimmer group transition-colors text-left"
                                >
                                    <div className="p-2 bg-canvas-surface rounded-lg text-type-primary group-hover:bg-glass-shimmer transition-colors">
                                        <SquarePen size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-type-primary">New chat</span>
                                </button>

                                {/* Date Grouped Conversations */}
                                {(['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const).map(group => {
                                    const groupItems = groupedConversations[group];
                                    if (!groupItems || groupItems.length === 0) return null;

                                    return (
                                        <div key={group} className="space-y-1">
                                            <div className="px-3 py-1 text-[10px] font-bold text-type-secondary uppercase tracking-wider">
                                                {group}
                                            </div>
                                            {groupItems.map(conv => (
                                                <button
                                                    key={conv.conversationId}
                                                    onClick={() => handleSelectConversation(conv.conversationId)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-glass-shimmer group transition-colors text-left"
                                                >
                                                    <MessageSquare size={16} className="text-type-muted group-hover:text-type-secondary transition-colors shrink-0" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-sm text-type-secondary truncate group-hover:text-type-primary transition-colors">
                                                            {conv.title || 'New Conversation'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 3. Search Results */}
                        {query && !isSearching && !isDebouncing && results.length > 0 && (
                            <div className="space-y-0.5">
                                {results.map((result) => (
                                    <div
                                        key={result.conversationId}
                                        onClick={() => handleSelectConversation(result.conversationId)}
                                        className="group flex flex-col gap-1 px-3 py-3 rounded-lg hover:bg-glass-shimmer cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <MessageSquare size={14} className="text-type-muted shrink-0" />
                                                <span className="text-sm font-medium text-type-secondary group-hover:text-gnani-primary transition-colors truncate">
                                                    <SearchHighlight text={result.title} searchTerm={query} />
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-type-muted shrink-0">
                                                {new Date(result.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-type-muted line-clamp-1 pl-6">
                                            <SearchHighlight text={result.snippet} searchTerm={query} />
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 4. Rich Empty State - Centered */}
                        {query && !isSearching && !isDebouncing && results.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center select-none h-full">
                                <div className="p-4 rounded-full bg-canvas-surface mb-4 shadow-sm">
                                    <SearchIcon size={32} className="text-type-muted" />
                                </div>
                                <h3 className="text-base font-medium text-type-primary mb-1">No results found</h3>
                                <p className="text-sm text-type-secondary max-w-[200px]">
                                    We couldn't find any messages that match "{query}"
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default AdvancedSearch;
