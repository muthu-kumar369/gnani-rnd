import React, { useState, useMemo } from 'react';
import { API_BASE_URL } from '../../api/apiClient';
import { User, Sparkles, Copy, RefreshCw, Edit2, Check, X, ThumbsUp, GitBranch } from 'lucide-react';
import gnaniLogo from '../../assets/logo.svg';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import BranchTree from './BranchTree';
import GenerationNavigator from './GenerationNavigator';
import CodeBlock from './CodeBlock';
import MermaidDiagram from './MermaidDiagram';
import { useConversationStore } from '../../store/useConversationStore';
import type { ConversationMessage } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import FeedbackButtons from '../common/FeedbackButtons';
import ImageGallery from './ImageGallery';
import InlineMessageEditor from './InlineMessageEditor';

interface MessageItemProps {
    message: ConversationMessage;
    isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
    const {
        accessToken,
        user
    } = useUserStore();

    const showTimestamp = user?.settings?.showTimestamps !== false; // Default true if undefined

    const {
        allMessages,
        editMessage,
        regenerateResponse,
        navigateToGeneration,
        navigateToBranch,
        conversationId
    } = useConversationStore();

    const [isEditing, setIsEditing] = useState(false);
    const [showBranchTree, setShowBranchTree] = useState(false);

    const isUser = message.type === 'user';

    // ... useMemo calculation ...

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

    const handleNavigate = (direction: 'prev' | 'next') => {
        navigateToBranch(message.id, direction);
    };

    return (
        <div className={`flex gap-4 max-w-4xl mx-auto group animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg overflow-hidden ${isUser
                ? 'bg-gray-800 border border-gray-700 text-gray-400'
                : 'bg-black border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                }`}>
                {isUser ? (
                    (user?.profile?.uploadedProfilePhotoId || user?.profile?.profilePhoto) ? (
                        <img
                            src={user.profile.uploadedProfilePhotoId
                                ? `${API_BASE_URL}/files/${user.profile.uploadedProfilePhotoId}/download?token=${accessToken}`
                                : user.profile.profilePhoto
                            }
                            alt="User"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('fallback-active');
                            }}
                        />
                    ) : (
                        <User className="w-4 h-4" />
                    )
                ) : (
                    <img
                        src={gnaniLogo}
                        alt="Gnani"
                        className="w-full h-full object-contain"
                    />
                )}
                {/* Fallback for user avatar if image load fails or no image */}
                {isUser && (
                    <div className="hidden fallback-active:flex w-full h-full absolute inset-0 items-center justify-center bg-gray-800 text-gray-400">
                        <User className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Header (Name + Date + Pagination) */}
                <div className="flex items-center gap-2 mb-1 opacity-80">
                    <span className={`text-xs font-bold tracking-wide uppercase ${isUser ? 'text-gray-400' : 'text-jarvis-cyan'}`}>
                        {isUser ? 'You' : 'Gnani'}
                    </span>
                    {showTimestamp && (
                        <span className="text-[10px] text-slate-500">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}

                    {hasSiblings && (
                        <GenerationNavigator
                            currentIndex={currentIndex}
                            totalGenerations={totalCount}
                            onNavigate={handleNavigate}
                            timestamp={new Date(message.timestamp)}
                            modelName={message.metadata?.model}
                            className="ml-2"
                        />
                    )}
                </div>

                {/* Message Bubble / Editor */}
                {isEditing ? (
                    <InlineMessageEditor
                        initialContent={message.message}
                        onSave={async (newContent) => {
                            if (!accessToken) return;
                            await editMessage(message.id, newContent, accessToken);
                            setIsEditing(false);
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <>
                        <div className={`prose prose-invert prose-sm max-w-none rounded-2xl px-5 py-4 border backdrop-blur-sm shadow-md transition-colors duration-200 ${isUser
                            ? 'bg-jarvis-cyan/10 border-jarvis-cyan/30 text-cyan-50 rounded-tr-sm shadow-[0_0_15px_rgba(0,255,255,0.05)]'
                            : 'bg-black/60 border-jarvis-blue/20 text-gray-200 rounded-tl-sm hover:bg-black/80 shadow-[0_0_10px_rgba(14,165,233,0.05)]'
                            }`}>
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const language = match ? match[1] : '';

                                        if (!inline && language === 'mermaid') {
                                            return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                                        }

                                        return !inline && match ? (
                                            <CodeBlock
                                                language={language}
                                                code={String(children).replace(/\n$/, '')}
                                                showLineNumbers={false}
                                            />
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {message.message}
                            </ReactMarkdown>
                        </div>

                        {/* Image Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 w-full max-w-md">
                                <ImageGallery images={message.attachments} />
                            </div>
                        )}
                    </>
                )}

                {/* Footer Actions */}
                {!isEditing && (
                    <div className="flex items-center gap-2 mt-1 px-1 h-6">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 hover:text-white text-gray-500 rounded hover:bg-white/10 transition-colors"
                                title="Copy"
                            >
                                <Copy size={12} />
                            </button>

                            {/* Feedback Buttons (Only for Assistant) */}
                            {!isUser && conversationId && (
                                <div className="border-l border-white/10 pl-1 ml-1 flex items-center">
                                    <FeedbackButtons
                                        messageId={message.id}
                                        conversationId={conversationId}
                                        initialFeedback={message.feedback}
                                    />
                                </div>
                            )}

                            {isUser ? (
                                <button
                                    onClick={() => {
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

                            {/* Branch Toggle */}
                            <button
                                onClick={() => setShowBranchTree(!showBranchTree)}
                                className={`p-1.5 rounded transition-colors ${showBranchTree ? 'bg-jarvis-blue/20 text-jarvis-blue' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                                title="Toggle Branch Tree"
                            >
                                <GitBranch size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Branch Tree Visualization */}
                {showBranchTree && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 w-full"
                    >
                        <BranchTree className="max-h-[200px]" />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;
