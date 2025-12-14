// src/components/common/UndoToast.tsx
import React, { useEffect, useState } from 'react';
import { Trash2, Undo, X } from 'lucide-react';

interface UndoToastProps {
    undoToken: string;
    messageId: string;
    expiresAt: Date;
    cascadedCount?: number;
    onUndo: (token: string) => void;
    onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
    undoToken,
    expiresAt,
    cascadedCount = 0,
    onUndo,
    onDismiss
}) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                onDismiss();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onDismiss]);

    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-canvas-panel border border-line-base rounded-lg shadow-lg min-w-[320px] max-w-[500px] animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center gap-3 text-type-primary text-sm">
                <Trash2 size={16} className="text-status-error flex-shrink-0" />
                <span>
                    Message deleted
                    {cascadedCount > 0 && ` (${cascadedCount} response${cascadedCount > 1 ? 's' : ''} also deleted)`}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onUndo(undoToken)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gnani-primary text-type-inverse hover:bg-gnani-primary/90 rounded-md text-sm font-medium transition-all"
                >
                    <Undo size={14} className="flex-shrink-0" />
                    Undo ({timeLeft}s)
                </button>
                <button
                    onClick={onDismiss}
                    className="flex items-center justify-center p-1.5 text-type-muted hover:text-type-primary hover:bg-glass-hover rounded transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
