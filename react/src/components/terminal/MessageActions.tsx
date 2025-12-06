import React from 'react';
import { Copy, RefreshCw, Edit2, Trash2 } from 'lucide-react';

interface MessageActionsProps {
    role: 'user' | 'assistant' | 'system';
    onCopy: () => void;
    onRegenerate?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
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
    isVisible = false,
    isRegenerating = false,
    isDeleting = false
}) => {
    // Don't show actions for system messages
    if (role === 'system') return null;

    return (
        <div className={`message-actions ${isVisible ? 'visible' : ''}`}>
            <button onClick={onCopy} title="Copy message">
                <Copy size={14} />
            </button>

            {role === 'assistant' && onRegenerate && (
                <button
                    onClick={onRegenerate}
                    title="Regenerate response"
                    disabled={isRegenerating}
                    className={isRegenerating ? 'animate-spin' : ''}
                >
                    <RefreshCw size={14} />
                </button>
            )}

            {role === 'user' && onEdit && (
                <button onClick={onEdit} title="Edit message">
                    <Edit2 size={14} />
                </button>
            )}

            {/* RESTRICTION: Only show delete for user messages */}
            {role === 'user' && onDelete && (
                <button
                    onClick={onDelete}
                    title="Delete message"
                    className="hover:text-red-400"
                    disabled={isDeleting}
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export default MessageActions;
