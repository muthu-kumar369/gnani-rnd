import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Cpu, Check } from 'lucide-react';
import axios from 'axios';
import DropdownPortal from '../common/DropdownPortal';

interface ModelOption {
    id: string;
    displayName: string;
    description?: string;
    provider: string;
}

interface ModelSelectorProps {
    selectedModel: string | null;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [models, setModels] = useState<ModelOption[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/llm/models');
                setModels(response.data.models || []);
            } catch (error) {
                console.error('Failed to fetch models:', error);
                setModels([{ id: 'gemma:2b', displayName: 'Gemma 2B', provider: 'Ollama', description: 'Lightweight model' }]);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
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

    const selectedModelData = models.find(m => m.id === selectedModel);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className="control-button flex items-center gap-2 min-w-[100px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-1.5">
                    <Cpu size={12} />
                    <span className="text-[11px] font-medium">
                        {loading ? 'Loading...' : selectedModelData?.displayName || 'Model'}
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
                        className="dropdown-popup w-[150px] max-h-[240px]"
                        style={{
                            overflowY: models.length > 4 ? 'auto' : 'hidden'
                        }}
                    >
                        {models.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`dropdown-item w-full text-left ${model.id === selectedModel ? 'selected' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-cyan-100 truncate">
                                                {model.displayName}
                                            </span>
                                            <span className="text-[9px] px-1 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400">
                                                {model.provider}
                                            </span>
                                        </div>
                                    </div>
                                    {model.id === selectedModel && (
                                        <Check size={12} className="text-cyan-400 flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </DropdownPortal>
        </div>
    );
};

export default ModelSelector;
