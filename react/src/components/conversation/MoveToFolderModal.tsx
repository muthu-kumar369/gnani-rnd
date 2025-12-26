import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { eventManager } from '../../utils/eventManager';

interface FolderItem {
    id: string;
    name: string;
    icon?: string;
}

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (folderId: string) => void;
    folders: FolderItem[];
}

const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, onClose, onMove, folders }) => {
    const { theme } = useThemeStore();
    const modalRef = useFocusTrap(isOpen);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = () => onClose();
        const cleanup = eventManager.addEventListener('keyboard:escape', handleEscape, undefined, 'MoveToFolderModal');
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
                        aria-labelledby="move-to-folder-title"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col outline-none ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/10' : 'bg-white ring-1 ring-black/5'}`}
                        tabIndex={-1}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <Folder className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                                </div>
                                <h2 id="move-to-folder-title" className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Move to Folder
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Folder List */}
                        <div className={`p-4 max-h-[60vh] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-[#1a2639]' : 'bg-white'}`}>
                            <button
                                onClick={() => onMove(null as any)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors flex items-center gap-3 group ${theme === 'dark' ? 'hover:bg-white/5 text-gray-300 hover:text-white' : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'}`}
                            >
                                <span className="text-xl">📂</span>
                                <span className="text-sm font-medium">Unorganized</span>
                            </button>
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => onMove(folder.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors flex items-center gap-3 group ${theme === 'dark' ? 'hover:bg-white/5 text-gray-300 hover:text-white' : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'}`}
                                >
                                    <span className="text-xl">{folder.icon || '📁'}</span>
                                    <span className="text-sm font-medium">{folder.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className={`p-3 border-t flex justify-end ${theme === 'dark' ? 'bg-[#1a2639] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MoveToFolderModal;
