import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, MessageSquare, Power, ArrowRight } from 'lucide-react';
import type { ConversationMessage } from '../../context/ConversationContext';

interface StateIndicatorProps {
    message: ConversationMessage;
}

const StateIndicator: React.FC<StateIndicatorProps> = ({ message }) => {
    const { fromState, toState } = message.metadata || {};

    const getStateIcon = (state?: string) => {
        switch (state) {
            case 'listening': return <Mic size={12} />;
            case 'thinking': return <Brain size={12} />;
            case 'speaking': return <MessageSquare size={12} />;
            case 'idle': return <Power size={12} />;
            default: return <Activity size={12} />;
        }
    };

    const getStateColor = (state?: string) => {
        switch (state) {
            case 'listening': return 'text-red-400';
            case 'thinking': return 'text-yellow-400';
            case 'speaking': return 'text-cyan-400';
            case 'idle': return 'text-gray-400';
            default: return 'text-gray-500';
        }
    };

    // Import Activity locally to avoid conflict if I didn't import it above
    // Actually I missed importing Activity, let me add it or use a fallback
    const Activity = ({ size }: { size: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 my-2 py-1"
        >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-900/50" />

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-cyan-900/30 text-[10px] font-mono uppercase tracking-wider text-cyan-600/80">
                <span className={`flex items-center gap-1 ${getStateColor(fromState as string)}`}>
                    {getStateIcon(fromState as string)}
                    {fromState}
                </span>

                <ArrowRight size={10} className="text-cyan-800" />

                <span className={`flex items-center gap-1 ${getStateColor(toState as string)}`}>
                    {getStateIcon(toState as string)}
                    {toState}
                </span>
            </div>

            <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-900/50" />
        </motion.div>
    );
};

export default StateIndicator;
