// src/components/common/ConfirmDeleteModal.tsx
import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import { eventManager } from '../../utils/eventManager';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    cascadeCount?: number;
    isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    cascadeCount = 0,
    isDeleting = false
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const cleanup = eventManager.addEventListener('keyboard:escape', onCancel, undefined, 'ConfirmDeleteModal');
        return cleanup;
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4" onClick={handleBackdropClick}>
            <div className="w-full max-w-md bg-canvas-panel border border-line-base rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-line-base bg-canvas-surface/30">
                    <div className="p-2 bg-status-warning/10 rounded-lg">
                        <AlertTriangle size={24} className="text-status-warning" />
                    </div>
                    <button onClick={onCancel} className="p-2 text-type-muted hover:text-type-primary hover:bg-glass-hover rounded-lg transition-all" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold text-type-primary mb-2">Delete Message?</h3>
                    <p className="text-sm text-type-secondary mb-4 leading-relaxed">
                        This action will delete your message
                        {cascadeCount > 0 && (
                            <strong className="text-type-primary font-medium"> and {cascadeCount} response{cascadeCount > 1 ? 's' : ''}</strong>
                        )}.
                    </p>
                    <p className="text-xs text-type-muted flex items-center gap-2 bg-canvas-surface/50 p-3 rounded-lg border border-line-base">
                        You can undo this action within 30 minutes.
                    </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-canvas-surface/20 border-t border-line-base">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-type-secondary hover:text-type-primary hover:bg-glass-hover rounded-lg transition-all border border-transparent hover:border-line-base"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-type-inverse bg-status-error hover:bg-status-error/90 rounded-lg shadow-lg shadow-status-error/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
