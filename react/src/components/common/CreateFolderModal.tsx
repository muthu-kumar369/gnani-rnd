import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFolderStore } from '../../store/useFolderStore';
import { eventManager } from '../../utils/eventManager';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FOLDER_COLORS = [
    { name: 'Cyan', value: '#22d3ee' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
];

const FOLDER_ICONS = ['📁', '📂', '🗂️', '📋', '📊', '💼', '🎯', '⭐', '🔥', '💡'];

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (!isOpen) return;
        const cleanup = eventManager.addEventListener('keyboard:escape', onClose, undefined, 'CreateFolderModal');
        return cleanup;
    }, [isOpen, onClose]);

    const { createFolder } = useFolderStore();
    const [name, setName] = useState('');
    const [color, setColor] = useState(FOLDER_COLORS[0].value);
    const [icon, setIcon] = useState(FOLDER_ICONS[0]);

    const handleCreate = () => {
        if (!name.trim()) return;

        createFolder(name.trim(), color, icon);
        setName('');
        setColor(FOLDER_COLORS[0].value);
        setIcon(FOLDER_ICONS[0]);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FolderPlus size={20} className="text-cyan-400" />
                            <h3 className="text-lg font-semibold text-cyan-400">Create Folder</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-cyan-500/60 hover:text-cyan-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Folder Name */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Folder Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Work Projects, Personal"
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-500"
                                autoFocus
                            />
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Icon
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FOLDER_ICONS.map((iconOption) => (
                                    <button
                                        key={iconOption}
                                        onClick={() => setIcon(iconOption)}
                                        className={`text-2xl p-2 rounded border transition-colors ${icon === iconOption
                                            ? 'border-cyan-500 bg-cyan-500/20'
                                            : 'border-cyan-500/30 hover:border-cyan-500/50'
                                            }`}
                                    >
                                        {iconOption}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FOLDER_COLORS.map((colorOption) => (
                                    <button
                                        key={colorOption.value}
                                        onClick={() => setColor(colorOption.value)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${color === colorOption.value
                                            ? 'border-white scale-110'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: colorOption.value }}
                                        title={colorOption.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={!name.trim()}
                                className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={16} className="inline mr-2" />
                                Create Folder
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default CreateFolderModal;
