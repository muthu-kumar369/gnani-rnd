import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { eventManager } from '../../utils/eventManager';
import { useThemeStore } from '../../store/themeStore';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ShortcutGroup: React.FC<{ title: string; children: React.ReactNode; theme: string }> = ({ title, children, theme }) => (
    <div className="mb-6 last:mb-0">
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{title}</h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const ShortcutRow: React.FC<{ description: string; keys: string[]; theme: string }> = ({ description, keys, theme }) => (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors group ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
        <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-900'}`}>{description}</span>
        <div className="flex gap-1.5">
            {keys.map((key, i) => (
                <kbd
                    key={i}
                    className={`px-2 py-1 min-w-[24px] rounded-md text-[11px] font-mono shadow-sm border flex items-center justify-center transition-all ${theme === 'dark'
                        ? 'bg-white/10 border-white/5 text-gray-300 group-hover:bg-white/15 group-hover:border-white/10'
                        : 'bg-gray-100 border-gray-200 text-gray-600 group-hover:bg-white group-hover:border-gray-300'
                        }`}
                >
                    {key}
                </kbd>
            ))}
        </div>
    </div>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap(isOpen);
    const { theme } = useThemeStore();

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
                        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] outline-none ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}
                        tabIndex={-1}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-5 border-b sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#1a2639] border-white/5' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <Keyboard className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <h2 id="shortcuts-modal-title" className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Keyboard Shortcuts</h2>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Essential keys to navigate faster</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${theme === 'dark' ? 'bg-[#1a2639]' : 'bg-white'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <ShortcutGroup title="General" theme={theme}>
                                    <ShortcutRow description="Search Chats" keys={['Ctrl', 'K']} theme={theme} />
                                    <ShortcutRow description="New Chat" keys={['Ctrl', 'N']} theme={theme} />
                                    <ShortcutRow description="Toggle Sidebar" keys={['Ctrl', 'B']} theme={theme} />
                                    <ShortcutRow description="Open Workspace" keys={['Alt', 'W']} theme={theme} />
                                    <ShortcutRow description="Show Shortcuts" keys={['Ctrl', '/']} theme={theme} />
                                </ShortcutGroup>

                                <ShortcutGroup title="Chat" theme={theme}>
                                    <ShortcutRow description="Voice Mode" keys={['Ctrl', 'M']} theme={theme} />
                                    <ShortcutRow description="Focus Input" keys={['Shift', 'Esc']} theme={theme} />
                                </ShortcutGroup>

                                <ShortcutGroup title="Settings" theme={theme}>
                                    <ShortcutRow description="Open Settings" keys={['Ctrl', ',']} theme={theme} />
                                </ShortcutGroup>

                                <ShortcutGroup title="System" theme={theme}>
                                    <ShortcutRow description="Close Modal" keys={['Esc']} theme={theme} />
                                </ShortcutGroup>
                            </div>
                        </div>

                        {/* Footer Hint */}
                        <div className={`p-3 text-center border-t ${theme === 'dark' ? 'bg-[#1a2639] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                Press <kbd className={`font-sans font-semibold px-1 py-0.5 rounded mx-0.5 ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'}`}>Esc</kbd> to close
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default KeyboardShortcutsModal;
