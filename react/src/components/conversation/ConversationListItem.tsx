import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Edit2, Play, MoreVertical, FolderInput, Share2, Pin, CheckSquare, Square } from 'lucide-react';
import type { Conversation } from '../../store/useConversationHistoryStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useFolderStore } from '../../store/useFolderStore';
import ExportButton from './ExportButton';
import ShareModal from '../common/ShareModal';
import apiClient from '../../api/client';
import DropdownPortal from '../common/DropdownPortal';
import MoveToFolderModal from './MoveToFolderModal';

interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
    onEditTitle: (id: string, newTitle: string) => void;
    searchQuery?: string; // NEW: for highlighting search matches
    onTogglePin?: (id: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    isActive,
    onResume,
    onDelete,
    onEditTitle,
    searchQuery = '', // NEW
    onTogglePin,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);
    const [showMenu, setShowMenu] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { folders, moveConversation, getFolderByConversation } = useFolderStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleSaveTitle = (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onEditTitle(conversation.conversationId, editTitle);
        setIsEditing(false);
    };

    const handleMenuAction = (action: () => void, e: React.MouseEvent) => {
        e.stopPropagation();
        action();
        setShowMenu(false);
    };

    // STAGE R1: Prefetch conversation on hover
    const { accessToken } = useUserStore();

    const handleMouseEnter = useCallback(() => {
        if (!isActive && accessToken && conversation.conversationId) {
            // Prefetch messages for instant switching
            import('../../utils/messageCache').then(({ messageCache }) => {
                messageCache.prefetch(conversation.conversationId, async () => {
                    // STAGE 1: Use API client instead of hardcoded URL
                    const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                        apiClient.get(`/conversations/${conversation.conversationId}`)
                    ));
                    const data = response.data;
                    return data.messages.map((msg: any) => ({
                        id: msg.id || msg._id,
                        _id: msg.id || msg._id,
                        type: msg.role === 'assistant' ? 'gnani' : msg.role,
                        message: msg.content,
                        timestamp: new Date(msg.timestamp).getTime(),
                        parentId: msg.parentId,
                        children: msg.children,
                        branchIndex: msg.branchIndex,
                        metadata: msg.metadata
                    }));
                });
            });
        }
    }, [isActive, accessToken, conversation.conversationId]);

    // NEW: Highlight search matches
    const highlightMatch = (text: string, query: string) => {
        if (!query || !query.trim()) return text;

        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="bg-jarvis-cyan/30 text-white px-0.5 rounded font-medium">{part}</mark>
                : part
        );
    };

    // Drag handlers for folder organization
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('conversationId', conversation.conversationId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleMoveToFolder = (folderId: string) => {
        const currentFolder = getFolderByConversation(conversation.conversationId);
        moveConversation(conversation.conversationId, currentFolder?.id || null, folderId);
        setShowFolderModal(false);
        setShowMenu(false);
    };

    const handleItemClick = (e: React.MouseEvent) => {
        if (isSelectionMode && onToggleSelect) {
            e.stopPropagation();
            onToggleSelect(conversation.conversationId);
        } else {
            onResume(conversation.conversationId);
        }
    };

    // DEBUG: Check pinned state
    // console.log(`Conversation ${conversation.conversationId}: pinned=${conversation.isPinned}`);

    return (
        <div
            className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:bg-black/5 dark:hover:bg-gnani-primary/10 ${isActive
                ? 'bg-gnani-primary/10 border-l-2 border-gnani-primary'
                : conversation.isPinned
                    ? 'bg-canvas-surface/40'
                    : 'bg-canvas-surface/40'
                } ${isSelected ? 'bg-gnani-primary/20 border-l-2 border-gnani-primary' : ''}`}
            onClick={handleItemClick}
            onMouseEnter={handleMouseEnter}
            draggable
            onDragStart={handleDragStart}
        >
            <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className="pt-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(conversation.conversationId); }}>
                        {isSelected ? (
                            <CheckSquare size={16} className="text-gnani-primary" aria-label="Deselect conversation" role="checkbox" aria-checked="true" />
                        ) : (
                            <Square size={16} className="text-type-muted hover:text-gnani-primary/70" aria-label="Select conversation" role="checkbox" aria-checked="false" />
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        {isEditing ? (
                            <form onSubmit={handleSaveTitle} onClick={e => e.stopPropagation()} className="flex-1 mr-2">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-canvas-surface/50 border border-gnani-primary/30 rounded px-1 text-sm text-gnani-primary focus:outline-none focus:border-gnani-primary"
                                    autoFocus
                                    onBlur={() => setIsEditing(false)}
                                />
                            </form>
                        ) : (
                            <h3 className="text-sm font-medium text-gnani-primary truncate group-hover:text-type-primary transition-colors flex-1 mr-2">
                                {conversation.isPinned && <Pin size={12} className="inline mr-1 text-gnani-secondary rotate-45" fill="currentColor" />}
                                {highlightMatch(conversation.title, searchQuery)}
                            </h3>
                        )}

                        {/* Model Badge */}
                        {conversation.model && (
                            <span className="text-[10px] uppercase font-mono px-1 rounded border border-jarvis-blue/30 text-jarvis-blue/70 ml-1 whitespace-nowrap hidden group-hover:inline-block">
                                {conversation.model}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 truncate mt-1">
                        {conversation.preview || 'No messages'}
                    </p>
                    <div className="flex items-center mt-2 text-[10px] text-gray-500">
                        <MessageSquare size={10} className="mr-1" />
                        <span className="mr-1">{conversation.messageCount || 0} •</span>
                        <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span>
                    </div>
                </div>

                {/* Actions (Pin + Menu) */}
                {!isSelectionMode && (
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-canvas-popover rounded backdrop-blur-sm p-1 shadow-lg`}>
                        {onTogglePin && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onTogglePin(conversation.conversationId); }}
                                className={`p-1 rounded hover:bg-white/10 ${conversation.isPinned ? 'text-jarvis-purple' : 'text-type-muted hover:text-jarvis-purple'} cursor-pointer`}
                                title={conversation.isPinned ? "Unpin" : "Pin"}
                            >
                                <Pin size={14} className={conversation.isPinned ? "rotate-45" : ""} fill={conversation.isPinned ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button
                            ref={buttonRef}
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className={`p-1 rounded hover:bg-white/10 ${showMenu ? 'text-jarvis-cyan' : 'text-type-muted hover:text-jarvis-cyan'} cursor-pointer`}
                            title="More options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Dropdown Menu Portal */}
            <DropdownPortal isOpen={showMenu} buttonRef={buttonRef} placement="right-start" onClose={() => setShowMenu(false)}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    ref={menuRef}
                    className="w-40 bg-canvas-popover rounded-xl p-1.5 z-50 overflow-hidden"
                    style={{ boxShadow: 'var(--shadow-popover)', background: 'var(--bg-popover)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => handleMenuAction(() => onResume(conversation.conversationId), e)}
                        className="w-full px-3 py-2 text-left text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer transition-all rounded flex items-center gap-2 cursor-pointer"
                    >
                        <Play size={14} />
                        <span>Resume</span>
                    </button>
                    <ExportButton conversationId={conversation.conversationId} asMenuItem />

                    <div className="my-2 border-t border-gray-200 dark:border-gray-600" />

                    <button
                        onClick={(e) => handleMenuAction(() => setIsEditing(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer transition-all rounded flex items-center gap-2 cursor-pointer"
                    >
                        <Edit2 size={12} />
                        Edit Title
                    </button>
                    <button
                        onClick={(e) => handleMenuAction(() => setShowFolderModal(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer transition-all rounded flex items-center gap-2 cursor-pointer"
                    >
                        <FolderInput size={12} />
                        Move to Folder
                    </button>

                    <div className="my-2 border-t border-gray-200 dark:border-gray-600" />

                    <button
                        onClick={(e) => handleMenuAction(() => setShowShareModal(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-type-secondary hover:text-gnani-primary hover:bg-glass-shimmer transition-all rounded flex items-center gap-2 cursor-pointer"
                    >
                        <Share2 size={12} />
                        Share
                    </button>

                    <div className="my-2 border-t border-gray-200 dark:border-gray-600" />

                    <button
                        onClick={(e) => handleMenuAction(() => onDelete(conversation.conversationId), e)}
                        className="w-full px-3 py-2 text-left text-xs text-status-error hover:bg-status-error/10 transition-all rounded flex items-center gap-2 cursor-pointer"
                    >
                        <Trash2 size={12} />
                        Delete
                    </button>
                </motion.div>
            </DropdownPortal>

            {/* Move to Folder Modal */}
            <MoveToFolderModal
                isOpen={showFolderModal}
                onClose={() => setShowFolderModal(false)}
                onMove={handleMoveToFolder}
                folders={folders}
            />

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    conversationId={conversation.conversationId}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default ConversationListItem;
