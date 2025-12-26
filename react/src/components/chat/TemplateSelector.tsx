import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutTemplate, Check } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';
import { useThemeStore } from '../../store/themeStore';
import DynamicIcon from '../common/DynamicIcon';

interface TemplateOption {
    _id: string;
    name: string;
    icon?: string;
    description?: string;
}

interface TemplateSelectorProps {
    selectedTemplateId: string | null;
    templates: TemplateOption[];
    onSelect: (templateId: string) => void;
    disabled?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, templates, onSelect, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { theme } = useThemeStore();

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

    const selectedTemplate = templates.find(t => t._id === selectedTemplateId);

    // Combine default option with templates
    const allOptions = [
        { _id: 'default', name: 'No Template' },
        ...templates
    ];

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 group ${theme === 'dark'
                    ? 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10 text-gray-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <div className="flex items-center gap-2">
                    {selectedTemplate?.icon ? (
                        <DynamicIcon name={selectedTemplate.icon} size={14} className={theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'} />
                    ) : (
                        <LayoutTemplate size={14} className={theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'} />
                    )}
                    <span className="text-xs font-medium max-w-[100px] truncate">
                        {selectedTemplate ? selectedTemplate.name : 'No Template'}
                    </span>
                </div>
                <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <DropdownPortal isOpen={isOpen} buttonRef={buttonRef}>
                <div ref={dropdownRef}>
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.12 }}
                        className={`w-[200px] max-h-[300px] overflow-y-auto rounded-xl shadow-2xl border p-1 z-50 flex flex-col gap-0.5 custom-scrollbar ${theme === 'dark'
                            ? 'bg-[#1a2639] border-white/10'
                            : 'bg-white border-gray-100'
                            }`}
                    >
                        {allOptions.map((option) => {
                            const isSelected = option._id === (selectedTemplateId || 'default');
                            return (
                                <button
                                    key={option._id}
                                    onClick={() => {
                                        onSelect(option._id === 'default' ? 'default' : option._id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group ${isSelected
                                        ? (theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-700')
                                        : (theme === 'dark' ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {(option as any).icon ? (
                                            <DynamicIcon name={(option as any).icon} size={14} className={isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} />
                                        ) : (
                                            <LayoutTemplate size={14} className={isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} />
                                        )}
                                        <span className="text-xs font-medium truncate">{option.name}</span>
                                    </div>
                                    {isSelected && <Check size={12} />}
                                </button>
                            );
                        })}
                    </motion.div>
                </div>
            </DropdownPortal>
        </div>
    );
};

export default TemplateSelector;
