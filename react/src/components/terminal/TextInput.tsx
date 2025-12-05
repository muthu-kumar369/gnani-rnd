import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import ModelSelector from './ModelSelector';
import TemplateSelector from './TemplateSelector';

interface TextInputProps {
    isVisible: boolean;
    onClose: () => void;
    onSend: (text: string) => void;
    onFileSelect?: (file: File) => void;
    onImageSelect?: (file: File) => void;
    selectedModel?: string | null;
    selectedTemplate?: string | null;
    onModelChange?: (modelId: string) => void;
    onTemplateChange?: (templateId: string) => void;
    disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
    isVisible,
    onClose,
    onSend,
    onFileSelect,
    onImageSelect,
    selectedModel,
    selectedTemplate,
    onModelChange,
    onTemplateChange,
    disabled
}) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isVisible && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isVisible]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSend(text.trim());
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-cyan-500/30 bg-cyan-950/30 backdrop-blur-sm"
                >
                    <div className="p-3">
                        {/* Main textarea */}
                        <div className="relative mb-2">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Gnani..."
                                disabled={disabled}
                                className="modern-input w-full p-3 text-sm text-cyan-100 placeholder-cyan-500/50 resize-none min-h-[44px] max-h-[150px] custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={1}
                            />
                        </div>

                        {/* Control row */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {onFileSelect && onImageSelect && (
                                    <AttachmentMenu
                                        onFileSelect={onFileSelect}
                                        onImageSelect={onImageSelect}
                                        disabled={disabled}
                                    />
                                )}
                                {onModelChange && (
                                    <ModelSelector
                                        selectedModel={selectedModel || null}
                                        onModelChange={onModelChange}
                                        disabled={disabled}
                                    />
                                )}
                                {onTemplateChange && (
                                    <TemplateSelector
                                        selectedTemplate={selectedTemplate || null}
                                        onTemplateChange={onTemplateChange}
                                        disabled={disabled}
                                    />
                                )}
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!text.trim() || disabled}
                                className="h-10 w-10 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-500/30 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-100 disabled:hover:scale-100 disabled:shadow-none"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextInput;
