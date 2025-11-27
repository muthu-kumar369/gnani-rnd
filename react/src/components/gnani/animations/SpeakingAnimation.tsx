import React from 'react';
import { motion } from 'framer-motion';

const SpeakingAnimation: React.FC = () => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Core */}
            <motion.div
                className="relative z-10 w-20 h-20 bg-cyan-500 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.8)]"
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
            </motion.div>

            {/* Outgoing Waves */}
            {[1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    className="absolute border-2 border-cyan-400/50 rounded-full"
                    initial={{ width: 20, height: 20, opacity: 1 }}
                    animate={{
                        width: 250,
                        height: 250,
                        opacity: 0,
                        borderWidth: [2, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut"
                    }}
                />
            ))}

            {/* Frequency visualizer bars (simulated) */}
            <div className="absolute flex gap-1 items-center justify-center z-20">
                {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1 bg-white/80 rounded-full"
                        animate={{
                            height: [10, 30, 10],
                        }}
                        transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default SpeakingAnimation;
