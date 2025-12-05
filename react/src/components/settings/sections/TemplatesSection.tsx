import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit2, Trash2, Tag } from 'lucide-react';
import { templateService, type Template } from '../../../api/templateService';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import SectionHeader from '../SectionHeader';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Loader from '../../ui/Loader';
import TemplateEditor from '../../templates/TemplateEditor';

const TemplatesSection: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const { user } = useUserStore();
    const { addToast } = useToast();

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
            addToast('Failed to load templates', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await templateService.delete(id);
                setTemplates(prev => prev.filter(t => t._id !== id));
                addToast('Template deleted successfully', 'success');
            } catch (error) {
                console.error('Failed to delete template:', error);
                addToast('Failed to delete template', 'error');
            }
        }
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate(undefined);
        setIsEditorOpen(true);
    };

    const handleSaveTemplate = async () => {
        await loadTemplates();
        setIsEditorOpen(false);
        addToast('Template saved successfully', 'success');
    };

    if (isLoading) {
        return (
            <div className="flex w-full items-center justify-center p-8" style={{ height: 'calc(100vh - 250px)' }}>
                <Loader text="Loading templates..." />
            </div>
        );
    }

    return (
        <div>
            <SectionHeader
                title="Conversation Templates"
                description="Create and manage templates for different conversation types. Templates help you start conversations with pre-configured system prompts."
            />

            <div className="space-y-6">
                {/* Create New Template Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleCreate}
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                    >
                        New Template
                    </Button>
                </div>

                {/* Templates List */}
                {templates.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-cyan-500/30 mb-4" />
                            <h3 className="text-lg font-medium text-cyan-100 mb-2">No Templates Yet</h3>
                            <p className="text-cyan-400/60 text-sm mb-6">
                                Create your first template to get started with customized conversations
                            </p>
                            <Button
                                onClick={handleCreate}
                                variant="primary"
                                leftIcon={<Plus size={16} />}
                            >
                                Create Your First Template
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => {
                            const isOwner = template.createdBy === user?.id;
                            const isSystemTemplate = template.createdBy === 'system';

                            return (
                                <Card key={template._id} className="hover:border-cyan-500/40 transition-colors">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-cyan-100 truncate">
                                                        {template.name}
                                                    </h3>
                                                    {isSystemTemplate && (
                                                        <span className="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-purple-300 text-[9px] uppercase tracking-wider">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <p className="text-xs text-cyan-400/60 mt-1 line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions - Only show for user's own templates */}
                                            {isOwner && !isSystemTemplate && (
                                                <div className="flex gap-1 ml-2">
                                                    <button
                                                        onClick={() => handleEdit(template)}
                                                        className="p-1.5 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                                                        title="Edit template"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template._id)}
                                                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                        title="Delete template"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {template.tags && template.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {template.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 text-[10px] uppercase tracking-wider"
                                                    >
                                                        <Tag size={10} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* System Prompt Preview */}
                                        <div className="pt-2 border-t border-cyan-500/10">
                                            <p className="text-[10px] uppercase tracking-wider text-cyan-500/50 mb-1">
                                                System Prompt
                                            </p>
                                            <p className="text-xs text-cyan-400/70 line-clamp-3 font-mono">
                                                {template.systemPrompt}
                                            </p>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/10">
                                            <span className="text-[10px] text-cyan-500/40">
                                                {isSystemTemplate ? 'System template' : isOwner ? 'Your template' : 'Shared template'}
                                            </span>
                                            {template.createdAt && (
                                                <span className="text-[10px] text-cyan-500/40">
                                                    {new Date(template.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Template Editor Modal */}
            {isEditorOpen && (
                <TemplateEditor
                    template={editingTemplate}
                    onSave={handleSaveTemplate}
                    onCancel={() => setIsEditorOpen(false)}
                />
            )}
        </div>
    );
};

export default TemplatesSection;
