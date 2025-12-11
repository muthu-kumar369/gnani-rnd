import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, History, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import ConversationListItem from './ConversationListItem';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useFolderStore } from '../../store/useFolderStore';
import Button from '../ui/Button';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ConversationSkeleton } from '../common/SkeletonLoader';
import FolderList from '../common/FolderList';

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
        conversations, // Using hook's conversations (paginated + search results)
        isLoading,
        hasMore,
        loadMore,
        search, // Hook's search method
        deleteConversation,
        updateTitle,
        fetchConversations,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    } = useConversationHistory();

    const { conversationId: currentConversationId, createConversation } = useConversationStore();
    const { accessToken } = useUserStore();
    const { folders, moveConversation, getFolderByConversation } = useFolderStore();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, fetchConversations]);

    // Handle folder drop event
    useEffect(() => {
        const handleFolderDrop = (event: Event) => {
            const customEvent = event as CustomEvent<{ folderId: string; conversationId: string }>;
            const { folderId, conversationId } = customEvent.detail;
            const currentFolder = getFolderByConversation(conversationId);
            moveConversation(conversationId, currentFolder?.id || null, folderId);
        };

        window.addEventListener('folder:drop', handleFolderDrop);
        return () => window.removeEventListener('folder:drop', handleFolderDrop);
    }, [moveConversation, getFolderByConversation]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) return;
            // Use hook's search method
            search(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, search]);

    // Infinite scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
            loadMore();
        }
    };

    const handleNewConversation = async () => {
        if (accessToken) {
            try {
                // Create conversation without template - user can select template in the input area
                await createConversation(accessToken);
                onNewConversation();
                onClose();
            } catch (error) {
                console.error('Failed to create conversation:', error);
            }
        }
    };

    // Toggle folder expand/collapse
    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Group conversations by folder
    const conversationsByFolder = React.useMemo(() => {
        const grouped: Record<string, typeof conversations> = {
            unorganized: []
        };

        conversations.forEach(conv => {
            const folder = getFolderByConversation(conv.conversationId);
            const folderId = folder?.id || 'unorganized';
            if (!grouped[folderId]) {
                grouped[folderId] = [];
            }
            grouped[folderId].push(conv);
        });

        return grouped;
    }, [conversations, getFolderByConversation]);

    // Filter conversations if folder is selected
    const filteredConversations = selectedFolderId
        ? conversationsByFolder[selectedFolderId] || []
        : conversations;

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

                            <Button
                                onClick={handleNewConversation}
                                variant="primary"
                                className="w-full justify-center"
                                leftIcon={<Plus size={16} className="group-hover:rotate-90 transition-transform" />}
                            >
                                New Conversation
                            </Button>

                            <Button
                                onClick={() => fetchConversations()}
                                variant="secondary"
                                className="w-full justify-center mt-2"
                                leftIcon={<RefreshCw size={16} />}
                            >
                                Refresh
                            </Button>
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

                        {/* Folders */}
                        <div className="px-4 pb-2">
                            <FolderList
                                selectedFolderId={selectedFolderId}
                                onSelectFolder={setSelectedFolderId}
                            />
                        </div>

                        {/* Sort Controls */}
                        <div className="px-4 pb-2 flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value as 'date' | 'name' | 'messageCount');
                                    fetchConversations();
                                }}
                                className="flex-1 bg-black/50 border border-jarvis-blue/20 rounded py-1.5 px-2 text-xs text-gray-300 focus:outline-none focus:border-jarvis-cyan/50"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="name">Sort by Name</option>
                                <option value="messageCount">Sort by Messages</option>
                            </select>
                            <button
                                onClick={() => {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    fetchConversations();
                                }}
                                className="p-1.5 bg-black/50 border border-jarvis-blue/20 rounded hover:bg-jarvis-blue/10 transition-colors"
                                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                <ArrowUpDown size={14} className={`text-gray-400 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                            </button>
                        </div>

                        {/* List */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar"
                            onScroll={handleScroll}
                        >
                            {isLoading && conversations.length === 0 ? (
                                <ConversationSkeleton className="mt-4" />
                            ) : (
                                <>
                                    {/* Folders with nested conversations */}
                                    {folders.map(folder => {
                                        const folderConvs = conversationsByFolder[folder.id] || [];
                                        const isExpanded = expandedFolders.has(folder.id);

                                        if (folderConvs.length === 0) return null;

                                        return (
                                            <div key={folder.id} className="mb-2">
                                                {/* Folder Header */}
                                                <div className="flex items-center gap-1 mb-1">
                                                    <button
                                                        onClick={() => toggleFolder(folder.id)}
                                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown size={14} className="text-gray-400" />
                                                        ) : (
                                                            <ChevronRight size={14} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedFolderId(folder.id)}
                                                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedFolderId === folder.id
                                                            ? 'bg-jarvis-blue/20 text-jarvis-cyan'
                                                            : 'hover:bg-white/5 text-gray-300'
                                                            }`}
                                                    >
                                                        <Folder size={14} />
                                                        <span className="flex-1 text-left truncate">{folder.name}</span>
                                                        <span className="text-xs text-gray-500">({folderConvs.length})</span>
                                                    </button>
                                                </div>

                                                {/* Nested Conversations */}
                                                {isExpanded && (
                                                    <div className="ml-6 space-y-1">
                                                        {folderConvs.map(conv => (
                                                            <ConversationListItem
                                                                key={conv.conversationId}
                                                                conversation={conv as any} // Cast as any because ConversationSummary might miss some fields from ConversationListItem's expected type, but essential fields are there
                                                                isActive={conv.conversationId === currentConversationId}
                                                                onResume={(id) => {
                                                                    if (onSelectConversation) {
                                                                        onSelectConversation(id);
                                                                    }
                                                                    onClose();
                                                                }}
                                                                onDelete={(id) => setDeleteId(id)}
                                                                onEditTitle={(id: string, title: string) => updateTitle(id, title)}
                                                                searchQuery={searchQuery} // Pass query for highlighting
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Unorganized Conversations */}
                                    {conversationsByFolder.unorganized && conversationsByFolder.unorganized.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-xs text-gray-500 px-2 mb-2 uppercase tracking-wider">
                                                Unorganized ({conversationsByFolder.unorganized.length})
                                            </div>
                                            <div className="space-y-1">
                                                {conversationsByFolder.unorganized.map(conv => (
                                                    <ConversationListItem
                                                        key={conv.conversationId}
                                                        conversation={conv as any}
                                                        isActive={conv.conversationId === currentConversationId}
                                                        onResume={(id) => {
                                                            if (onSelectConversation) {
                                                                onSelectConversation(id);
                                                            }
                                                            onClose();
                                                        }}
                                                        onDelete={(id) => setDeleteId(id)}
                                                        onEditTitle={(id: string, title: string) => updateTitle(id, title)}
                                                        searchQuery={searchQuery}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No conversations message */}
                                    {conversations.length === 0 && !isLoading && (
                                        <div className="text-center text-gray-500 mt-10 text-sm">
                                            No conversations found.
                                        </div>
                                    )}

                                    {/* Loading more indicator */}
                                    {isLoading && conversations.length > 0 && (
                                        <div className="text-center py-4">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-jarvis-cyan"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Delete Confirmation Modal */}
                        <ConfirmationModal
                            isOpen={deleteId !== null}
                            onClose={() => setDeleteId(null)}
                            onConfirm={async () => {
                                if (deleteId) {
                                    await deleteConversation(deleteId);
                                    setDeleteId(null);
                                }
                            }}
                            title="Delete Conversation"
                            message="Are you sure you want to delete this conversation? This action cannot be undone."
                            confirmLabel="Delete"
                            cancelLabel="Cancel"
                            isDangerous={true}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConversationSidebar;
