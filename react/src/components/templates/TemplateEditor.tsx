import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Code, PenTool, Search, MessageSquare, Terminal, Cpu, Zap } from 'lucide-react';
import { templateService, type Template } from '../../api/templateService';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-canvas-panel border border-glass-border rounded-lg shadow-xl drop-shadow-glow w-full max-w-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-glass-border bg-canvas/50">
                    <h2 className="text-lg font-semibold text-gnani-primary">
                        {template ? 'Edit Template' : 'Create New Template'}
                    </h2>
                    <button onClick={onCancel} className="text-type-primary hover:text-gnani-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-status-error/10 border border-status-error/50 text-status-error rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-type-muted uppercase">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-canvas-surface border border-glass-border rounded p-2 text-type-primary focus:border-gnani-primary focus:outline-none transition-colors"
                                placeholder="e.g., Python Expert"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-type-muted uppercase">Icon</label>
                            <div className="flex gap-2 flex-wrap">
                                {ICONS.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setIcon(item.name)}
                                            className={`p-2 rounded border transition-all ${icon === item.name
                                                ? 'bg-gnani-primary/20 border-gnani-primary text-gnani-primary'
                                                : 'bg-canvas-surface border-glass-border text-type-primary hover:border-gnani-primary/50'
                                                }`}
                                        >
                                            <IconComponent size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-type-muted uppercase">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-canvas-surface border border-glass-border rounded p-2 text-type-primary focus:border-gnani-primary focus:outline-none transition-colors"
                            placeholder="Brief description of what this assistant does..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-type-muted uppercase">System Prompt</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full h-40 bg-canvas-surface border border-glass-border rounded p-2 text-type-primary focus:border-gnani-primary focus:outline-none transition-colors font-mono text-sm resize-none"
                            placeholder="You are a helpful AI assistant..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-type-primary hover:text-type-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gnani-primary/20 border border-gnani-primary text-gnani-primary hover:bg-gnani-primary/30 rounded flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            {isSubmitting ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default TemplateEditor;
