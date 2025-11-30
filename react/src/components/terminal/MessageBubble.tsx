import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Terminal, Activity } from 'lucide-react';
import type { ConversationMessage } from '../../context/ConversationContext';

interface MessageBubbleProps {
    message: ConversationMessage;
    isLatest: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLatest }) => {
    const [displayedText, setDisplayedText] = useState('');
    const isGnani = message.type === 'gnani';
    const isTTS = message.type === 'tts';

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
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                            {message.type}
                        </span>
                        <span className="text-[10px] text-cyan-700 font-mono">
                            [{formatTime(message.timestamp)}]
                        </span>
                    </div>

                    <div className={`font-mono text-sm leading-relaxed ${isTTS ? 'text-cyan-100' : 'text-cyan-200/90'}`}>
                        {isGnani && isLatest ? (
                            <>
                                {displayedText}
                                <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-500 animate-pulse" />
                            </>
                        ) : (
                            message.message
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
