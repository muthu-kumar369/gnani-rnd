import React, { useEffect, useRef } from 'react';
import { User, Sparkles, Copy, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MessageItem from './MessageItem';
import DateSeparator from './DateSeparator';
import TypingIndicator from './TypingIndicator';
import StreamingProgress from '../common/StreamingProgress';
import TimeoutIndicator from '../common/TimeoutIndicator';
import { useConversationStore } from '../../store/useConversationStore';
import type { ConversationMessage } from '../../store/useConversationStore';

import { useUserStore } from '../../store/useUserStore';

import MessageSkeleton from './MessageSkeleton';

interface MessageListProps {
    messages: ConversationMessage[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isFetchingMore?: boolean;
    isInitialLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    hasMore,
    onLoadMore,
    isFetchingMore,
    isInitialLoading
}) => {
    const { isStreaming, streamProgress, cancelStream, regenerateResponse, conversationId, currentLeafId } = useConversationStore();
    const { accessToken } = useUserStore();
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
    const prevScrollHeightRef = useRef<number>(0);
    const [streamDuration, setStreamDuration] = React.useState(0);

    // Track streaming duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStreaming) {
            setStreamDuration(0);
            interval = setInterval(() => {
                setStreamDuration(prev => prev + 1);
            }, 1000);
        } else {
            setStreamDuration(0);
        }
        return () => clearInterval(interval);
    }, [isStreaming]);

    // Auto-scroll to bottom behavior
    useEffect(() => {
        if (shouldAutoScroll && !isFetchingMore) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll, isFetchingMore]);

    // Scroll position preservation when loading previous messages
    React.useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container || !isFetchingMore) return;

        // Verify if we added messages (height increased)
        if (container.scrollHeight > prevScrollHeightRef.current) {
            const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
            container.scrollTop = heightDifference;
        }
    }, [messages, isFetchingMore]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;

        // Auto-scroll logic: only if near bottom
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShouldAutoScroll(isNearBottom);

        // Pagination logic: if at top
        if (scrollTop === 0 && hasMore && !isFetchingMore && onLoadMore) {
            prevScrollHeightRef.current = scrollHeight;
            onLoadMore();
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6 space-y-4 md:space-y-6 scroll-smooth"
            onScroll={handleScroll}
        >
            {isFetchingMore && (
                <div className="flex justify-center py-2">
                    <div className="w-6 h-6 border-2 border-jarvis-blue/30 border-t-jarvis-blue rounded-full animate-spin" />
                </div>
            )}

            {isInitialLoading && messages.length === 0 ? (
                <div className="space-y-4">
                    <MessageSkeleton />
                    <MessageSkeleton />
                    <MessageSkeleton />
                </div>
            ) : (
                messages.map((msg, idx) => {
                    const prevMsg = messages[idx - 1];
                    const showDateSeparator = !prevMsg ||
                        new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                    return (
                        <React.Fragment key={msg.id || idx}>
                            {showDateSeparator && <DateSeparator timestamp={msg.timestamp} />}
                            <MessageItem
                                message={msg}
                                isLast={idx === messages.length - 1}
                            />
                        </React.Fragment>
                    );
                })
            )}

            {isLoading && (
                <div className="flex gap-4 max-w-4xl mx-auto pl-2">
                    <TypingIndicator status="thinking" />
                </div>
            )}

            {/* Streaming Progress Indicator (Task 2.8) */}
            {isStreaming && (
                <div className="px-4 md:px-0 max-w-4xl mx-auto w-full space-y-4">
                    <StreamingProgress isStreaming={isStreaming} progress={streamProgress} />

                    {/* Timeout Indicator (Task 2.9) */}
                    {streamDuration > 30 && (
                        <div className="flex justify-center">
                            <TimeoutIndicator
                                onCancel={() => {
                                    if (conversationId && accessToken) {
                                        cancelStream(conversationId, accessToken);
                                    }
                                }}
                                onRetry={() => {
                                    if (currentLeafId && accessToken) {
                                        regenerateResponse(currentLeafId, accessToken);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            <div ref={bottomRef} className="h-4" />
        </div>
    );
};

export default MessageList;
