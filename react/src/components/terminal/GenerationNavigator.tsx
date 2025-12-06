// src/components/terminal/GenerationNavigator.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './GenerationNavigator.css';

interface GenerationNavigatorProps {
    currentIndex: number;
    totalGenerations: number;
    onNavigate: (direction: 'prev' | 'next') => void;
    timestamp?: Date;
    modelName?: string;
}

export const GenerationNavigator: React.FC<GenerationNavigatorProps> = ({
    currentIndex,
    totalGenerations,
    onNavigate,
    timestamp,
    modelName
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
        <div className="generation-navigator">
            <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="nav-button"
                aria-label="Previous generation"
            >
                <ChevronLeft size={16} />
            </button>

            <div className="generation-info">
                <span className="generation-counter">
                    {currentIndex + 1} / {totalGenerations}
                </span>
                {timestamp && (
                    <span className="generation-meta">
                        {formatTime(timestamp)}
                        {modelName && ` • ${modelName}`}
                    </span>
                )}
            </div>

            <button
                onClick={handleNext}
                disabled={currentIndex === totalGenerations - 1}
                className="nav-button"
                aria-label="Next generation"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};
