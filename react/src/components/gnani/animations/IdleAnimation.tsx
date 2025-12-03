import React from 'react';
import { motion } from 'framer-motion';

const IdleAnimation: React.FC = () => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Core Glow */}
            <motion.div
                className="absolute w-20 h-20 bg-cyan-500/20 rounded-full blur-xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Inner Circle */}
            <motion.div
                className="absolute w-32 h-32 border-2 border-cyan-500/30 rounded-full"
                animate={{
                    scale: [1, 1.05, 1],
                    borderColor: ["rgba(6,182,212,0.3)", "rgba(6,182,212,0.6)", "rgba(6,182,212,0.3)"],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Outer Rotating Ring */}
            <motion.div
                className="absolute w-48 h-48 border border-dashed border-cyan-500/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Counter-Rotating Ring */}
            <motion.div
                className="absolute w-56 h-56 border border-dotted border-cyan-500/10 rounded-full"
                animate={{ rotate: -360 }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Center Core */}
            <motion.div
                className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};

export default IdleAnimation;
