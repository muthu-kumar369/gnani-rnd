import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Code, PenTool, Search, MessageSquare, Terminal, Cpu, Zap } from 'lucide-react';
import { templateService, type Template } from '../../api/templateService';
import { useThemeStore } from '../../store/themeStore';

interface TemplateEditorProps {
    template?: Template;
    onSave: (template: Template) => void;
    onCancel: () => void;
}

const ICONS = [
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'Code', icon: Code },
    { name: 'PenTool', icon: PenTool },
    { name: 'Search', icon: Search },
    { name: 'Terminal', icon: Terminal },
    { name: 'Cpu', icon: Cpu },
    { name: 'Zap', icon: Zap },
];

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
    const [name, setName] = useState(template?.name || '');
    const { theme } = useThemeStore();
    const [description, setDescription] = useState(template?.description || '');
    const [systemPrompt, setSystemPrompt] = useState(template?.systemPrompt || '');
    const [icon, setIcon] = useState(template?.icon || 'MessageSquare');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const data = { name, description, systemPrompt, icon };
            let savedTemplate: Template;

            if (template) {
                savedTemplate = await templateService.update(template._id, data);
            } else {
                savedTemplate = await templateService.create(data);
            }

            onSave(savedTemplate);
        } catch (err: any) {
            setError(err.message || 'Failed to save template');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-white/10 ${theme === 'dark' ? 'bg-[#1a2639]' : 'bg-white'}`}
            >
                <div className={`flex items-center justify-between p-6 pb-4 z-10 relative ${theme === 'dark' ? 'shadow-sm' : 'shadow-sm'}`}>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {template ? 'Edit Template' : 'Create New Template'}
                    </h2>
                    <button onClick={onCancel} className="text-type-muted hover:text-gnani-primary transition-colors p-1 rounded-full hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-wider text-gnani-primary/70 uppercase pl-1 block">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full rounded-lg p-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${theme === 'dark' ? 'bg-black/20 text-white placeholder-white/20' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                                placeholder="e.g., Python Expert"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold tracking-wider text-gnani-primary/70 uppercase pl-1 block">Icon</label>
                            <div className="flex gap-2 flex-wrap">
                                {ICONS.map((item) => {
                                    const IconComponent = item.icon;
                                    const isSelected = icon === item.name;
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setIcon(item.name)}
                                            className={`p-2 rounded-lg transition-all duration-300 ${isSelected
                                                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 ring-1 ring-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                                                : `text-type-muted hover:text-type-primary ${theme === 'dark' ? 'bg-black/20 hover:bg-black/40' : 'bg-gray-100 hover:bg-gray-200'}`
                                                }`}
                                        >
                                            <IconComponent size={18} strokeWidth={isSelected ? 2 : 1.5} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-wider text-gnani-primary/70 uppercase pl-1 block">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`w-full rounded-lg p-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${theme === 'dark' ? 'bg-black/20 text-white placeholder-white/20' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                            placeholder="Brief description of what this assistant does..."
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold tracking-wider text-gnani-primary/70 uppercase pl-1 block">System Prompt</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className={`w-full h-40 rounded-lg p-3 text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none custom-scrollbar ${theme === 'dark' ? 'bg-black/20 text-white placeholder-white/20' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                            placeholder="You are a helpful AI assistant..."
                            required
                        />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-300 ${theme === 'dark' ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20' : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50'
                                }`}
                        >
                            <Save size={16} className={isSubmitting ? 'animate-spin' : ''} />
                            {isSubmitting ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default TemplateEditor;
