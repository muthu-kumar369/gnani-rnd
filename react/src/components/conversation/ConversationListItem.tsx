import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, Edit2, Play, MoreVertical, FolderInput, Share2, Pin, CheckSquare, Square } from 'lucide-react';
import type { Conversation } from '../../store/useConversationHistoryStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useFolderStore } from '../../store/useFolderStore';
import ExportButton from './ExportButton';
import ShareModal from '../common/ShareModal';
import apiClient from '../../api/client'; // STAGE 1: Use API client

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

    return (
        <div
            className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 border ${isActive
                ? 'bg-jarvis-blue/20 border-jarvis-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'bg-black/40 border-transparent hover:bg-jarvis-blue/10 hover:border-jarvis-blue/30'
                } ${isSelected ? 'bg-jarvis-blue/30 border-jarvis-cyan' : ''}`}
            onClick={handleItemClick}
            onMouseEnter={handleMouseEnter}
            draggable
            onDragStart={handleDragStart}
        >
            <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className="pt-1" onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(conversation.conversationId); }}>
                        {isSelected ? (
                            <CheckSquare size={16} className="text-jarvis-cyan" aria-label="Deselect conversation" role="checkbox" aria-checked="true" />
                        ) : (
                            <Square size={16} className="text-gray-500 hover:text-jarvis-cyan/70" aria-label="Select conversation" role="checkbox" aria-checked="false" />
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
                                    className="w-full bg-black/50 border border-jarvis-cyan/30 rounded px-1 text-sm text-jarvis-cyan focus:outline-none focus:border-jarvis-cyan"
                                    autoFocus
                                    onBlur={() => setIsEditing(false)}
                                />
                            </form>
                        ) : (
                            <h3 className="text-sm font-medium text-jarvis-cyan truncate group-hover:text-white transition-colors flex-1 mr-2">
                                {conversation.isPinned && <Pin size={12} className="inline mr-1 text-jarvis-purple rotate-45" fill="currentColor" />}
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
                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-black/80 rounded backdrop-blur-sm p-1 shadow-lg`}>
                        {onTogglePin && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onTogglePin(conversation.conversationId); }}
                                className={`p-1 rounded hover:bg-white/10 ${conversation.isPinned ? 'text-jarvis-purple' : 'text-gray-400 hover:text-jarvis-purple'}`}
                                title={conversation.isPinned ? "Unpin" : "Pin"}
                            >
                                <Pin size={14} className={conversation.isPinned ? "rotate-45" : ""} fill={conversation.isPinned ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button
                            ref={buttonRef}
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className={`p-1 rounded hover:bg-white/10 ${showMenu ? 'text-jarvis-cyan' : 'text-gray-400 hover:text-jarvis-cyan'}`}
                            title="More options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Dropdown Menu (Moved outside conditional for cleaner DOM, but logic kept inside showMenu check) */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute right-[-140px] top-6 w-40 bg-black/95 backdrop-blur-lg border border-jarvis-blue/40 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(0,240,255,0.2)] z-50 py-1"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => handleMenuAction(() => onResume(conversation.conversationId), e)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan transition-colors flex items-center gap-2"
                    >
                        <Play size={12} />
                        Resume
                    </button>
                    <ExportButton conversationId={conversation.conversationId} asMenuItem />
                    <div className="my-1 border-t border-jarvis-blue/20" />
                    <button
                        onClick={(e) => handleMenuAction(() => setIsEditing(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-blue/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={12} />
                        Edit Title
                    </button>
                    <button
                        onClick={(e) => handleMenuAction(() => setShowFolderModal(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-blue/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <FolderInput size={12} />
                        Move to Folder
                    </button>
                    <button
                        onClick={(e) => handleMenuAction(() => setShowShareModal(true), e)}
                        className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-blue/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Share2 size={12} />
                        Share
                    </button>
                    <button
                        onClick={(e) => handleMenuAction(() => onDelete(conversation.conversationId), e)}
                        className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={12} />
                        Delete
                    </button>
                </div>
            )}

            {/* Move to Folder Modal */}
            {showFolderModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={(e) => { e.stopPropagation(); setShowFolderModal(false); }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        <div
                            className="bg-black/95 border border-jarvis-cyan/30 rounded-lg shadow-2xl w-full max-w-sm"
                        >
                            <div className="p-4 border-b border-jarvis-blue/20">
                                <h3 className="text-lg font-semibold text-jarvis-cyan">Move to Folder</h3>
                            </div>
                            <div className="p-4 max-h-96 overflow-y-auto">
                                <button
                                    onClick={() => handleMoveToFolder(null as any)}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-jarvis-cyan/10 text-gray-300 hover:text-jarvis-cyan transition-colors mb-1"
                                >
                                    📂 Unorganized
                                </button>
                                {folders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMoveToFolder(folder.id)}
                                        className="w-full text-left px-3 py-2 rounded hover:bg-jarvis-cyan/10 text-gray-300 hover:text-jarvis-cyan transition-colors mb-1"
                                    >
                                        {folder.icon} {folder.name}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 border-t border-jarvis-blue/20 flex justify-end">
                                <button
                                    onClick={() => setShowFolderModal(false)}
                                    className="px-4 py-2 bg-jarvis-blue/20 hover:bg-jarvis-blue/30 text-jarvis-cyan rounded transition-colors"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
