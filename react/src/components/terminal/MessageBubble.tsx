import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Terminal, Activity, RefreshCw, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useConversationStore, type ConversationMessage } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';

interface MessageBubbleProps {
    message: ConversationMessage;
    isLatest: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLatest }) => {
    const { regenerateResponse, editMessage, navigateToBranch } = useConversationStore();
    const { accessToken } = useUserStore();
    const [displayedText, setDisplayedText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.message);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const isGnani = message.type === 'gnani';
    const isTTS = message.type === 'tts';
    const isUser = message.type === 'user';

    // Typing effect for Gnani messages
    useEffect(() => {
        if (isGnani && isLatest) {
            let i = 0;
            const speed = 15; // ms per char
            const text = message.message;
            setDisplayedText('');

            const interval = setInterval(() => {
                if (i < text.length) {
                    i++;
                    setDisplayedText(text.substring(0, i));
                } else {
                    clearInterval(interval);
                }
            }, speed);

            return () => clearInterval(interval);
        } else {
            setDisplayedText(message.message);
        }
    }, [message.message, isGnani, isLatest]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const getIcon = () => {
        switch (message.type) {
            case 'user': return <User size={14} className="text-cyan-300" />;
            case 'gnani': return <Bot size={14} className="text-cyan-300" />;
            case 'tts': return <Volume2 size={14} className="text-cyan-300" />;
            case 'action': return <Activity size={14} className="text-cyan-300" />;
            default: return <Terminal size={14} className="text-cyan-300" />;
        }
    };

    const getBorderColor = () => {
        switch (message.type) {
            case 'user': return 'border-cyan-500/30';
            case 'gnani': return 'border-cyan-400/50';
            case 'tts': return 'border-cyan-300/60';
            case 'action': return 'border-yellow-500/30';
            default: return 'border-gray-600/30';
        }
    };

    const getBgColor = () => {
        switch (message.type) {
            case 'user': return 'bg-cyan-950/20';
            case 'gnani': return 'bg-cyan-900/20';
            case 'tts': return 'bg-cyan-800/20';
            case 'action': return 'bg-yellow-900/10';
            default: return 'bg-gray-900/20';
        }
    };

    const handleRegenerate = async () => {
        if (isRegenerating) return;
        setIsRegenerating(true);
        try {
            await regenerateResponse(message.id, accessToken || '');
        } catch (error) {
            console.error('Failed to regenerate:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleEditSave = async () => {
        if (editContent.trim() === message.message) {
            setIsEditing(false);
            return;
        }
        try {
            await editMessage(message.id, editContent, accessToken || '');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to edit:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative mb-3 p-3 rounded-lg border ${getBorderColor()} ${getBgColor()} backdrop-blur-sm overflow-hidden group`}
        >
            {/* Holographic scanline effect for active/latest messages */}
            {isLatest && (
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scanline" />
            )}

            <div className="flex items-start gap-3">
                {/* Avatar/Icon Box */}
                <div className="shrink-0 w-6 h-6 rounded border border-cyan-500/30 flex items-center justify-center bg-black/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                                {message.type}
                            </span>
                            <span className="text-[10px] text-cyan-700 font-mono">
                                [{formatTime(message.timestamp)}]
                            </span>
                            {/* Branch Info */}
                            {(message.children && message.children.length > 1) && (
                                <span className="text-[10px] text-cyan-600 font-mono flex items-center gap-1">
                                    <ChevronLeft
                                        size={10}
                                        className="cursor-pointer hover:text-cyan-400"
                                        onClick={() => navigateToBranch(message.id, 'prev')}
                                    />
                                    {(message.branchIndex || 0) + 1}/{message.children.length}
                                    <ChevronRight
                                        size={10}
                                        className="cursor-pointer hover:text-cyan-400"
                                        onClick={() => navigateToBranch(message.id, 'next')}
                                    />
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isGnani && (
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    className="p-1 hover:bg-cyan-500/20 rounded text-cyan-600 hover:text-cyan-300 transition-colors"
                                    title="Regenerate Response"
                                >
                                    <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                                </button>
                            )}
                            {isUser && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 hover:bg-cyan-500/20 rounded text-cyan-600 hover:text-cyan-300 transition-colors"
                                    title="Edit Message"
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`font-mono text-sm leading-relaxed ${isTTS ? 'text-cyan-100' : 'text-cyan-200/90'}`}>
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-black/50 border border-cyan-500/30 rounded p-2 text-cyan-200 focus:outline-none focus:border-cyan-500/70"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEditSave}
                                        className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            isGnani && isLatest ? (
                                <>
                                    {displayedText}
                                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-500 animate-pulse" />
                                </>
                            ) : (
                                message.message
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50" />
        </motion.div>
    );
};

export default MessageBubble;
