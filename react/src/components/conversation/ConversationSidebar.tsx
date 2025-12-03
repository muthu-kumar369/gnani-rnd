import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, History } from 'lucide-react';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import ConversationListItem from './ConversationListItem';
import { useConversationStore } from '../../store/useConversationStore';

interface ConversationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewConversation: () => void;
    onSelectConversation?: (sessionId: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    isOpen,
    onClose,
    onNewConversation,
    onSelectConversation
}) => {
    const {
        conversations,
        loadMore,
        search,
        deleteConversation,
        updateTitle,
        fetchConversations,
        isLoading,
        hasMore
    } = useConversationHistory();

    const { sessionId: currentConversationId } = useConversationStore();
    const [searchQuery, setSearchQuery] = React.useState('');
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, fetchConversations]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) search(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, search, isOpen]);

    // Infinite scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
            loadMore();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar */}
                    <motion.div
                        ref={sidebarRef}
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-80 bg-black/90 border-r border-jarvis-blue/30 z-50 flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.1)]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-jarvis-blue/20">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-jarvis-cyan flex items-center">
                                    <History className="mr-2" size={20} />
                                    History
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <button
                                onClick={() => { onNewConversation(); onClose(); }}
                                className="w-full flex items-center justify-center py-2 px-4 bg-jarvis-blue/20 hover:bg-jarvis-blue/30 border border-jarvis-cyan/50 rounded text-jarvis-cyan transition-all duration-200 group"
                            >
                                <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" />
                                New Conversation
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 pb-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/50 border border-jarvis-blue/20 rounded-full py-2 pl-9 pr-4 text-sm text-gray-300 focus:outline-none focus:border-jarvis-cyan/50 focus:ring-1 focus:ring-jarvis-cyan/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar"
                            onScroll={handleScroll}
                        >
                            {conversations.length === 0 && !isLoading ? (
                                <div className="text-center text-gray-500 mt-10 text-sm">
                                    No conversations found.
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <ConversationListItem
                                        key={conv.sessionId}
                                        conversation={conv}
                                        isActive={conv.sessionId === currentConversationId}
                                        onResume={(id) => {
                                            if (onSelectConversation) {
                                                onSelectConversation(id);
                                            }
                                            onClose();
                                        }}
                                        onDelete={deleteConversation}
                                        onEditTitle={updateTitle}
                                    />
                                ))
                            )}

                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <div className="w-5 h-5 border-2 border-jarvis-cyan/30 border-t-jarvis-cyan rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConversationSidebar;
