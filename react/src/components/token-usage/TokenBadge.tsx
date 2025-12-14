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
        <div className="group relative flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-glass-base border border-glass-border text-[10px] text-type-secondary hover:text-type-primary hover:bg-glass-hover hover:border-gnani-primary/30 transition-all cursor-help">
            <Coins className="w-3 h-3" />
            <span>{usage.totalTokens} tokens</span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-canvas-popover border border-glass-border rounded-lg shadow-glass backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="space-y-1">
                    <div className="flex justify-between text-type-muted">
                        <span>Input:</span>
                        <span className="text-type-primary">{usage.inputTokens}</span>
                    </div>
                    <div className="flex justify-between text-type-muted">
                        <span>Output:</span>
                        <span className="text-type-primary">{usage.outputTokens}</span>
                    </div>
                    <div className="h-px bg-line-base my-1" />
                    <div className="flex justify-between text-status-success font-medium">
                        <span>Est. Cost:</span>
                        <span>${usage.estimatedCost.toFixed(6)}</span>
                    </div>
                    <div className="text-[9px] text-type-muted/50 text-right mt-1 font-mono">
                        {usage.model}
                    </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-canvas-popover" />
            </div>
        </div>
    );
};

export default TokenBadge;
