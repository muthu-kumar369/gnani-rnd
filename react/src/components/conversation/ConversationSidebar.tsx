import React, { useEffect, useRef, useState } from 'react';
import { eventManager } from '../../utils/eventManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, History, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight, Folder, Trash2 } from 'lucide-react';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import ConversationListItem from './ConversationListItem';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useFolderStore } from '../../store/useFolderStore';
import Button from '../ui/Button';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ConversationSkeleton } from '../common/SkeletonLoader';
import FolderList from '../common/FolderList';
import { useConversationHistoryStore, type Conversation } from '../../store/useConversationHistoryStore';

interface ConversationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewConversation: () => void;
    onSelectConversation?: (sessionId: string) => void;
    variant?: 'overlay' | 'static';
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    isOpen,
    onClose,
    onNewConversation,
    onSelectConversation,
    variant = 'overlay'
}) => {
    // ... hooks ...
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

    // NEW: Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { togglePinConversation } = useConversationHistoryStore();

    // Group conversations by folder
    const conversationsByFolder = React.useMemo(() => {
        const grouped: Record<string, Conversation[]> = {
            unorganized: []
        };

        // First apply pinning sort within the source list if possible, or just pin logic here?
        // Let's sort filtered lists later.
        conversations.forEach(conv => {
            const folder = getFolderByConversation(conv.conversationId);
            const folderId = folder?.id || 'unorganized';
            if (!grouped[folderId]) {
                grouped[folderId] = [];
            }
            grouped[folderId].push(conv);
        });

        // Sort each group: Pinned first, then by current sort criteria (which is already applied by store mostly, but let's enforce pinned)
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0; // Keep existing order (which should be dominated by store's sort)
            });
        });

        return grouped;
    }, [conversations, getFolderByConversation]);

    // Filter conversations if folder is selected
    const filteredConversations = React.useMemo(() => {
        const source = selectedFolderId
            ? conversationsByFolder[selectedFolderId] || []
            : conversations;

        // Also apply pin sort to the flat list
        return [...source].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }, [selectedFolderId, conversationsByFolder, conversations]);

    // ... hooks useEffects ... (Keep existing hooks)
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

        const cleanup = eventManager.addEventListener('folder:drop', handleFolderDrop as EventListener, undefined, 'ConversationSidebar');
        return cleanup;
    }, [moveConversation, getFolderByConversation]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) return;
            search(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, search]);

    const isOverlay = variant === 'overlay';

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
                await createConversation(accessToken);
                onNewConversation();
                if (isOverlay) onClose();
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

    // Bulk selection handlers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} conversations?`)) return;

        for (const id of selectedIds) {
            await deleteConversation(id);
        }
        setSelectedIds(new Set());
        setSelectionMode(false);
    };

    const handleBulkMove = (targetFolderId: string | null) => {
        // Need to iterate and move.
        // Since moveConversation is store based, it might be fast enough.
        selectedIds.forEach(id => {
            const current = getFolderByConversation(id);
            moveConversation(id, current?.id || null, targetFolderId);
        });
        setSelectedIds(new Set());
        setSelectionMode(false);
    };


    const SidebarContent = (
        <div
            className={`${isOverlay ? 'fixed top-0 left-0 h-full w-80 z-50 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'w-80 h-full border-r border-jarvis-blue/30'} bg-black/90 flex flex-col`}
        >
            {/* Header */}
            <div className="p-4 border-b border-jarvis-blue/20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-jarvis-cyan flex items-center">
                        <History className="mr-2" size={20} />
                        History
                    </h2>
                    <div className="flex gap-2">
                        {/* Bulk Action Trigger */}
                        <button
                            onClick={() => setSelectionMode(!selectionMode)}
                            className={`p-1 rounded transition-colors ${selectionMode ? 'text-jarvis-cyan bg-jarvis-cyan/10' : 'text-gray-400 hover:text-white'}`}
                            title="Select Multiple"
                        >
                            <Folder size={18} /> {/* Proxy icon for selection */}
                        </button>
                        {isOverlay && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={onNewConversation}
                                    className="p-2 bg-jarvis-cyan/10 text-jarvis-cyan hover:bg-jarvis-cyan/20 rounded-lg transition-colors border border-jarvis-cyan/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
                                    aria-label="New conversation"
                                >
                                    <Plus size={20} />
                                </button>
                            </>
                        )}
                    </div>
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

            {/* Bulk Action Bar during Selection Mode */}
            {selectionMode && (
                <div className="p-2 border-b border-jarvis-blue/20 bg-jarvis-blue/10 flex items-center justify-between animate-slide-down">
                    <span className="text-xs text-jarvis-cyan font-mono">{selectedIds.size} Selected</span>
                    <div className="flex gap-1">
                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedIds.size === 0}
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            title="Delete Selected"
                        >
                            <Trash2 size={14} />
                        </button>
                        {/* We could add move logic here, simpler just delete for now unless folder menu added */}
                        <button
                            onClick={() => setSelectionMode(false)}
                            className="p-1.5 rounded hover:bg-white/10 text-gray-400"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

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
                        {selectedFolderId ? (
                            /* Selected Folder View */
                            <div className="space-y-1 mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 px-2 mb-2 uppercase tracking-wider">
                                    <span>{folders.find(f => f.id === selectedFolderId)?.name || 'Folder'} ({filteredConversations.length})</span>
                                    <button onClick={() => setSelectedFolderId(null)} className="hover:text-white" title="Clear selection">
                                        <X size={12} />
                                    </button>
                                </div>
                                {filteredConversations.map(conv => (
                                    <ConversationListItem
                                        key={conv.conversationId}
                                        conversation={conv}
                                        isActive={conv.conversationId === currentConversationId}
                                        onResume={(id) => {
                                            if (onSelectConversation) {
                                                onSelectConversation(id);
                                            }
                                            if (isOverlay) onClose();
                                        }}
                                        onDelete={(id) => setDeleteId(id)}
                                        onEditTitle={(id: string, title: string) => updateTitle(id, title)}
                                        searchQuery={searchQuery}
                                        onTogglePin={togglePinConversation}
                                        isSelectionMode={selectionMode}
                                        isSelected={selectedIds.has(conv.conversationId)}
                                        onToggleSelect={toggleSelection}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* Grouped View (All) */
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
                                                            conversation={conv}
                                                            isActive={conv.conversationId === currentConversationId}
                                                            onResume={(id) => {
                                                                if (onSelectConversation) {
                                                                    onSelectConversation(id);
                                                                }
                                                                if (isOverlay) onClose();
                                                            }}
                                                            onDelete={(id) => setDeleteId(id)}
                                                            onEditTitle={(id: string, title: string) => updateTitle(id, title)}
                                                            searchQuery={searchQuery}
                                                            onTogglePin={togglePinConversation}
                                                            isSelectionMode={selectionMode}
                                                            isSelected={selectedIds.has(conv.conversationId)}
                                                            onToggleSelect={toggleSelection}
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
                                                    conversation={conv}
                                                    isActive={conv.conversationId === currentConversationId}
                                                    onResume={(id) => {
                                                        if (onSelectConversation) {
                                                            onSelectConversation(id);
                                                        }
                                                        if (isOverlay) onClose();
                                                    }}
                                                    onDelete={(id) => setDeleteId(id)}
                                                    onEditTitle={(id: string, title: string) => updateTitle(id, title)}
                                                    searchQuery={searchQuery}
                                                    onTogglePin={togglePinConversation}
                                                    isSelectionMode={selectionMode}
                                                    isSelected={selectedIds.has(conv.conversationId)}
                                                    onToggleSelect={toggleSelection}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {/* ... existing footer code ... */}


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

            {/* Modals placed inside sidebar to share context/portal */}
            <ConfirmationModal
                isOpen={!!deleteId}
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
        </div>
    );

    if (!isOverlay) {
        return SidebarContent;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        ref={sidebarRef}
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-auto z-50 p-0" // wrapper for motion
                        style={{ width: 'fit-content' }}
                    >
                        {SidebarContent}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConversationSidebar;
