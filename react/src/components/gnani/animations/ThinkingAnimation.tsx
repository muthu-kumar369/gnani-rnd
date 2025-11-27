import React from 'react';
import { motion } from 'framer-motion';

const ThinkingAnimation: React.FC = () => {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Fast Inner Spin */}
            <motion.div
                className="absolute w-24 h-24 border-t-4 border-b-4 border-cyan-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />

            {/* Middle Ring with Gaps */}
            <motion.div
                className="absolute w-40 h-40 border-2 border-dashed border-cyan-500/40 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Outer Ring with Segments */}
            <svg className="absolute w-56 h-56 animate-spin-slow" viewBox="0 0 100 100">
                <motion.circle
                    cx="50"
                    cy="50"
                    r="48"
                    stroke="rgba(6,182,212,0.3)"
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="10 5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
            </svg>

            {/* Pulsing Core */}
            <motion.div
                className="w-12 h-12 bg-cyan-600/80 rounded-full blur-md"
                animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Data Particles Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-200 rounded-full"
                        style={{ transformOrigin: "center center" }}
                        animate={{
                            transform: [`rotate(${deg}deg) translateX(30px)`, `rotate(${deg}deg) translateX(60px)`],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ThinkingAnimation;
