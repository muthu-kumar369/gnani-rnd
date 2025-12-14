import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDisplayProps {
    status: string; // "IDLE", "LISTENING", "THINKING", "SPEAKING"
    subtext?: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, subtext }) => {
    const getDisplayText = (s: string) => {
        switch (s) {
            case 'THINKING': return 'PROCESSING...';
            case 'LISTENING': return 'LISTENING...';
            case 'SPEAKING': return 'SPEAKING';
            case 'ERROR': return 'SYSTEM ERROR';
            default: return s;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <AnimatePresence mode="wait">
                <motion.h2
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-bold tracking-widest text-gnani-primary uppercase drop-shadow-[0_0_10px_rgba(var(--gnani-primary),0.8)]"
                >
                    {getDisplayText(status)}
                </motion.h2>
            </AnimatePresence>

            {subtext && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gnani-secondary font-mono"
                >
                    {subtext}
                </motion.p>
            )}
        </div>
    );
};

export default StatusDisplay;
