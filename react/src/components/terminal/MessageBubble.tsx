import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Terminal, Activity, ChevronLeft, ChevronRight, Edit2, Check, X, RotateCw } from 'lucide-react';
import { useConversationStore, type ConversationMessage } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useMessageActions } from '../../hooks/useMessageActions';
import MessageActions from './MessageActions';

import DeleteConfirmDialog from './DeleteConfirmDialog';
import TokenBadge from '../token-usage/TokenBadge';
import MessageTimestamp from './MessageTimestamp';
import MessageContent from './MessageContent';
import { GenerationNavigator } from './GenerationNavigator';
import FeedbackButtons from '../common/FeedbackButtons'; // STAGE 21
import { InlineMessageEditor } from './InlineMessageEditor'; // STAGE R2
import StreamingProgress from '../common/StreamingProgress'; // STAGE 2.5
import '../../styles/messageActions.css';

interface MessageBubbleProps {
    message: ConversationMessage;
    isLatest: boolean;
    showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, isLatest, showTimestamp = true }) => {
    const { navigateToBranch, navigateToGeneration, conversationId, allMessages, isStreaming } = useConversationStore();
    const { accessToken } = useUserStore();
    const actions = useMessageActions(conversationId);

    const [isHovered, setIsHovered] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [generationCount, setGenerationCount] = useState<number>(1);

    // STAGE R2: Inline editing state (InlineMessageEditor handles text internally)
    const [isInlineEditing, setIsInlineEditing] = useState(false);

    const isGnani = message.type === 'gnani';
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    // Compute generation stats from store state
    const parentId = message.parentId;
    const parent = parentId ? allMessages.find(m => m.id === parentId) : null;
    const siblings = parent?.children || [];
    // If no parent (root message) or no siblings found, default to self
    const validSiblings = siblings.length > 0 ? siblings : [message.id];

    const currentIndex = validSiblings.indexOf(message.id) !== -1
        ? validSiblings.indexOf(message.id)
        : 0;
    const totalGenerations = validSiblings.length;

    const getIcon = () => {
        switch (message.type) {
            case 'user': return <User size={14} className="text-gnani-primary" />;
            case 'gnani': return <Bot size={14} className="text-gnani-primary" />;
            case 'tts': return <Volume2 size={14} className="text-gnani-primary" />;
            case 'action': return <Activity size={14} className="text-gnani-primary" />;
            default: return <Terminal size={14} className="text-gnani-primary" />;
        }
    };

    const getBorderColor = () => {
        switch (message.type) {
            case 'user': return 'border-gnani-primary/30';
            case 'gnani': return 'border-gnani-primary/50';
            case 'tts': return 'border-gnani-primary/60';
            case 'action': return 'border-status-warning/30';
            default: return 'border-line-base';
        }
    };

    const getBgColor = () => {
        switch (message.type) {
            case 'user': return 'bg-canvas-surface/40';
            case 'gnani': return 'bg-gnani-primary/5'; // Subtle tint for assistant
            case 'tts': return 'bg-gnani-primary/10';
            case 'action': return 'bg-status-warning/10';
            default: return 'bg-canvas-surface/20';
        }
    };

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(message.message);
        // Could add toast here
    }, [message.message]);

    // NEW: Share message handler
    const handleShare = async () => {
        const shareData = {
            title: 'Gnani Conversation',
            text: message.message,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy link (URL) as per Stage 7 spec
                await navigator.clipboard.writeText(window.location.href);
                // Optional: Show toast "Link copied to clipboard"
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    // NEW: Continue conversation handler
    const handleContinue = useCallback(() => {
        // Add a follow-up prompt based on the assistant's message
        const continuePrompt = `Continue from: "${message.message.substring(0, 50)}..."`;
        // This would typically set the input text or send a message
        // For now, we'll just copy it to clipboard as a placeholder
        navigator.clipboard.writeText(continuePrompt);
        // TODO: Integrate with input area to pre-fill the prompt
    }, [message.message]);

    // STAGE R2: Simplified inline editing - InlineMessageEditor handles all logic
    const handleStartInlineEdit = () => {
        setIsInlineEditing(true);
    };



    // Determine role for actions
    const actionRole = isUser ? 'user' : (isGnani ? 'assistant' : 'system');

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative mb-3 p-3 rounded-lg border ${getBorderColor()} ${getBgColor()} backdrop-blur-sm overflow-visible group`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Holographic scanline effect for active/latest messages */}
                {isLatest && (
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-transparent via-gnani-primary to-transparent animate-scanline rounded-lg" />
                )}

                {/* Inline Edit Button (only for user messages, not in edit mode) */}
                {isUser && !isInlineEditing && !isSystem && (
                    <button
                        onClick={handleStartInlineEdit}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-glass-shimmer rounded cursor-pointer"
                        title="Edit message (inline)"
                    >
                        <Edit2 size={14} className="text-gnani-primary" />
                    </button>
                )}

                {/* Message Actions Hover Menu */}
                {!isSystem && !isInlineEditing && (
                    <MessageActions
                        role={actionRole as any}
                        isVisible={isHovered}
                        onCopy={handleCopy}
                        onRegenerate={isGnani ? () => actions.regenerateMessage(message.id) : undefined}
                        onEdit={isUser ? handleStartInlineEdit : undefined}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                        onShare={handleShare}
                        onContinue={isGnani ? handleContinue : undefined}
                        isRegenerating={actions.isLoading}
                    />
                )}

                {/* STAGE 21: Feedback Buttons for assistant messages */}
                {isGnani && !isInlineEditing && (
                    <div className="absolute top-2 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FeedbackButtons
                            messageId={message.id}
                            conversationId={conversationId || ''}
                        />
                    </div>
                )}

                <div className="flex items-start gap-3">
                    {/* Avatar/Icon Box */}
                    <div className="shrink-0 w-6 h-6 rounded border border-gnani-primary/30 flex items-center justify-center bg-canvas-surface/40 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                        {getIcon()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gnani-primary">
                                    {message.type}
                                </span>
                                {showTimestamp && <MessageTimestamp timestamp={message.timestamp} />}

                                {/* Edited Indicator */}
                                {message.metadata?.edited && (
                                    <span className="text-xs text-type-muted">(edited)</span>
                                )}

                                {/* STAGE 23: Model Indicator */}
                                {message.metadata?.model && (
                                    <span className="text-xs text-type-muted">
                                        via {message.metadata.model}
                                    </span>
                                )}

                                {/* Branch Info */}
                                {(message.children && message.children.length > 1) && (
                                    <span className="text-[10px] text-gnani-secondary font-mono flex items-center gap-1 select-none">
                                        <ChevronLeft
                                            size={10}
                                            className="cursor-pointer hover:text-gnani-primary"
                                            onClick={() => navigateToBranch(message.id, 'prev')}
                                        />
                                        {(message.branchIndex || 0) + 1}/{message.children.length}
                                        <ChevronRight
                                            size={10}
                                            className="cursor-pointer hover:text-gnani-primary"
                                            onClick={() => navigateToBranch(message.id, 'next')}
                                        />
                                    </span>
                                )}


                                {/* Token Usage Badge */}
                                {message.tokenUsage && (
                                    <TokenBadge usage={message.tokenUsage} />
                                )}
                            </div>
                        </div>

                        {/* STAGE R2: Inline Edit Mode with InlineMessageEditor */}
                        {isInlineEditing ? (
                            <InlineMessageEditor
                                initialContent={message.message}
                                onSave={async (newContent) => {
                                    await actions.editMessage(message.id, newContent);
                                    setIsInlineEditing(false);
                                }}
                                onCancel={() => setIsInlineEditing(false)}
                                maxLength={2000}
                                autoRegenerate={true}
                            />
                        ) : (
                            <>
                                <MessageContent
                                    content={message.message}
                                    type={message.type}
                                    isLatest={isLatest}
                                />

                                {/* Streaming Progress Indicator */}
                                {isGnani && isLatest && isStreaming && (
                                    <div className="mt-2">
                                        <StreamingProgress
                                            progress={75}
                                            isStreaming={true}
                                            className=""
                                        />
                                        <p className="text-xs text-gnani-primary/60 mt-1">Streaming response...</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Generation Navigator for assistant messages with multiple generations */}
                        {isGnani && totalGenerations > 1 && (
                            <div className="mt-2">
                                <GenerationNavigator
                                    currentIndex={currentIndex}
                                    totalGenerations={totalGenerations}
                                    onNavigate={(direction) => {
                                        if (accessToken) {
                                            navigateToGeneration(message.id, direction);
                                        }
                                    }}
                                    timestamp={new Date(message.timestamp)}
                                    modelName={message.tokenUsage?.model || 'Unknown'}
                                />
                            </div>
                        )}

                        {/* Regenerate Button - Prominent below latest assistant message */}
                        {isGnani && isLatest && !isInlineEditing && (
                            <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3">
                                {/* Variant Counter (only if multiple generations) */}
                                {totalGenerations > 1 && (
                                    <div className="flex items-center gap-2 text-xs text-type-muted">
                                        <button
                                            onClick={() => navigateToGeneration(message.id, 'prev')}
                                            disabled={currentIndex === 0}
                                            className="p-1 hover:bg-glass-shimmer rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            title="Previous variant"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="font-mono">{currentIndex + 1} / {totalGenerations}</span>
                                        <button
                                            onClick={() => navigateToGeneration(message.id, 'next')}
                                            disabled={currentIndex === totalGenerations - 1}
                                            className="p-1 hover:bg-glass-shimmer rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                            title="Next variant"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Regenerate Button */}
                                <button
                                    onClick={() => actions.regenerateMessage(message.id)}
                                    disabled={actions.isLoading}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gnani-primary/10 hover:bg-gnani-primary/20 border border-gnani-primary/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto cursor-pointer"
                                    title="Regenerate response"
                                >
                                    <RotateCw size={14} className={actions.isLoading ? 'animate-spin' : ''} />
                                    {actions.isLoading ? 'Regenerating...' : 'Regenerate'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gnani-primary/50 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gnani-primary/50 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gnani-primary/50 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gnani-primary/50 rounded-br-lg" />
            </motion.div >

            {/* Modals */}


            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => actions.deleteMessage(message.id)}
                messagePreview={message.message}
            />
        </>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return prevProps.message._id === nextProps.message._id &&
        prevProps.isLatest === nextProps.isLatest &&
        prevProps.showTimestamp === nextProps.showTimestamp &&
        prevProps.message.message === nextProps.message.message;
});

export default MessageBubble;
