import React from 'react';
import { Copy, RefreshCw, Edit2, Trash2, Share2, CornerDownRight } from 'lucide-react';
import GlassTooltip from '../ui/GlassTooltip';

interface MessageActionsProps {
    role: 'user' | 'assistant' | 'system';
    onCopy: () => void;
    onRegenerate?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onShare?: () => void; // NEW
    onContinue?: () => void; // NEW
    isVisible?: boolean;
    isRegenerating?: boolean;
    isDeleting?: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
    role,
    onCopy,
    onRegenerate,
    onEdit,
    onDelete,
    onShare, // NEW
    onContinue, // NEW
    isVisible = false,
    isRegenerating = false,
    isDeleting = false
}) => {
    // Don't show actions for system messages
    if (role === 'system') return null;

    return (
        <div className={`message-actions ${isVisible ? 'visible' : ''}`}>
            <GlassTooltip content="Copy message">
                <button onClick={onCopy}>
                    <Copy size={14} />
                </button>
            </GlassTooltip>

            {role === 'assistant' && onRegenerate && (
                <GlassTooltip content="Regenerate response">
                    <button
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className={isRegenerating ? 'animate-spin' : ''}
                    >
                        <RefreshCw size={14} />
                    </button>
                </GlassTooltip>
            )}

            {role === 'user' && onEdit && (
                <GlassTooltip content="Edit message">
                    <button onClick={onEdit}>
                        <Edit2 size={14} />
                    </button>
                </GlassTooltip>
            )}

            {/* RESTRICTION: Only show delete for user messages */}
            {role === 'user' && onDelete && (
                <GlassTooltip content="Delete message">
                    <button
                        onClick={onDelete}
                        className="hover:text-red-400"
                        disabled={isDeleting}
                    >
                        <Trash2 size={14} />
                    </button>
                </GlassTooltip>
            )}

            {/* Share button - available for all messages */}
            {onShare && (
                <GlassTooltip content="Share message">
                    <button onClick={onShare}>
                        <Share2 size={14} />
                    </button>
                </GlassTooltip>
            )}

            {/* Continue button - only for assistant messages */}
            {role === 'assistant' && onContinue && (
                <GlassTooltip content="Continue conversation">
                    <button onClick={onContinue}>
                        <CornerDownRight size={14} />
                    </button>
                </GlassTooltip>
            )}
        </div>
    );
};

export default MessageActions;
