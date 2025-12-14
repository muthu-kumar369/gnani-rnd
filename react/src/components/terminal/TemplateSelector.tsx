import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Check, Settings } from 'lucide-react';
import { templateService } from '../../api/templateService';
import DropdownPortal from '../common/DropdownPortal';

interface Template {
    _id: string;
    name: string;
    description?: string;
    systemPrompt: string;
    tags?: string[];
}

interface TemplateSelectorProps {
    selectedTemplate: string | null;
    onTemplateChange: (templateId: string) => void;
    disabled?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, onTemplateChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await templateService.getAll();
                setTemplates(data);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedTemplateData = templates.find(t => t._id === selectedTemplate);

    const handleManageTemplates = () => {
        setIsOpen(false);
        console.log('[TemplateSelector] Opening settings - dispatching event');
        window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'templates' } }));
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className="control-button flex items-center gap-2 min-w-[100px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-1.5">
                    <FileText size={12} />
                    <span className="text-[11px] font-medium truncate max-w-[80px]">
                        {loading ? 'Loading...' : selectedTemplateData?.name || 'Template'}
                    </span>
                </div>
                <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <DropdownPortal isOpen={isOpen && !loading} buttonRef={buttonRef}>
                <div ref={dropdownRef}>
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.12 }}
                        className="dropdown-popup w-[220px] max-h-[300px] flex flex-col"
                    >
                        {/* Scrollable template list */}
                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar"
                            style={{
                                maxHeight: templates.length > 3 ? '240px' : 'auto'
                            }}
                        >
                            {templates.length === 0 ? (
                                <div className="p-3 text-center text-gnani-primary/60 text-xs">
                                    No templates available
                                </div>
                            ) : (
                                templates.map((template) => (
                                    <button
                                        key={template._id}
                                        onClick={() => {
                                            onTemplateChange(template._id);
                                            setIsOpen(false);
                                        }}
                                        className={`dropdown-item w-full text-left ${template._id === selectedTemplate ? 'selected' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-type-primary truncate">
                                                    {template.name}
                                                </div>
                                                {template.description && (
                                                    <div className="text-[10px] text-gnani-primary/60 mt-0.5 line-clamp-1">
                                                        {template.description}
                                                    </div>
                                                )}
                                                {template.tags && template.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {template.tags.slice(0, 2).map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-[9px] px-1 py-0.5 bg-gnani-primary/10 border border-gnani-primary/20 rounded text-gnani-primary"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {template._id === selectedTemplate && (
                                                <Check size={12} className="text-gnani-primary flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Fixed Manage Templates button at bottom */}
                        <div className="border-t border-gnani-primary/20">
                            <button
                                onClick={handleManageTemplates}
                                className="w-full px-3 py-2 text-left hover:bg-gnani-primary/10 transition-colors flex items-center gap-2"
                            >
                                <Settings size={12} className="text-gnani-primary" />
                                <span className="text-[11px] text-gnani-primary font-medium">Manage Templates</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </DropdownPortal>
        </div>
    );
};

export default TemplateSelector;
