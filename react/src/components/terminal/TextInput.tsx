import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square } from 'lucide-react';
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

    // NEW: Streaming support
    isStreaming?: boolean;
    onStopGeneration?: () => void;
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
    disabled,
    isStreaming = false,
    onStopGeneration
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
            if (!isStreaming) {
                handleSend();
            }
        }
    };

    const handleSend = () => {
        if (text.trim() && !disabled && !isStreaming) {
            onSend(text.trim());
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleStop = () => {
        if (onStopGeneration) {
            onStopGeneration();
        }
    };

    // Determine button state
    const canSend = text.trim() && !disabled && !isStreaming;

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
                        {/* Streaming Indicator */}
                        {isStreaming && (
                            <div className="mb-2 flex items-center gap-2 text-xs text-cyan-400">
                                <div className="flex gap-1">
                                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                                </div>
                                <span>Gnani is thinking...</span>
                            </div>
                        )}

                        {/* Main textarea */}
                        <div className="relative mb-2">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Gnani..."
                                disabled={disabled || isStreaming}
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
                                        disabled={disabled || isStreaming}
                                    />
                                )}
                                {onModelChange && (
                                    <ModelSelector
                                        selectedModel={selectedModel || null}
                                        onModelChange={onModelChange}
                                        disabled={disabled || isStreaming}
                                    />
                                )}
                                {onTemplateChange && (
                                    <TemplateSelector
                                        selectedTemplate={selectedTemplate || null}
                                        onTemplateChange={onTemplateChange}
                                        disabled={disabled || isStreaming}
                                    />
                                )}
                            </div>

                            {/* Send/Stop Button */}
                            <AnimatePresence mode="wait">
                                {isStreaming ? (
                                    <motion.button
                                        key="stop-btn"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStop}
                                        className="h-10 w-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full border border-red-500/50 backdrop-blur-sm transition-all"
                                        title="Stop generation"
                                    >
                                        <div className="w-3 h-3 rounded-[2px] bg-current" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        key="send-btn"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={!canSend}
                                        className="h-10 w-10 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/50 backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Send message"
                                    >
                                        <Send size={18} strokeWidth={2} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextInput;
