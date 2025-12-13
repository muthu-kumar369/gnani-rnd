import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventManager } from '../../utils/eventManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, History, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight, Folder, Trash2, User, Settings, LogOut, BarChart3, Moon, Keyboard, MoreHorizontal, FolderPlus, PanelLeftClose, Sparkles } from 'lucide-react';
import gnaniLogo from '../../assets/logo.svg';
import { useConversationHistory } from '../../hooks/useConversationHistory';
import ConversationListItem from './ConversationListItem';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useFolderStore } from '../../store/useFolderStore';
import Button from '../ui/Button';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ConversationSkeleton } from '../common/SkeletonLoader';
import CreateFolderModal from '../common/CreateFolderModal';
import { useConversationHistoryStore, type Conversation } from '../../store/useConversationHistoryStore';

import DropdownPortal from '../common/DropdownPortal';
import AnalyticsModal from '../analytics/AnalyticsModal';
import KeyboardShortcutsModal from '../settings/KeyboardShortcutsModal';
import GlassDropdown from '../ui/GlassDropdown';

import GlassTooltip from '../ui/GlassTooltip';
import GnaniLogo from '../ui/GnaniLogo';
import { useThemeStore } from '../../store/themeStore';
import { PanelLeftOpen, SquarePen, RotateCcw, CheckSquare } from 'lucide-react';

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
    const { accessToken, user, logout } = useUserStore();
    const { folders, moveConversation, getFolderByConversation } = useFolderStore();
    const isOverlay = variant === 'overlay';
    const navigate = useNavigate();

    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // NEW: Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const sidebarRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLButtonElement>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
    const { togglePinConversation } = useConversationHistoryStore();

    // NEW: Modals State
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const { toggleTheme } = useThemeStore();

    // Group conversations by folder
    const conversationsByFolder = React.useMemo(() => {
        const grouped: Record<string, Conversation[]> = {
            unorganized: []
        };

        // First apply pinning sort within the source list if possible, or just pin logic here?
        // Let's sort filtered lists later.
        (conversations || []).forEach(conv => {
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
        return [...(source || [])].sort((a, b) => {
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



    // isOverlay defined at top

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


    // State for collapse
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Toggle collapse
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        if (!isCollapsed) {
            // If collapsing, clear selection mode to avoid weird states
            setSelectionMode(false);
        }
    };

    const SidebarContent = (
        <motion.div
            initial={{ width: isCollapsed ? 80 : 320 }}
            animate={{ width: isCollapsed ? 80 : 320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`${isOverlay ? 'fixed top-0 left-0 h-full z-50 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'h-full border-r border-jarvis-blue/30'} bg-black/90 flex flex-col overflow-hidden`}
        >
            {/* Header */}
            <div className={`p-4 border-b border-jarvis-blue/20 flex flex-col gap-4 ${isCollapsed ? 'items-center grid justify-stretch' : ''}`}>
                <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
                    {/* Logo - Click to expand when collapsed */}
                    <div
                        className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'cursor-pointer hover:opacity-80 transition-opacity justify-center w-full' : ''}`}
                        onClick={isCollapsed ? toggleCollapse : undefined}
                        title={isCollapsed ? "Expand Sidebar" : undefined}
                    >
                        <img
                            src={gnaniLogo}
                            alt="Gnani"
                            className={`object-contain rounded-lg transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'}`}
                        />
                        {!isCollapsed && (
                            <span className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                                GNANI
                            </span>
                        )}
                    </div>

                    {/* Toggle Button - Hidden when collapsed (Logo handles expansion) */}
                    {!isOverlay && !isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                    {isOverlay && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Primary Actions: New Chat + Search */}
                <div className="flex flex-col gap-1 pb-2 z-10">
                    <button
                        onClick={handleNewConversation}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all group ${isCollapsed ? 'justify-center aspect-square px-2' : ''}`}
                        title="New Chat"
                    >
                        <SquarePen size={16} className="group-hover:text-cyan-400 transition-colors" />
                        {!isCollapsed && <span className="font-medium">New Chat</span>}
                    </button>

                    <button
                        onClick={() => eventManager.dispatchEvent('open-advanced-search')}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all group ${isCollapsed ? 'justify-center aspect-square px-2' : ''}`}
                        title="Search chats"
                    >
                        <Search size={16} className="group-hover:text-cyan-400 transition-colors" />
                        {!isCollapsed && <span className="font-medium">Search</span>}
                    </button>
                </div>
            </div>


            {/* Bulk Action Bar during Selection Mode */}
            {selectionMode && (
                <div className="p-2 border-b border-jarvis-blue/20 bg-jarvis-blue/10 flex items-center justify-between animate-slide-down">
                    <span className="text-xs text-jarvis-cyan font-mono">{selectedIds.size} Selected</span>
                    <div className="flex gap-1">
                        <GlassTooltip content="Delete Selected">
                            <button
                                onClick={handleBulkDelete}
                                disabled={selectedIds.size === 0}
                                className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                            </button>
                        </GlassTooltip>
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



            {/* List */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar"
                onScroll={handleScroll}
            >
                {!isCollapsed ? (
                    <>
                        {/* Collapsible Folder Section */}
                        {/* Collapsible Folder Section Header */}
                        <div className="mt-4 mb-2 pl-2 pr-0 py-1.5 flex items-center justify-between rounded-r-md bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-l-2 border-cyan-500/50 hover:border-cyan-400 transition-all group">
                            <button
                                onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                                className="flex items-center gap-2 group/btn"
                            >
                                <div className={`text-cyan-400/70 transition-transform duration-300 ${isFoldersExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                    <ChevronDown size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all group-hover/btn:text-cyan-300">
                                    Folders
                                </span>
                            </button>

                            <GlassTooltip content="Create New Folder">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCreateFolderModalOpen(true);
                                    }}
                                    className="p-1 rounded bg-cyan-500/5 text-cyan-400/70 ring-1 ring-cyan-500/20 hover:bg-cyan-400 hover:text-black hover:ring-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all duration-300"
                                >
                                    <FolderPlus size={15} strokeWidth={2} />
                                </button>
                            </GlassTooltip>
                        </div>

                        <AnimatePresence>
                            {isFoldersExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    {/* "All Conversations" / Clear Filter */}
                                    <button
                                        onClick={() => setSelectedFolderId(null)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedFolderId === null
                                            ? 'bg-jarvis-blue/10 text-jarvis-cyan'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                            }`}
                                    >
                                        <Folder size={14} className={selectedFolderId === null ? "text-jarvis-cyan" : "text-gray-500"} />
                                        <span className="flex-1 text-left">All Conversations</span>
                                    </button>

                                    {/* Render Folders */}
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group ${selectedFolderId === folder.id
                                                ? 'bg-jarvis-blue/10 text-jarvis-cyan'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                }`}
                                        >
                                            <span className="text-md opacity-80">{folder.icon}</span>
                                            <span className="flex-1 text-left truncate">{folder.name}</span>
                                            <span className="text-[10px] opacity-50">{folder.conversationIds.length}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Divider */}
                        <div className="h-px bg-white/5 mx-2 my-2" />

                        {/* Conversation List Header */}
                        {!isCollapsed && (
                            <div className="mt-4 mb-2 pl-2 pr-0 py-1.5 flex items-center justify-between rounded-r-md bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-l-2 border-cyan-500/50 hover:border-cyan-400 transition-all group">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all group-hover:text-cyan-300">
                                    Your Conversations
                                </span>
                                <div className="relative">
                                    <button
                                        ref={moreMenuRef}
                                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-cyan-400/70 hover:text-cyan-400 transition-colors ${isMoreMenuOpen ? 'bg-white/10 text-cyan-400' : ''}`}
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                    <DropdownPortal isOpen={isMoreMenuOpen} buttonRef={moreMenuRef} placement="bottom-end" onClose={() => setIsMoreMenuOpen(false)}>
                                        <div className="w-56 bg-[#0a0a0add] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-1 overflow-hidden z-[100]">
                                            {/* Refresh Action */}
                                            <button
                                                onClick={() => {
                                                    fetchConversations();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                                <span>Refresh List</span>
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />

                                            {/* Checkbox Toggle */}
                                            <button
                                                onClick={() => {
                                                    setSelectionMode(!selectionMode);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CheckSquare size={14} /> Select Multiple
                                                </span>
                                                {selectionMode && <CheckSquare size={12} className="text-jarvis-cyan" />}
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />
                                            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sort By</div>

                                            <button
                                                onClick={() => { setSortBy('date'); setIsMoreMenuOpen(false); fetchConversations(); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/10 rounded transition-colors ${sortBy === 'date' ? 'text-jarvis-cyan' : 'text-gray-300'}`}
                                            >
                                                <span>Date</span>
                                                {sortBy === 'date' && <div className="w-1.5 h-1.5 rounded-full bg-jarvis-cyan" />}
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('name'); setIsMoreMenuOpen(false); fetchConversations(); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/10 rounded transition-colors ${sortBy === 'name' ? 'text-jarvis-cyan' : 'text-gray-300'}`}
                                            >
                                                <span>Name</span>
                                                {sortBy === 'name' && <div className="w-1.5 h-1.5 rounded-full bg-jarvis-cyan" />}
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />
                                            <button
                                                onClick={() => {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    setIsMoreMenuOpen(false);
                                                    fetchConversations();
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <ArrowUpDown size={14} />
                                                <span>{sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}</span>
                                            </button>
                                        </div>
                                    </DropdownPortal>
                                </div>
                            </div>
                        )}

                        {/* Conversation List Tree */}
                        <div className="space-y-0.5 min-h-[100px]">
                            {/* Loading State */}
                            {isLoading && (conversations?.length || 0) === 0 ? (
                                <ConversationSkeleton className="mt-4" />
                            ) : (
                                <>
                                    {(filteredConversations?.length || 0) === 0 ? (
                                        <div className="text-center text-xs text-gray-600 mt-4">
                                            No conversations
                                        </div>
                                    ) : (
                                        filteredConversations.map(conv => (
                                            <ConversationListItem
                                                key={conv.conversationId}
                                                conversation={conv}
                                                isActive={conv.conversationId === currentConversationId}
                                                onResume={(id) => {
                                                    if (onSelectConversation) onSelectConversation(id);
                                                    if (isOverlay) onClose();
                                                }}
                                                onDelete={(id) => setDeleteId(id)}
                                                onEditTitle={(id, title) => updateTitle(id, title)}
                                                searchQuery=""
                                                onTogglePin={togglePinConversation}
                                                isSelectionMode={selectionMode}
                                                isSelected={selectedIds.has(conv.conversationId)}
                                                onToggleSelect={toggleSelection}
                                            />
                                        ))
                                    )}

                                    {/* Loading More Spinner */}
                                    {isLoading && (conversations?.length || 0) > 0 && (
                                        <div className="flex justify-center py-2">
                                            <div className="w-4 h-4 border-2 border-jarvis-cyan/30 border-t-jarvis-cyan rounded-full animate-spin" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    /* Collapsed State uses empty div or just icons if we wanted, but logic says just spacer */
                    <div className="flex-1" />
                )}
            </div>


            {/* Modals placed inside sidebar to share context/portal */}
            {/* User Profile Area */}
            <div className="p-3 border-t border-jarvis-border/20 z-10" ref={profileRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left ${isCollapsed ? 'justify-center p-2' : ''}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jarvis-blue to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-jarvis-blue/20 flex-shrink-0">
                            {user?.profile?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 overflow-hidden animate-fade-in">
                                    <p className="text-sm font-medium text-jarvis-text truncate">{user?.profile?.firstName || 'User'} {user?.profile?.lastName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-black text-[10px] font-bold tracking-wide shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                    UPGRADE
                                </div>
                            </>
                        )}
                    </button>

                    {/* Profile Popover - Using DropdownPortal if available or fallback to absolute */}
                    <DropdownPortal isOpen={isProfileOpen} buttonRef={profileRef} placement="top-start" onClose={() => setIsProfileOpen(false)}>
                        <div className="w-64 bg-gray-900 border border-jarvis-border/30 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl p-2 space-y-1">
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    // Navigate to profile or settings
                                    navigate('/settings');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    setIsAnalyticsOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>Analytics</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate('/settings');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Upgrade Plan</span>
                                <span className="ml-2 inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-bold text-black bg-gradient-to-r from-amber-200 to-yellow-400 rounded shadow-[0_0_6px_rgba(251,191,36,0.3)]">
                                    PRO
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    setIsShortcutsOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                                <Keyboard className="w-4 h-4" />
                                <span>Keyboard Shortcuts</span>
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Log out</span>
                            </button>
                        </div>
                    </DropdownPortal>
                </div>
            </div >

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

            <AnalyticsModal
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
            />

            <KeyboardShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />

            <CreateFolderModal
                isOpen={isCreateFolderModalOpen}
                onClose={() => setIsCreateFolderModalOpen(false)}
            />
        </motion.div >
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
                        className="fixed top-0 left-0 h-full w-auto z-50 p-0"
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
