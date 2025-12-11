// STAGE 2: Wrapper component for UndoToast that connects to new undo stack
import React, { useEffect, useState } from 'react';
import { Undo, X } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';
import './UndoToast.css';

export const UndoToastWrapper: React.FC = () => {
    const { currentUndoToast } = useConversationStore();
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (!currentUndoToast) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((currentUndoToast.expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                const store = useConversationStore.getState();
                store.dismissUndo?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentUndoToast]);

    if (!currentUndoToast) return null;

    return (
        <div className="undo-toast">
            <div className="undo-content">
                <span>{currentUndoToast.message}</span>
            </div>

            <div className="undo-actions">
                <button onClick={() => currentUndoToast.onUndo()} className="undo-button">
                    <Undo size={14} />
                    Undo ({timeLeft}s)
                </button>
                <button onClick={() => {
                    const store = useConversationStore.getState();
                    store.dismissUndo?.();
                }} className="dismiss-button">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default UndoToastWrapper;
