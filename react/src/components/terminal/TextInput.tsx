import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';

interface TextInputProps {
    isVisible: boolean;
    onClose: () => void;
    onSend: (text: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ isVisible, onClose, onSend }) => {
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
        if (text.trim()) {
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
                    className="border-t border-cyan-500/30 bg-cyan-950/30 backdrop-blur-sm overflow-hidden"
                >
                    <div className="p-3 flex items-end gap-2">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="w-full bg-black/50 border border-cyan-500/30 rounded-lg p-3 pr-10 text-sm text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none min-h-[44px] max-h-[150px] custom-scrollbar"
                                rows={1}
                            />
                            <button
                                onClick={onClose}
                                className="absolute top-2 right-2 p-1 text-cyan-500/50 hover:text-cyan-300 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!text.trim()}
                            className="h-[46px] w-[46px] flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 disabled:text-cyan-500/30 text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0 mb-[1px]"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TextInput;
