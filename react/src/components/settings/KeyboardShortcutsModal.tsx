import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command, Mic, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { eventManager } from '../../utils/eventManager';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ShortcutGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 last:mb-0">
        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">{title}</h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const ShortcutRow: React.FC<{ description: string; keys: string[] }> = ({ description, keys }) => (
    <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group">
        <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">{description}</span>
        <div className="flex gap-1.5">
            {keys.map((key, i) => (
                <kbd key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] text-gray-400 font-mono shadow-sm min-w-[24px] text-center flex items-center justify-center group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white transition-all">
                    {key}
                </kbd>
            ))}
        </div>
    </div>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen);

    // Listen for Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = () => onClose();
        const cleanup = eventManager.addEventListener('keyboard:escape', handleEscape, undefined, 'KeyboardShortcutsModal');
        return cleanup;
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="shortcuts-modal-title"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-lg bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        style={{ boxShadow: '0 0 50px -12px rgba(0,0,0,0.5)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/20">
                                    <Keyboard className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 id="shortcuts-modal-title" className="text-white font-semibold text-lg">Keyboard Shortcuts</h2>
                                    <p className="text-gray-500 text-xs">Essential keys to navigate faster</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <ShortcutGroup title="General">
                                    <ShortcutRow description="Search Chats" keys={['Ctrl', 'K']} />
                                    <ShortcutRow description="New Chat" keys={['Ctrl', 'N']} />
                                    <ShortcutRow description="Toggle Sidebar" keys={['Ctrl', 'B']} />
                                    <ShortcutRow description="Open Workspace" keys={['Alt', 'W']} />
                                    <ShortcutRow description="Show Shortcuts" keys={['Ctrl', '/']} />
                                </ShortcutGroup>

                                <ShortcutGroup title="Chat">
                                    <ShortcutRow description="Voice Mode" keys={['Ctrl', 'M']} />
                                    <ShortcutRow description="Focus Input" keys={['Shift', 'Esc']} />
                                </ShortcutGroup>

                                <ShortcutGroup title="Settings">
                                    <ShortcutRow description="Open Settings" keys={['Ctrl', ',']} />
                                </ShortcutGroup>

                                <ShortcutGroup title="System">
                                    <ShortcutRow description="Close Modal" keys={['Esc']} />
                                </ShortcutGroup>
                            </div>
                        </div>

                        {/* Footer Hint */}
                        <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                            <p className="text-[10px] text-gray-500">Press <kbd className="font-sans font-semibold text-gray-400">Esc</kbd> to close</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default KeyboardShortcutsModal;
