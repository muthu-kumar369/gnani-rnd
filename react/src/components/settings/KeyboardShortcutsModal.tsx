import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Keyboard } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ShortcutRow: React.FC<{ description: string; keys: string[] }> = ({ description, keys }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-gray-300 text-sm">{description}</span>
        <div className="flex gap-2">
            {keys.map((key, i) => (
                <kbd key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-200 font-mono min-w-[24px] text-center border border-white/10 shadow-sm">
                    {key}
                </kbd>
            ))}
        </div>
    </div>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="shortcuts-modal-title"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full max-w-md bg-gray-900 border border-jarvis-border/30 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Keyboard className="w-5 h-5 text-jarvis-cyan" />
                                <h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-black/20">
                            <ShortcutRow description="New Conversation" keys={['Ctrl', 'N']} />
                            <ShortcutRow description="Search Conversations" keys={['Ctrl', 'K']} />
                            <ShortcutRow description="Send Message" keys={['Ctrl', 'Enter']} />
                            <ShortcutRow description="Show Shortcuts" keys={['Ctrl', '/']} />
                            <ShortcutRow description="Close Modal" keys={['Esc']} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default KeyboardShortcutsModal;
