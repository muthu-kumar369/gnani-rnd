import React from 'react';
import { motion } from 'framer-motion';

interface ListeningAnimationProps {
    audioLevel: number; // 0 to 100
}

const ListeningAnimation: React.FC<ListeningAnimationProps> = ({ audioLevel }) => {
    // Normalize audio level to 0-1 for scaling
    const normalizedLevel = Math.min(Math.max(audioLevel / 50, 0), 1); // Cap at 1 for safety, assume max useful level is around 50

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Active Glow Background */}
            <motion.div
                className="absolute w-full h-full bg-gnani-primary/5 rounded-full blur-3xl"
                animate={{
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Dynamic Ripples */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute border border-gnani-primary/40 rounded-full"
                    initial={{ width: 40, height: 40, opacity: 0.8 }}
                    animate={{
                        width: 40 + (normalizedLevel * 200) + (i * 20),
                        height: 40 + (normalizedLevel * 200) + (i * 20),
                        opacity: 0,
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                    }}
                />
            ))}

            {/* Core Reactive Element */}
            <motion.div
                className="w-16 h-16 bg-gnani-primary rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)]"
                animate={{
                    scale: 1 + normalizedLevel,
                    boxShadow: `0 0 ${20 + normalizedLevel * 40}px rgba(var(--primary-rgb),${0.6 + normalizedLevel * 0.4})`
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }}
            >
                {/* Inner detail */}
                <div className="w-full h-full rounded-full border-2 border-white/30" />
            </motion.div>

            {/* Orbiting Particles */}
            <motion.div
                className="absolute w-40 h-40"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-gnani-secondary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
            </motion.div>
            <motion.div
                className="absolute w-40 h-40"
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gnani-secondary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
            </motion.div>
        </div>
    );
};

export default ListeningAnimation;
