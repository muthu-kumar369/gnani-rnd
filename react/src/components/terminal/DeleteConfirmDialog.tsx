import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { eventManager } from '../../utils/eventManager';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    messagePreview?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    messagePreview
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'DeleteConfirmDialog');
        return cleanup;
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-md bg-canvas-panel border border-status-error/30 rounded-lg shadow-glass overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-status-error/20 bg-status-error/10">
                            <div className="p-2 bg-status-error/10 rounded-full text-status-error">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-status-error font-semibold text-lg">Delete Message?</h3>
                        </div>

                        <div className="p-6">
                            <p className="text-type-secondary text-sm mb-4">
                                Are you sure you want to delete this message? This action cannot be undone and will remove all subsequent messages in this conversation branch.
                            </p>

                            {messagePreview && (
                                <div className="p-3 bg-black/40 border border-gray-700 rounded text-xs text-gray-400 font-mono italic truncate">
                                    "{messagePreview.substring(0, 100)}{messagePreview.length > 100 ? '...' : ''}"
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 bg-canvas-surface/50 border-t border-line-base">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-type-muted hover:text-type-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="px-4 py-2 bg-status-error hover:bg-status-error/90 text-type-inverse text-sm font-medium rounded transition-colors shadow-lg shadow-status-error/20"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmDialog;
