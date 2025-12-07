import React, { useState, useMemo } from 'react';
import { User, Sparkles, Copy, RefreshCw, Edit2, ChevronLeft, ChevronRight, Check, X, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useConversationStore } from '../../store/useConversationStore';
import type { ConversationMessage } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';

interface MessageItemProps {
    message: ConversationMessage;
    isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
    const {
        accessToken
    } = useUserStore();

    const {
        allMessages,
        editMessage,
        regenerateResponse,
        navigateToGeneration,
        navigateToBranch
    } = useConversationStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.message);

    const isUser = message.type === 'user';

    // Calculate siblings and index for pagination
    const { currentIndex, totalCount, hasSiblings } = useMemo(() => {
        if (!message.parentId) {
            // Root messages (usually first user message if no system prompt, or system prompt)
            // If parentId is missing but it's not the very first message, it might be tricky.
            // But usually conversation starts with one root. 
            // If we support multiple conversation starters (unlikely in tree), handle it:
            const roots = allMessages.filter(m => !m.parentId && m.type === message.type);
            // Sorting by timestamp to be safe, though usually only 1 root relevant to context
            return {
                currentIndex: roots.findIndex(m => m.id === message.id),
                totalCount: roots.length,
                hasSiblings: roots.length > 1
            };
        }

        const parent = allMessages.find(m => m.id === message.parentId);
        if (!parent || !parent.children) {
            return { currentIndex: 0, totalCount: 1, hasSiblings: false };
        }

        const siblings = parent.children;
        const index = siblings.indexOf(message.id);

        return {
            currentIndex: index !== -1 ? index : 0,
            totalCount: siblings.length,
            hasSiblings: siblings.length > 1
        };
    }, [message, allMessages]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.message);
    };

    const handleRegenerate = async () => {
        if (!accessToken) return;
        await regenerateResponse(message.id, accessToken);
    };

    const handleSaveEdit = async () => {
        if (editContent.trim() === message.message) {
            setIsEditing(false);
            return;
        }
        if (!accessToken) return;

        await editMessage(message.id, editContent, accessToken);
        setIsEditing(false);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        navigateToBranch(message.id, direction);
    };

    return (
        <div className={`flex gap-4 max-w-4xl mx-auto group ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-gray-700' : 'bg-jarvis-blue/20 text-jarvis-blue border border-jarvis-blue/30'
                }`}>
                {isUser ? <User className="w-5 h-5 text-gray-300" /> : <Sparkles className="w-5 h-5" />}
            </div>

            {/* Content Area */}
            <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Header (Name + Date + Pagination) */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400">
                        {isUser ? 'You' : 'Gnani'}
                    </span>

                    {hasSiblings && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 rounded px-1">
                            <button
                                onClick={() => handleNavigate('prev')}
                                className="hover:text-white disabled:opacity-30"
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft size={10} />
                            </button>
                            <span>{currentIndex + 1} / {totalCount}</span>
                            <button
                                onClick={() => handleNavigate('next')}
                                className="hover:text-white disabled:opacity-30"
                                disabled={currentIndex === totalCount - 1}
                            >
                                <ChevronRight size={10} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Bubble / Editor */}
                {isEditing ? (
                    <div className="w-full min-w-[300px] bg-gray-800/80 p-3 rounded-xl border border-jarvis-blue/30 backdrop-blur-sm">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:outline-none focus:border-jarvis-blue/50 resize-y min-h-[100px]"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-jarvis-blue hover:bg-jarvis-blue/80 text-xs text-white rounded transition-colors"
                            >
                                Save & Submit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`prose prose-invert prose-sm max-w-none rounded-2xl px-5 py-3 ${isUser
                        ? 'bg-white/10 text-white rounded-tr-sm'
                        : 'text-gray-100 rounded-tl-sm'
                        }`}>
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                )}

                {/* Footer Actions */}
                {!isEditing && (
                    <div className="flex items-center gap-2 mt-1 px-1 h-6">
                        {/* Always visible actions or hover? Standard is hover, but let's make it subtle */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 hover:text-white text-gray-500 rounded hover:bg-white/10 transition-colors"
                                title="Copy"
                            >
                                <Copy size={12} />
                            </button>

                            {isUser ? (
                                <button
                                    onClick={() => {
                                        setEditContent(message.message);
                                        setIsEditing(true);
                                    }}
                                    className="p-1.5 hover:text-white text-gray-500 rounded hover:bg-white/10 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={12} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleRegenerate}
                                        className="p-1.5 hover:text-white text-gray-500 rounded hover:bg-white/10 transition-colors"
                                        title="Regenerate"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;
