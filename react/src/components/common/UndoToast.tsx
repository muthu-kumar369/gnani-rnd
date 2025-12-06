// src/components/common/UndoToast.tsx
import React, { useEffect, useState } from 'react';
import { Trash2, Undo, X } from 'lucide-react';
import './UndoToast.css';

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
        <div className="undo-toast">
            <div className="undo-content">
                <Trash2 size={16} />
                <span>
                    Message deleted
                    {cascadedCount > 0 && ` (${cascadedCount} response${cascadedCount > 1 ? 's' : ''} also deleted)`}
                </span>
            </div>

            <div className="undo-actions">
                <button onClick={() => onUndo(undoToken)} className="undo-button">
                    <Undo size={14} />
                    Undo ({timeLeft}s)
                </button>
                <button onClick={onDismiss} className="dismiss-button">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
