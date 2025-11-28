import React from 'react';
import { motion } from 'framer-motion';

const SpeakingAnimation: React.FC = () => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Core Hologram */}
            <motion.div
                className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
                animate={{
                    boxShadow: [
                        "0 0 20px rgba(0, 240, 255, 0.4)",
                        "0 0 50px rgba(0, 240, 255, 0.8)",
                        "0 0 20px rgba(0, 240, 255, 0.4)"
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="absolute inset-0 bg-jarvis-blue/20 rounded-full blur-md" />
                <div className="absolute inset-2 border-2 border-jarvis-blue/50 rounded-full animate-spin-slow" />
                <div className="absolute inset-4 border border-jarvis-cyan/30 rounded-full border-dashed animate-reverse-spin" />

                {/* Center Core */}
                <div className="w-12 h-12 bg-jarvis-blue rounded-full shadow-jarvis-glow animate-pulse" />
            </motion.div>

            {/* Orbital Rings */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={`ring-${i}`}
                    className="absolute border border-jarvis-blue/20 rounded-full"
                    style={{ width: i * 80, height: i * 80 }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.05, 1] }}
                    transition={{
                        rotate: { duration: 10 + i * 5, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
                    }}
                >
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-jarvis-cyan rounded-full shadow-jarvis-glow -translate-x-1/2 -translate-y-1/2" />
                </motion.div>
            ))}

            {/* Frequency Bars (Simulated) */}
            <div className="absolute flex gap-1 items-center justify-center z-20">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={`bar-${i}`}
                        className="w-1 bg-jarvis-cyan/80 rounded-full shadow-jarvis-glow"
                        animate={{
                            height: [10, Math.random() * 40 + 20, 10],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.05,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* Holographic Cone Effect */}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-jarvis-blue/10 to-transparent blur-xl -z-10" />
        </div>
    );
};

export default SpeakingAnimation;
