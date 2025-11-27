import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDisplayProps {
    status: string; // "IDLE", "LISTENING", "THINKING", "SPEAKING"
    subtext?: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, subtext }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <AnimatePresence mode="wait">
                <motion.h2
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-bold tracking-widest text-cyan-100 uppercase"
                    style={{ textShadow: "0 0 10px rgba(6,182,212,0.8)" }}
                >
                    {status}
                </motion.h2>
            </AnimatePresence>

            {subtext && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-cyan-400/70 font-mono"
                >
                    {subtext}
                </motion.p>
            )}
        </div>
    );
};

export default StatusDisplay;
