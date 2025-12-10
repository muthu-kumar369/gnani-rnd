import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useTemplateStore, DEFAULT_TEMPLATES } from '../../store/useTemplateStore';
import CreateTemplateModal from './CreateTemplateModal';

const TemplateSelector: React.FC = () => {
    const { currentTemplate, setTemplate } = useTemplateStore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

    const handleTemplateChange = (templateId: string) => {
        setTemplate(templateId);
        setIsOpen(false);
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors text-sm"
                    title="Select conversation template"
                >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">{currentTemplate.name}</span>
                    <span className="sm:hidden">{currentTemplate.icon}</span>
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <div className="absolute top-full mt-2 right-0 z-20 w-80 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-cyan-500/20">
                                <h3 className="text-sm font-semibold text-cyan-400">Conversation Templates</h3>
                                <p className="text-xs text-cyan-500/60 mt-1">Choose a template to set the conversation context</p>
                            </div>

                            <div className="p-2">
                                {DEFAULT_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateChange(template.id)}
                                        className={`w-full px-3 py-3 text-left rounded hover:bg-cyan-500/10 transition-colors mb-1 ${currentTemplate.id === template.id ? 'bg-cyan-500/20 border border-cyan-500/30' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{template.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-cyan-400 font-medium text-sm">
                                                        {template.name}
                                                    </span>
                                                    {currentTemplate.id === template.id && (
                                                        <span className="text-xs text-green-400">✓</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-cyan-500/60 line-clamp-2">
                                                    {template.description}
                                                </p>
                                                {template.category && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-400 rounded">
                                                        {template.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Create Custom Template Button */}
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="w-full px-3 py-2 mt-2 border border-cyan-500/30 border-dashed rounded hover:bg-cyan-500/10 transition-colors text-cyan-400 text-sm flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    Create Custom Template
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Template Modal */}
            <CreateTemplateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    );
};

export default TemplateSelector;
