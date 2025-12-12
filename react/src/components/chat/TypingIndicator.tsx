import React from 'react';

interface TypingIndicatorProps {
    status?: string;
    message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ status, message }) => {
    // If status is passed but explicitly idle, return null
    if (status === 'idle') return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-cyan-400/60 text-sm font-mono animate-pulse">
            <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce"></div>
            </div>
            <span>{message || 'Gnani is thinking...'}</span>
        </div>
    );
};

export default TypingIndicator;
