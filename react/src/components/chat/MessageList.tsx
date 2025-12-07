import React, { useEffect, useRef } from 'react';
import { User, Sparkles, Copy, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MessageItem from './MessageItem';
import type { ConversationMessage } from '../../store/useConversationStore';

interface MessageListProps {
    messages: ConversationMessage[];
    isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
            {messages.map((msg, idx) => (
                <MessageItem
                    key={msg.id || idx}
                    message={msg}
                    isLast={idx === messages.length - 1}
                />
            ))}

            {isLoading && (
                <div className="flex gap-4 max-w-4xl mx-auto">
                    <div className="w-8 h-8 rounded-full bg-jarvis-blue/20 flex items-center justify-center shrink-0 border border-jarvis-blue/30">
                        <Sparkles className="w-5 h-5 text-jarvis-blue animate-pulse" />
                    </div>
                </div>
            )}

            <div ref={bottomRef} className="h-4" />
        </div>
    );
};

export default MessageList;
