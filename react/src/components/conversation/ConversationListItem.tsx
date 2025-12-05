import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, Edit2, Play, MoreVertical } from 'lucide-react';
import type { Conversation } from '../../store/useConversationHistoryStore';
import ExportButton from './ExportButton';

interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
    onEditTitle: (id: string, newTitle: string) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
    conversation,
    isActive,
    onResume,
    onDelete,
    onEditTitle
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(conversation.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
        onEditTitle(conversation.sessionId, editTitle);
        setIsEditing(false);
    };

    const handleMenuAction = (action: () => void, e: React.MouseEvent) => {
        e.stopPropagation();
        action();
        setShowMenu(false);
    };

    return (
        <div
            className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 border ${isActive
                ? 'bg-jarvis-blue/20 border-jarvis-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'bg-black/40 border-transparent hover:bg-jarvis-blue/10 hover:border-jarvis-blue/30'
                }`}
            onClick={() => onResume(conversation.sessionId)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-2">
                    {isEditing ? (
                        <form onSubmit={handleSaveTitle} onClick={e => e.stopPropagation()}>
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
                        <h3 className="text-sm font-medium text-jarvis-cyan truncate group-hover:text-white transition-colors">
                            {conversation.title}
                        </h3>
                    )}
                    <p className="text-xs text-gray-400 truncate mt-1">
                        {conversation.preview || 'No messages'}
                    </p>
                    <div className="flex items-center mt-2 text-[10px] text-gray-500">
                        <MessageSquare size={10} className="mr-1" />
                        <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span>
                    </div>
                </div>

                {/* Three-dot menu button */}
                <div className={`relative transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        ref={buttonRef}
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className={`p-1.5 rounded transition-colors ${showMenu
                            ? 'bg-jarvis-cyan/20 text-jarvis-cyan'
                            : 'hover:bg-jarvis-cyan/20 text-gray-400 hover:text-jarvis-cyan'}`}
                        title="More options"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {/* Dropdown menu */}
                    {showMenu && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-8 w-40 bg-black/95 backdrop-blur-lg border border-jarvis-blue/40 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(0,240,255,0.2)] z-50 py-1"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={(e) => handleMenuAction(() => onResume(conversation.sessionId), e)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan transition-colors flex items-center gap-2"
                            >
                                <Play size={12} />
                                Resume
                            </button>
                            <ExportButton sessionId={conversation.sessionId} asMenuItem />
                            <div className="my-1 border-t border-jarvis-blue/20" />
                            <button
                                onClick={(e) => handleMenuAction(() => setIsEditing(true), e)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-jarvis-blue/10 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Edit2 size={12} />
                                Edit Title
                            </button>
                            <button
                                onClick={(e) => handleMenuAction(() => onDelete(conversation.sessionId), e)}
                                className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={12} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationListItem;
