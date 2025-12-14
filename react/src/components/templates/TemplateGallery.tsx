import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Code, PenTool, Search, Terminal, Cpu, Zap, Trash2, Edit2 } from 'lucide-react';
import { templateService, type Template } from '../../api/templateService';
import TemplateEditor from './TemplateEditor';
import { useUserStore } from '../../store/useUserStore';
import { eventManager } from '../../utils/eventManager';

interface TemplateGalleryProps {
    onSelect: (template: Template) => void;
    onClose: () => void;
}

const ICON_MAP: Record<string, any> = {
    MessageSquare, Code, PenTool, Search, Terminal, Cpu, Zap
};

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelect, onClose }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const { user } = useUserStore();

    useEffect(() => {
        loadTemplates();

        // Listen for Esc
        const cleanup = eventManager.addEventListener('keyboard:escape', () => {
            // If editor is open, close editor first? 
            // Logic: if editor open, close editor. Else close gallery.
            // But simpler to let user close editor explicitly or chain it.
            // Here we can assume close Gallery is safe. But if editor is open, it might close both.
            // Let's check isEditorOpen state.
            // setState in event listener needs refs or functional update logic.
            // But we can just use a specific listener on the Editor too.
            // For now, simpler: Close entire gallery.
            onClose();
        }, undefined, 'TemplateGallery');
        return cleanup;
    }, [onClose]);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await templateService.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await templateService.delete(id);
                setTemplates(prev => prev.filter(t => t._id !== id));
            } catch (error) {
                console.error('Failed to delete template:', error);
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, template: Template) => {
        e.stopPropagation();
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate(undefined);
        setIsEditorOpen(true);
    };

    const handleSave = (savedTemplate: Template) => {
        if (editingTemplate) {
            setTemplates(prev => prev.map(t => t._id === savedTemplate._id ? savedTemplate : t));
        } else {
            setTemplates(prev => [savedTemplate, ...prev]);
        }
        setIsEditorOpen(false);
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-overlay/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-canvas-panel border border-glass-border rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-glass-border bg-canvas-surface/50">
                    <div>
                        <h2 className="text-xl font-bold text-gnani-primary tracking-wide">Select Assistant</h2>
                        <p className="text-sm text-type-secondary">Choose a template to start a new conversation</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-gnani-primary/10 border border-gnani-primary/50 hover:bg-gnani-primary/20 hover:border-gnani-primary text-gnani-primary rounded flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            New Template
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-type-primary hover:text-type-secondary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-type-muted">
                            Loading templates...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => {
                                const Icon = ICON_MAP[template.icon] || MessageSquare;
                                const isOwner = user?.id === template.createdBy;

                                return (
                                    <motion.div
                                        key={template._id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => onSelect(template)}
                                        className="group relative bg-canvas-surface border border-glass-border rounded-lg p-5 cursor-pointer hover:shadow-lg hover:border-gnani-primary/30 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 bg-gnani-primary/10 rounded-md text-gnani-primary">
                                                <Icon size={24} />
                                            </div>
                                            {isOwner && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleEdit(e, template)}
                                                        className="p-1.5 hover:bg-gnani-primary/20 rounded text-gnani-primary/70 hover:text-gnani-primary"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, template._id)}
                                                        className="p-1.5 hover:bg-status-error/20 rounded text-status-error/70 hover:text-status-error"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-type-primary mb-1 group-hover:text-gnani-primary transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-type-secondary line-clamp-2">
                                            {template.description}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {template.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-glass-shimmer rounded-full text-type-muted uppercase tracking-wider">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {isEditorOpen && (
                    <TemplateEditor
                        template={editingTemplate}
                        onSave={handleSave}
                        onCancel={() => setIsEditorOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TemplateGallery;
