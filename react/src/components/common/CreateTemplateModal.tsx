import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateStore } from '../../store/useTemplateStore';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose }) => {
    const { addCustomTemplate } = useTemplateStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [icon, setIcon] = useState('✨');
    const [category, setCategory] = useState<'productivity' | 'creative' | 'learning' | 'general'>('general');

    const handleSave = () => {
        if (!name.trim() || !systemPrompt.trim()) {
            return;
        }

        addCustomTemplate({
            name: name.trim(),
            description: description.trim(),
            systemPrompt: systemPrompt.trim(),
            icon,
            category,
        });

        // Reset form
        setName('');
        setDescription('');
        setSystemPrompt('');
        setIcon('✨');
        setCategory('general');
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                    className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-cyan-400" />
                            <h3 className="text-lg font-semibold text-cyan-400">Create Custom Template</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-cyan-500/60 hover:text-cyan-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Template Name */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Template Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Email Writer, Debug Helper"
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of what this template does"
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Icon */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Icon (Emoji)
                            </label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="✨"
                                maxLength={2}
                                className="w-20 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-center focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="general">General</option>
                                <option value="productivity">Productivity</option>
                                <option value="creative">Creative</option>
                                <option value="learning">Learning</option>
                            </select>
                        </div>

                        {/* System Prompt */}
                        <div>
                            <label className="block text-sm text-cyan-500/80 mb-2">
                                System Prompt *
                            </label>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="You are a helpful assistant that..."
                                rows={6}
                                className="w-full px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-500 resize-none"
                            />
                            <p className="text-xs text-cyan-500/60 mt-1">
                                This defines how the AI should behave for this template
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={!name.trim() || !systemPrompt.trim()}
                                className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={16} className="inline mr-2" />
                                Create Template
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
        </AnimatePresence>
    );
};

export default CreateTemplateModal;
