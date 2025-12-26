import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit2, Trash2, Tag } from 'lucide-react';
import { templateService, type Template } from '../../../api/templateService';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';
import Loader from '../../ui/Loader';
import TemplateEditor from '../../templates/TemplateEditor';
import ConfirmationModal from '../../ui/ConfirmationModal';
import { useThemeStore } from '../../../store/themeStore';

const TemplatesSection: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const { user } = useUserStore();
    const { theme } = useThemeStore();
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

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            await templateService.delete(deleteId);
            setTemplates(prev => prev.filter(t => t._id !== deleteId));
            addToast('Template deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete template:', error);
            addToast('Failed to delete template', 'error');
        } finally {
            setDeleteId(null);
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
            <div className="p-6 space-y-6">
                {/* Actions row */}
                <div className={`flex justify-between items-center p-3 rounded-xl backdrop-blur-sm ${theme === 'dark' ? 'bg-black/20 shadow-sm ring-1 ring-white/5' : 'bg-white shadow-sm ring-1 ring-black/5'}`}>
                    <div className="text-xs text-gnani-primary/60 font-medium tracking-wide uppercase px-1">
                        {templates.length} Templates
                    </div>
                    <Button
                        onClick={handleCreate}
                        variant="primary"
                        size="sm"
                        className={`font-semibold transition-all duration-300 px-4 border-none ${theme === 'dark'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                            }`}
                        leftIcon={<Plus size={16} />}
                    >
                        New Template
                    </Button>
                </div>

                {/* Templates List */}
                {templates.length === 0 ? (
                    <div className={`relative group overflow-hidden rounded-xl p-12 text-center transition-all duration-500 ${theme === 'dark' ? 'bg-[#1a2639] ring-1 ring-white/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' : 'bg-white ring-1 ring-black/5 shadow-sm'}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-gnani-primary/0 via-transparent to-gnani-primary/0 group-hover:from-gnani-primary/5 group-hover:to-gnani-secondary/5 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-gnani-primary/10 to-gnani-secondary/10 flex items-center justify-center mb-4 ring-1 ring-glass-border group-hover:ring-gnani-primary/30 transition-all duration-500">
                                <FileText size={32} className="text-gnani-primary/50 group-hover:text-gnani-primary group-hover:scale-110 transition-all duration-500" />
                            </div>
                            <h3 className="text-base font-bold text-type-primary mb-2">No Templates Yet</h3>
                            <p className="text-xs text-type-muted max-w-sm mx-auto mb-6">
                                Create your first template to define custom System Prompts and streamline your conversations.
                            </p>
                            <Button
                                onClick={handleCreate}
                                variant="outline"
                                size="sm"
                                className="border-gnani-primary/30 text-gnani-primary hover:bg-gnani-primary/10 hover:border-gnani-primary/50"
                                leftIcon={<Plus size={14} />}
                            >
                                Create Template
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => {
                            const isOwner = template.createdBy === user?.id;
                            const isSystemTemplate = template.createdBy === 'system';

                            return (
                                <div
                                    key={template._id}
                                    className={`group relative rounded-xl p-5 transition-all duration-300 flex flex-col h-full ${theme === 'dark'
                                        ? 'bg-[#1a2639] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] ring-1 ring-white/5 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] hover:ring-gnani-primary/20'
                                        : 'bg-white shadow-sm ring-1 ring-black/5 hover:shadow-xl hover:ring-gnani-primary/20'
                                        }`}
                                >
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-gnani-primary/0 via-transparent to-gnani-secondary/0 group-hover:from-gnani-primary/5 group-hover:to-gnani-secondary/5 rounded-xl transition-all duration-500" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-type-primary group-hover:text-gnani-primary transition-colors truncate">
                                                        {template.name}
                                                    </h3>
                                                    {isSystemTemplate && (
                                                        <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <p className="text-xs text-type-secondary line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {isOwner && !isSystemTemplate && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-1 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
                                                        className="p-1.5 text-gnani-primary/40 hover:text-gnani-primary hover:bg-gnani-primary/10 rounded-lg transition-colors border border-transparent hover:border-gnani-primary/20"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(template._id); }}
                                                        className="p-1.5 text-status-error/40 hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors border border-transparent hover:border-status-error/20"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {template.tags && template.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {template.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-canvas-surface border border-line-base rounded text-type-secondary text-[10px] font-medium tracking-wide group-hover:border-gnani-primary/20 group-hover:bg-gnani-primary/5 transition-colors"
                                                    >
                                                        <Tag size={9} className="text-gnani-primary/50" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* System Prompt Preview */}
                                        <div className="mt-auto pt-4">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-gnani-primary/60 mb-2 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-gnani-primary/40"></span>
                                                System Prompt
                                            </p>
                                            <div className={`text-[10px] text-type-secondary font-mono p-3 rounded-lg max-w-full break-all leading-relaxed max-h-24 overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>
                                                {template.systemPrompt}
                                            </div>
                                            {/* Date */}
                                            {template.createdAt && (
                                                <div className="mt-3 text-[9px] text-type-muted text-right font-mono opacity-60">
                                                    {isSystemTemplate ? 'System' : isOwner ? 'You' : 'Shared'} &nbsp;|&nbsp; {new Date(template.createdAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
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

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Template"
                message="Are you sure you want to delete this template? This action cannot be undone."
                confirmLabel="Delete Template"
                isDangerous={true}
            />
        </div>
    );
};

export default TemplatesSection;
