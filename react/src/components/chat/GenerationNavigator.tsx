// src/components/chat/GenerationNavigator.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Box } from 'lucide-react';

interface GenerationNavigatorProps {
    currentIndex: number;
    totalGenerations: number;
    onNavigate: (direction: 'prev' | 'next') => void;
    timestamp?: Date;
    modelName?: string;
    className?: string; // Add className prop for better composition
}

export const GenerationNavigator: React.FC<GenerationNavigatorProps> = ({
    currentIndex,
    totalGenerations,
    onNavigate,
    timestamp,
    modelName,
    className = ''
}) => {
    if (totalGenerations <= 1) return null;

    const handlePrev = () => {
        if (currentIndex > 0) {
            onNavigate('prev');
        }
    };

    const handleNext = () => {
        if (currentIndex < totalGenerations - 1) {
            onNavigate('next');
        }
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className={`flex items-center gap-3 bg-white/5 rounded-lg p-1 px-2 border border-white/10 ${className}`}>
            <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Previous generation"
            >
                <ChevronLeft size={14} />
            </button>

            <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-gray-300">
                    {currentIndex + 1} <span className="text-gray-600">/</span> {totalGenerations}
                </span>
            </div>

            <button
                onClick={handleNext}
                disabled={currentIndex === totalGenerations - 1}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Next generation"
            >
                <ChevronRight size={14} />
            </button>

            {(timestamp || modelName) && (
                <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
                    {timestamp && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Clock size={10} />
                            <span>{formatTime(timestamp)}</span>
                        </div>
                    )}
                    {modelName && (
                        <div className="flex items-center gap-1 text-[10px] text-jarvis-blue/70">
                            <Box size={10} />
                            <span>{modelName}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GenerationNavigator;
