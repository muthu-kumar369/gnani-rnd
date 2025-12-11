import React from 'react';
import { AlertTriangle, RefreshCw, X, Clock, Plus } from 'lucide-react';

interface TimeoutIndicatorProps {
    onRetry?: () => void;
    onCancel?: () => void;
    timeLeft?: number;
    onExtend?: (seconds: number) => void;
}

const TimeoutIndicator: React.FC<TimeoutIndicatorProps> = ({ onRetry, onCancel, timeLeft, onExtend }) => {
    // If timeLeft is provided, show countdown mode
    if (timeLeft !== undefined && onExtend) {
        return (
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-yellow-500">
                    <Clock size={16} />
                    <span className="text-sm font-medium">Timeout in {timeLeft}s</span>
                </div>
                <button
                    onClick={() => onExtend(30)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                >
                    <Plus size={12} />
                    Extend
                </button>
            </div>
        );
    }

    // Default mode (Retry/Cancel)
    return (
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">taking longer than usual...</span>
            </div>

            <div className="flex items-center gap-2">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                    >
                        <RefreshCw size={12} />
                        Retry
                    </button>
                )}
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                        <X size={12} />
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default TimeoutIndicator;
