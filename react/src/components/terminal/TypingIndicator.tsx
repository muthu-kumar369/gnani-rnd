import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
    status: 'thinking' | 'generating' | 'idle';
    message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ status, message }) => {
    if (status === 'idle') return null;

    const getStatusText = () => {
        if (message) return message;

        switch (status) {
            case 'thinking':
                return 'Gnani is thinking...';
            case 'generating':
                return 'Gnani is typing...';
            default:
                return 'Gnani is working...';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="typing-indicator"
            >
                <div className="typing-avatar">
                    <Bot size={16} className="text-gnani-primary" />
                </div>
                <div className="typing-content">
                    <span className="typing-text">{getStatusText()}</span>
                    <div className="typing-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TypingIndicator;
