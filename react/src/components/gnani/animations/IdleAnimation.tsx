import React from 'react';
import { motion } from 'framer-motion';

const IdleAnimation: React.FC = () => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Core Glow */}
            <motion.div
                className="absolute w-20 h-20 bg-gnani-primary/20 rounded-full blur-xl"
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
                className="absolute w-32 h-32 border-2 border-gnani-primary/30 rounded-full"
                animate={{
                    scale: [1, 1.05, 1],
                    borderColor: ["rgba(var(--primary-rgb),0.3)", "rgba(var(--primary-rgb),0.6)", "rgba(var(--primary-rgb),0.3)"],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Outer Rotating Ring */}
            <motion.div
                className="absolute w-48 h-48 border border-dashed border-gnani-primary/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Counter-Rotating Ring */}
            <motion.div
                className="absolute w-56 h-56 border border-dotted border-gnani-primary/10 rounded-full"
                animate={{ rotate: -360 }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />

            {/* Center Core */}
            <motion.div
                className="w-4 h-4 bg-gnani-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]"
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
