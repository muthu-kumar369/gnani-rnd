import React from 'react';

interface StreamingProgressProps {
    progress?: number;
    isStreaming?: boolean;
    className?: string;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({
    progress = 0,
    isStreaming = false,
    className = ''
}) => {
    if (!isStreaming && progress === 0) return null;

    return (
        <div className={`w-full h-1 bg-cyan-500/20 rounded-full overflow-hidden ${className}`}>
            <div
                className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
    );
};

export default StreamingProgress;
