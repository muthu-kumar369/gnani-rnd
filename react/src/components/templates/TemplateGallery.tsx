import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Code, PenTool, Search, Terminal, Cpu, Zap, Trash2, Edit2 } from 'lucide-react';
import { templateService, type Template } from '../../api/templateService';
import TemplateEditor from './TemplateEditor';
import { useUserStore } from '../../store/useUserStore';

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
    }, []);

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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-jarvis-panel border border-jarvis-border rounded-lg shadow-jarvis-glow w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-jarvis-border bg-jarvis-bg/50">
                    <div>
                        <h2 className="text-xl font-bold text-jarvis-blue tracking-wide">Select Assistant</h2>
                        <p className="text-sm text-jarvis-cyan/60">Choose a template to start a new conversation</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-jarvis-blue/10 border border-jarvis-blue/50 hover:bg-jarvis-blue/20 hover:border-jarvis-blue text-jarvis-blue rounded flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            New Template
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-jarvis-text hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-jarvis-cyan/50">
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
                                        whileHover={{ scale: 1.02, borderColor: 'rgba(0, 240, 255, 0.5)' }}
                                        onClick={() => onSelect(template)}
                                        className="group relative bg-jarvis-bg border border-jarvis-border rounded-lg p-5 cursor-pointer hover:shadow-jarvis-border-glow transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 bg-jarvis-blue/10 rounded-md text-jarvis-blue">
                                                <Icon size={24} />
                                            </div>
                                            {isOwner && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleEdit(e, template)}
                                                        className="p-1.5 hover:bg-jarvis-blue/20 rounded text-jarvis-cyan/70 hover:text-jarvis-blue"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, template._id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded text-jarvis-cyan/70 hover:text-red-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-jarvis-text mb-1 group-hover:text-jarvis-blue transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-jarvis-cyan/60 line-clamp-2">
                                            {template.description}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {template.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-jarvis-border/30 rounded-full text-jarvis-cyan/50 uppercase tracking-wider">
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
