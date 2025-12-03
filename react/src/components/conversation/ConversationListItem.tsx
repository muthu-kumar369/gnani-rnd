import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, Edit2, Play } from 'lucide-react';
import type { Conversation } from '../../store/useConversationHistoryStore';

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
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(conversation.title);

    const handleSaveTitle = (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onEditTitle(conversation.sessionId, editTitle);
        setIsEditing(false);
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

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onResume(conversation.sessionId); }}
                        className="p-1 hover:bg-jarvis-cyan/20 rounded text-jarvis-cyan"
                        title="Resume"
                    >
                        <Play size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1 hover:bg-jarvis-blue/20 rounded text-gray-400 hover:text-white"
                        title="Edit Title"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(conversation.sessionId); }}
                        className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConversationListItem;
