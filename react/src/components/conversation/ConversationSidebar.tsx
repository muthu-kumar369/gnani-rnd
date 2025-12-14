import React, { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { eventManager } from '../../utils/eventManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, History, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight, Folder, Trash2, User, Settings, LogOut, BarChart3, Moon, Keyboard, MoreHorizontal, FolderPlus, PanelLeftClose, Sparkles, HelpCircle, FileText, Flag, Download, MessageSquareQuote, Briefcase } from 'lucide-react';
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
import { useModalStore, type SettingsTab, type WorkspaceTab } from '../../store/useModalStore';
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
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const helpRef = useRef<HTMLButtonElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isCreatingRef = useRef(false);

    const handleHelpMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHelpOpen(true);
    };

    const handleHelpMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHelpOpen(false);
        }, 300); // 300ms delay to allow moving to submenu
    };

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
        if (isCreatingRef.current) {
            return;
        }
        isCreatingRef.current = true;

        if (accessToken) {
            try {
                await createConversation(accessToken);
                onNewConversation();
                if (isOverlay) onClose();
            } catch (error) {
                console.error('Failed to create conversation:', error);
            } finally {
                // reset after a small delay to prevent double-clicks
                setTimeout(() => {
                    isCreatingRef.current = false;
                }, 500);
            }
        } else {
            isCreatingRef.current = false;
        }
    };

    // Keyboard Shortcuts Listeners
    // Keyboard Shortcuts Listeners
    useEffect(() => {
        const handleNewConversationShortcut = () => {
            handleNewConversation();
        };

        const handleSearchShortcut = () => {
            eventManager.dispatchEvent('open-advanced-search');
        };

        const handleShortcutsShortcut = () => {
            setIsProfileOpen(false);
            setIsHelpOpen(false);
            setIsShortcutsOpen(true);
        };

        const handleEscape = () => {
            if (selectionMode) {
                setSelectionMode(false);
                setSelectedIds(new Set());
            }
            if (isProfileOpen) setIsProfileOpen(false);
            if (isHelpOpen) setIsHelpOpen(false);
            // Dropdowns (more menu) are handled by DropdownPortal/GlassDropdown listeners
        };

        const cleanupNew = eventManager.addEventListener('keyboard:new-conversation', handleNewConversationShortcut);
        const cleanupSearch = eventManager.addEventListener('keyboard:focus-search', handleSearchShortcut);
        const cleanupShortcuts = eventManager.addEventListener('keyboard:show-shortcuts', handleShortcutsShortcut);
        const cleanupEscape = eventManager.addEventListener('keyboard:escape', handleEscape, undefined, 'ConversationSidebar');

        return () => {
            cleanupNew();
            cleanupSearch();
            cleanupShortcuts();
            cleanupEscape();
        };
    }, [handleNewConversation, selectionMode, isProfileOpen, isHelpOpen]);

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


    const { openWorkspace, openSettings } = useModalStore();

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

    // Sync isOpen prop with isCollapsed state for static variant
    useEffect(() => {
        if (variant === 'static') {
            setIsCollapsed(!isOpen);
        }
    }, [isOpen, variant]);

    const SidebarContent = (
        <motion.div
            initial={{ width: isCollapsed ? 80 : 320 }}
            animate={{ width: isCollapsed ? 80 : 320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`${isOverlay ? 'fixed top-0 left-0 h-full z-50 shadow-2xl backdrop-blur-xl' : 'h-full border-r border-transparent'} ${isCollapsed ? 'bg-white/5 dark:bg-white/5' : 'bg-canvas-panel'} flex flex-col overflow-hidden transition-colors duration-300`}
        >
            {/* Header */}
            <div className={`p-4 flex flex-col gap-4 ${isCollapsed ? 'items-center grid justify-stretch' : 'border-b border-black/5 dark:border-white/5 bg-white/5 dark:bg-white/5'}`}>
                <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
                    {/* Expand/Collapse Button for Overlay Mode or Manual Toggle */}

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
                            <span className="text-xl font-bold tracking-center text-gnani-primary">
                                GNANI
                            </span>
                        )}
                    </div>

                    {/* Toggle Button - Hidden when collapsed (Logo handles expansion) */}
                    {!isOverlay && !isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="text-type-secondary hover:text-type-primary transition-colors cursor-pointer"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                    {isOverlay && (
                        <button
                            onClick={onClose}
                            className="text-type-secondary hover:text-type-primary transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Primary Actions: New Chat + Search */}
                <div className="flex flex-col gap-1 pb-2 z-10">
                    <button
                        onClick={handleNewConversation}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer border border-transparent hover:border-glass-border rounded-lg transition-all group cursor-pointer ${isCollapsed ? 'justify-center aspect-square px-2' : ''}`}
                        title="New Chat"
                    >
                        <SquarePen size={16} className="group-hover:text-gnani-primary transition-colors" />
                        {!isCollapsed && <span className="font-medium">New Chat</span>}
                    </button>

                    <button
                        onClick={() => eventManager.dispatchEvent('open-advanced-search')}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer border border-transparent hover:border-glass-border rounded-lg transition-all group cursor-pointer ${isCollapsed ? 'justify-center aspect-square px-2' : ''}`}
                        title="Search chats"
                    >
                        <Search size={16} className="group-hover:text-gnani-primary transition-colors" />
                        {!isCollapsed && <span className="font-medium">Search</span>}
                    </button>
                </div>
            </div>


            {/* Bulk Action Bar during Selection Mode */}
            {selectionMode && (
                <div className="p-2 border-b border-line-base bg-glass flex items-center justify-between animate-slide-down">
                    <span className="text-xs text-gnani-primary font-mono">{selectedIds.size} Selected</span>
                    <div className="flex gap-1">
                        <GlassTooltip content="Delete Selected">
                            <button
                                onClick={handleBulkDelete}
                                disabled={selectedIds.size === 0}
                                className="p-1.5 rounded bg-status-error/10 text-status-error hover:bg-status-error/20 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                            </button>
                        </GlassTooltip>
                        {/* We could add move logic here, simpler just delete for now unless folder menu added */}
                        <button
                            onClick={() => setSelectionMode(false)}
                            className="p-1.5 rounded hover:bg-glass-shimmer text-type-secondary"
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
                        <div className="mt-6 mb-2 pl-3 pr-2 py-2 flex items-center justify-between rounded-lg bg-white/5 dark:bg-white/5 border border-black/5 dark:border-white/5 cursor-pointer group hover:bg-white/10 dark:hover:bg-white/10 transition-all"
                            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsFoldersExpanded(!isFoldersExpanded); }}
                                className="flex items-center gap-2 group/btn cursor-pointer"
                            >
                                <div className={`text-type-secondary transition-transform duration-300 ${isFoldersExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                    <ChevronDown size={14} strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-type-primary uppercase tracking-wider">
                                    Folders
                                </span>
                            </button>

                            <GlassTooltip content="Create New Folder">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCreateFolderModalOpen(true);
                                    }}
                                    className="p-1 rounded text-type-secondary hover:text-gnani-primary hover:bg-gnani-primary/10 transition-all duration-300 cursor-pointer"
                                    aria-label="Create Folder"
                                >
                                    <FolderPlus size={14} strokeWidth={2} />
                                </button>
                            </GlassTooltip>
                        </div>

                        <AnimatePresence>
                            {isFoldersExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-0.5 overflow-hidden px-2 mb-4"
                                >
                                    {/* "All Conversations" / Clear Filter */}
                                    <button
                                        onClick={() => setSelectedFolderId(null)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${selectedFolderId === null
                                            ? 'bg-gnani-primary/10 text-gnani-primary font-medium'
                                            : 'text-type-secondary hover:bg-white/5 hover:text-type-primary'
                                            }`}
                                    >
                                        <Folder size={14} className={selectedFolderId === null ? "text-gnani-primary" : "text-type-muted"} />
                                        <span className="flex-1 text-left">All Conversations</span>
                                    </button>

                                    {/* Render Folders */}
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group cursor-pointer ${selectedFolderId === folder.id
                                                ? 'bg-gnani-primary/10 text-gnani-primary font-medium'
                                                : 'text-type-secondary hover:bg-white/5 hover:text-type-primary'
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

                        {/* Conversation List Header */}
                        {!isCollapsed && (
                            <div className="mt-2 mb-2 pl-3 pr-2 py-2 flex items-center justify-between rounded-lg bg-white/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group cursor-default">
                                <span className="text-[11px] font-bold text-type-primary uppercase tracking-wider">
                                    Your Conversations
                                </span>
                                <div className="relative">
                                    <button
                                        ref={moreMenuRef}
                                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                        className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-type-secondary hover:text-type-primary transition-colors cursor-pointer ${isMoreMenuOpen ? 'bg-white/10 text-type-primary' : ''}`}
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                    <DropdownPortal isOpen={isMoreMenuOpen} buttonRef={moreMenuRef} placement="bottom-end" onClose={() => setIsMoreMenuOpen(false)}>
                                        <div className="w-56 bg-canvas-surface rounded-xl shadow-xl p-1.5 overflow-hidden z-[100]">
                                            {/* Refresh Action */}
                                            <button
                                                onClick={() => {
                                                    fetchConversations();
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer rounded transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                                <span>Refresh List</span>
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />

                                            {/* Checkbox Toggle */}
                                            <button
                                                onClick={() => {
                                                    setSelectionMode(!selectionMode);
                                                    setIsMoreMenuOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer rounded transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CheckSquare size={14} /> Select Multiple
                                                </span>
                                                {selectionMode && <CheckSquare size={12} className="text-gnani-primary" />}
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />
                                            <div className="px-3 py-1 text-[10px] text-type-muted uppercase tracking-wider font-semibold">Sort By</div>

                                            <button
                                                onClick={() => { setSortBy('date'); setIsMoreMenuOpen(false); fetchConversations(); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-glass-shimmer rounded transition-colors ${sortBy === 'date' ? 'text-gnani-primary' : 'text-type-secondary'}`}
                                            >
                                                <span>Date</span>
                                                {sortBy === 'date' && <div className="w-1.5 h-1.5 rounded-full bg-gnani-primary" />}
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('name'); setIsMoreMenuOpen(false); fetchConversations(); }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-glass-shimmer rounded transition-colors ${sortBy === 'name' ? 'text-gnani-primary' : 'text-type-secondary'}`}
                                            >
                                                <span>Name</span>
                                                {sortBy === 'name' && <div className="w-1.5 h-1.5 rounded-full bg-gnani-primary" />}
                                            </button>

                                            <div className="h-px bg-white/10 my-1" />
                                            <button
                                                onClick={() => {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    setIsMoreMenuOpen(false);
                                                    fetchConversations();
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer rounded transition-colors"
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
                                        <div className="text-center text-xs text-type-muted mt-4">
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
                                            <div className="w-4 h-4 border-2 border-gnani-primary/30 border-t-gnani-primary rounded-full animate-spin" />
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
            <div className={`p-3 z-10 mt-auto ${isCollapsed ? '' : 'border-t border-black/5 dark:border-white/5 bg-white/5 dark:bg-white/5'}`} ref={profileRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-glass-shimmer rounded-lg transition-colors text-left cursor-pointer ${isCollapsed ? 'justify-center p-2' : ''}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gnani-primary to-gnani-secondary flex items-center justify-center text-type-inverse font-bold text-sm shadow-lg shadow-gnani-primary/20 flex-shrink-0 overflow-hidden relative">
                            {(user?.profile?.uploadedProfilePhotoId || user?.profile?.profilePhoto) ? (
                                <img
                                    src={user.profile.uploadedProfilePhotoId
                                        ? `${API_BASE_URL}/files/${user.profile.uploadedProfilePhotoId}/download?token=${accessToken}`
                                        : user.profile.profilePhoto
                                    }
                                    alt="Profile"
                                    className="w-full h-full object-cover z-10 relative"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('fallback-active');
                                    }}
                                />
                            ) : null}
                            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gnani-primary to-gnani-secondary z-0 ${(user?.profile?.uploadedProfilePhotoId || user?.profile?.profilePhoto) ? 'hidden fallback-active:flex' : 'flex'}`}>
                                <span className="text-sm font-bold text-type-inverse">
                                    {user?.profile?.firstName?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 overflow-hidden animate-fade-in">
                                    <p className="text-sm font-medium text-type-primary truncate">{user?.profile?.firstName || 'User'} {user?.profile?.lastName}</p>
                                    <p className="text-xs text-type-muted truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-gnani-primary/10 border border-gnani-primary/20 text-gnani-primary text-[10px] font-bold tracking-wide">
                                    UPGRADE
                                </div>
                            </>
                        )}
                    </button>

                    {/* Profile Popover - Using DropdownPortal if available or fallback to absolute */}
                    <DropdownPortal isOpen={isProfileOpen} buttonRef={profileRef} placement="top-start" onClose={() => setIsProfileOpen(false)}>
                        <div className="w-64 bg-canvas-popover border border-glass-border rounded-lg shadow-xl overflow-hidden backdrop-blur-xl p-2 space-y-1">
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    openSettings('personalization');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    setIsAnalyticsOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>Analytics</span>
                            </button>
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsProfileOpen(false);
                                    openWorkspace('templates');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                            >
                                <Briefcase className="w-4 h-4" />
                                <span>Workspace</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    openSettings('general');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Upgrade Plan</span>
                                <span className="ml-2 inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-bold text-gnani-primary bg-gnani-primary/10 border border-gnani-primary/20 rounded">
                                    PRO
                                </span>
                            </button>
                            <div className="h-px bg-glass-border my-1" />
                            <button
                                ref={helpRef}
                                onMouseEnter={handleHelpMouseEnter}
                                onMouseLeave={handleHelpMouseLeave}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors group relative cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    <span>Help</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-type-muted group-hover:text-type-primary" />

                                {/* Submenu */}
                                <DropdownPortal isOpen={isHelpOpen} buttonRef={helpRef} placement="right-start">
                                    <div
                                        className="w-56 bg-canvas-popover border border-glass-border rounded-lg shadow-xl overflow-hidden backdrop-blur-xl p-2 space-y-1 z-[110]"
                                        onMouseEnter={handleHelpMouseEnter}
                                        onMouseLeave={handleHelpMouseLeave}
                                        onMouseDown={(e) => e.nativeEvent.stopImmediatePropagation()}
                                    >
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer">
                                            <HelpCircle className="w-4 h-4" />
                                            <span>Help center</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer">
                                            <MessageSquareQuote className="w-4 h-4" />
                                            <span>Release notes</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer">
                                            <FileText className="w-4 h-4" />
                                            <span>Terms & policies</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer">
                                            <Flag className="w-4 h-4" />
                                            <span>Report Bug</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer">
                                            <Download className="w-4 h-4" />
                                            <span>Download apps</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsHelpOpen(false);
                                                setIsProfileOpen(false);
                                                setIsShortcutsOpen(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-type-secondary hover:text-type-primary hover:bg-glass-shimmer rounded-md transition-colors cursor-pointer"
                                        >
                                            <Keyboard className="w-4 h-4" />
                                            <span>Keyboard shortcuts</span>
                                        </button>
                                    </div>
                                </DropdownPortal>
                            </button>
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-status-error hover:bg-status-error/10 rounded-md transition-colors cursor-pointer"
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
