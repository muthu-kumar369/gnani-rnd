// STAGE 2: Wrapper component for UndoToast that connects to new undo stack
import React, { useEffect, useState } from 'react';
import { Undo, X } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';


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
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-canvas-panel border border-line-base rounded-lg shadow-lg min-w-[320px] max-w-[500px] animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center gap-3 text-type-primary text-sm font-medium">
                <span>{currentUndoToast.message}</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => currentUndoToast.onUndo()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gnani-primary text-type-inverse hover:bg-gnani-primary/90 rounded-md text-sm font-medium transition-all"
                >
                    <Undo size={14} className="flex-shrink-0" />
                    Undo ({timeLeft}s)
                </button>
                <button
                    onClick={() => {
                        const store = useConversationStore.getState();
                        store.dismissUndo?.();
                    }}
                    className="flex items-center justify-center p-1.5 text-type-muted hover:text-type-primary hover:bg-glass-hover rounded transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default UndoToastWrapper;
