import React from 'react';
import { Clock } from 'lucide-react';

interface TimeoutIndicatorProps {
    timeLeft: number;
    onExtend: (seconds: number) => void;
}

const TimeoutIndicator: React.FC<TimeoutIndicatorProps> = ({ timeLeft, onExtend }) => {
    // Calculate progress percentage
    const maxTime = 30; // Assuming 30 seconds default
    const progress = (timeLeft / maxTime) * 100;

    // Determine color based on time left
    const getColor = () => {
        if (timeLeft > 20) return 'text-cyan-500 border-cyan-500/50';
        if (timeLeft > 10) return 'text-yellow-500 border-yellow-500/50';
        return 'text-red-500 border-red-500/50';
    };

    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getColor()} bg-black/40 backdrop-blur-sm`}>
            <Clock size={16} />
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{timeLeft}s</span>
                <span className="text-xs opacity-60">remaining</span>
            </div>

            {/* Progress bar */}
            <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-current transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Extend buttons */}
            <div className="flex gap-1">
                <button
                    onClick={() => onExtend(30)}
                    className="px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded transition-colors"
                    title="Add 30 seconds"
                >
                    +30s
                </button>
                <button
                    onClick={() => onExtend(60)}
                    className="px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded transition-colors"
                    title="Add 1 minute"
                >
                    +1m
                </button>
            </div>
        </div>
    );
};

export default TimeoutIndicator;
