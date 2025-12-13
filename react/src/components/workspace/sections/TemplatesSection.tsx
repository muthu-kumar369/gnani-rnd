import React, { useState, useEffect } from 'react';
import { Plus, FileText, Edit2, Trash2, Tag } from 'lucide-react';
import { templateService, type Template } from '../../../api/templateService';
import { useUserStore } from '../../../store/useUserStore';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';
import Loader from '../../ui/Loader';
import TemplateEditor from '../../templates/TemplateEditor';
import ConfirmationModal from '../../ui/ConfirmationModal';

const TemplatesSection: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);
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
                <div className="flex justify-between items-center bg-[#0a0a15]/50 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-xs text-cyan-400/50 font-medium tracking-wide uppercase px-1">
                        {templates.length} Templates
                    </div>
                    <Button
                        onClick={handleCreate}
                        variant="primary"
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 px-4"
                        leftIcon={<Plus size={16} />}
                    >
                        New Template
                    </Button>
                </div>

                {/* Templates List */}
                {templates.length === 0 ? (
                    <div className="relative group overflow-hidden bg-[#0a0a15] rounded-xl border border-dashed border-white/10 p-12 text-center hover:border-cyan-500/30 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center mb-4 ring-1 ring-white/10 group-hover:ring-cyan-500/30 transition-all duration-500">
                                <FileText size={32} className="text-cyan-500/50 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-500" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">No Templates Yet</h3>
                            <p className="text-xs text-cyan-400/50 max-w-sm mx-auto mb-6">
                                Create your first template to define custom System Prompts and streamline your conversations.
                            </p>
                            <Button
                                onClick={handleCreate}
                                variant="outline"
                                size="sm"
                                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
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
                                    className="group relative bg-[#0a0a15] hover:bg-[#0f0f1a] border border-white/5 hover:border-cyan-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] flex flex-col h-full"
                                >
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 rounded-xl transition-all duration-500" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                                        {template.name}
                                                    </h3>
                                                    {isSystemTemplate && (
                                                        <span className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <p className="text-xs text-slate-400 line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {isOwner && !isSystemTemplate && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-1 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
                                                        className="p-1.5 text-cyan-400/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/20"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(template._id); }}
                                                        className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded text-cyan-200/80 text-[10px] font-medium tracking-wide group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-colors"
                                                    >
                                                        <Tag size={9} className="text-cyan-500/50" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* System Prompt Preview */}
                                        <div className="mt-auto pt-3 border-t border-white/5 group-hover:border-cyan-500/20 transition-colors">
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500/40 mb-1.5 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-cyan-500/40"></span>
                                                System Prompt
                                            </p>
                                            <p className="text-[10px] text-slate-400/80 line-clamp-2 font-mono bg-black/20 p-2 rounded border border-white/5 max-w-full break-all leading-relaxed">
                                                {template.systemPrompt}
                                            </p>
                                            {/* Date */}
                                            {template.createdAt && (
                                                <div className="mt-2 text-[9px] text-white/20 text-right font-mono">
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
