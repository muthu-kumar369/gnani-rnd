import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Terminal, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useConversationStore, type ConversationMessage } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { useMessageActions } from '../../hooks/useMessageActions';
import MessageActions from './MessageActions';
import EditMessageModal from './EditMessageModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TokenBadge from '../token-usage/TokenBadge';
import MessageTimestamp from './MessageTimestamp';
import MessageContent from './MessageContent';
import { GenerationNavigator } from './GenerationNavigator';
import '../../styles/messageActions.css';

interface MessageBubbleProps {
    message: ConversationMessage;
    isLatest: boolean;
    showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLatest, showTimestamp = true }) => {
    const { navigateToBranch, navigateToGeneration, conversationId, allMessages } = useConversationStore();
    const { accessToken } = useUserStore();
    const actions = useMessageActions(conversationId);

    const [isHovered, setIsHovered] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [generationCount, setGenerationCount] = useState<number>(1);

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

    const handleCopy = () => {
        navigator.clipboard.writeText(message.message);
        // Could add toast here
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
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-scanline rounded-lg" />
                )}

                {/* Message Actions Hover Menu */}
                {!isSystem && (
                    <MessageActions
                        role={actionRole as any}
                        isVisible={isHovered}
                        onCopy={handleCopy}
                        onRegenerate={isGnani ? () => actions.regenerateMessage(message.id) : undefined}
                        onEdit={isUser ? () => setIsEditModalOpen(true) : undefined}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                        isRegenerating={actions.isLoading}
                    />
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
                                {showTimestamp && <MessageTimestamp timestamp={message.timestamp} />}
                                {/* Branch Info */}
                                {(message.children && message.children.length > 1) && (
                                    <span className="text-[10px] text-cyan-600 font-mono flex items-center gap-1 select-none">
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


                                {/* Token Usage Badge */}
                                {message.tokenUsage && (
                                    <TokenBadge usage={message.tokenUsage} />
                                )}
                            </div>
                        </div>

                        <MessageContent
                            content={message.message}
                            type={message.type}
                            isLatest={isLatest}
                        />

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
                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br-lg" />
            </motion.div >

            {/* Modals */}
            < EditMessageModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={(newContent) => actions.editMessage(message.id, newContent)}
                initialContent={message.message}
            />

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => actions.deleteMessage(message.id)}
                messagePreview={message.message}
            />
        </>
    );
};

export default MessageBubble;
