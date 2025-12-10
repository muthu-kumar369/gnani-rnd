import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRateLimitStore } from '../../store/useRateLimitStore';

const RateLimitIndicator: React.FC = () => {
    const { remaining, limit, resetAt } = useRateLimitStore();

    // Calculate time until reset
    const timeUntilReset = Math.max(0, resetAt - Date.now() / 1000);
    const minutes = Math.floor(timeUntilReset / 60);
    const seconds = Math.floor(timeUntilReset % 60);

    // Only show when low (below 20% of limit) as per prompt
    if (limit === 0 || remaining > limit * 0.2) {
        return null;
    }

    const percentage = (remaining / limit) * 100;

    // Determine color based on remaining requests
    const getColor = () => {
        if (percentage > 50) return 'text-cyan-500 border-cyan-500/50';
        if (percentage > 20) return 'text-yellow-500 border-yellow-500/50';
        return 'text-red-500 border-red-500/50';
    };

    const getProgressColor = () => {
        if (percentage > 50) return 'bg-cyan-500';
        if (percentage > 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getColor()} bg-black/40 backdrop-blur-sm`}
        >
            <AlertCircle size={16} />

            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">
                        {remaining}/{limit} requests remaining
                    </span>
                    {remaining === 0 && timeUntilReset > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-60">
                            <Clock size={12} />
                            <span>
                                (resets in {Math.ceil(timeUntilReset)}s)
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${getProgressColor()} transition-all duration-300`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default RateLimitIndicator;
