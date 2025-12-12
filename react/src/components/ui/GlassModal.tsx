import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    className?: string;
}

const GlassModal: React.FC<GlassModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'max-w-md',
    className = ''
}) => {
    // Close on escape
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Ensure portal root exists
    React.useEffect(() => {
        let portalRoot = document.getElementById('modal-root');
        if (!portalRoot) {
            portalRoot = document.createElement('div');
            portalRoot.id = 'modal-root';
            document.body.appendChild(portalRoot);
        }
    }, []);

    const portalRoot = document.getElementById('modal-root') || document.body;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`bg-[#0a0a0add] border border-white/10 rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden ${className}`}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                                {title ? (
                                    <h3 className="text-lg font-semibold text-white tracking-wide">
                                        {title}
                                    </h3>
                                ) : <div />}
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 text-gray-300">
                                {children}
                            </div>

                            {/* Footer */}
                            {footer && (
                                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
                                    {footer}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        portalRoot
    );
};

export default GlassModal;
