import React from 'react';
import { Coins } from 'lucide-react';

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
}

interface TokenBadgeProps {
    usage: TokenUsage;
}

const TokenBadge: React.FC<TokenBadgeProps> = ({ usage }) => {
    if (!usage || usage.totalTokens === 0) return null;

    return (
        <div className="group relative flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/10 hover:border-white/20 transition-all cursor-help">
            <Coins className="w-3 h-3" />
            <span>{usage.totalTokens} tokens</span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="space-y-1">
                    <div className="flex justify-between text-white/60">
                        <span>Input:</span>
                        <span className="text-white/90">{usage.inputTokens}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                        <span>Output:</span>
                        <span className="text-white/90">{usage.outputTokens}</span>
                    </div>
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between text-emerald-400/80 font-medium">
                        <span>Est. Cost:</span>
                        <span>${usage.estimatedCost.toFixed(6)}</span>
                    </div>
                    <div className="text-[9px] text-white/30 text-right mt-1 font-mono">
                        {usage.model}
                    </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
            </div>
        </div>
    );
};

export default TokenBadge;
