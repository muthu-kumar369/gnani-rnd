import React from 'react';
import { motion } from 'framer-motion';

interface LoginLoaderProps {
    message?: string;
}

const LoginLoader: React.FC<LoginLoaderProps> = ({ message = 'Authenticating...' }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-app/90 backdrop-blur-md transition-colors duration-300">
            {/* Animated background grid - Subtle */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-grid-pattern animate-pulse" />
            </div>

            {/* Main Unified Loader Container */}
            <div className="relative flex flex-col items-center justify-center">

                {/* Central Holographic Unit */}
                <div className="relative w-32 h-32 mb-8">

                    {/* Core Glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gnani-primary/10 blur-xl"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Primary Ring - Steady Rotation */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-t-gnani-primary border-r-transparent border-b-gnani-primary border-l-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Secondary Ring - Counter Rotation */}
                    <motion.div
                        className="absolute inset-2 rounded-full border border-t-transparent border-r-gnani-secondary border-b-transparent border-l-gnani-secondary opacity-70"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Inner Core Pulse */}
                    <motion.div
                        className="absolute inset-[35%] rounded-full bg-gnani-primary"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                            boxShadow: [
                                "0 0 10px rgba(var(--primary-rgb), 0.5)",
                                "0 0 20px rgba(var(--primary-rgb), 0.8)",
                                "0 0 10px rgba(var(--primary-rgb), 0.5)"
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Loading Text */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-lg font-medium text-gnani-primary tracking-wider uppercase text-glow">
                        {message}
                    </h3>

                    {/* Simple animated dots */}
                    <div className="flex justify-center gap-1 mt-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gnani-secondary"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Corner Accents - Kept for Theme Consistency but reduced opacity */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
                const positions = {
                    'top-left': 'top-8 left-8',
                    'top-right': 'top-8 right-8',
                    'bottom-left': 'bottom-8 left-8',
                    'bottom-right': 'bottom-8 right-8',
                };

                return (
                    <div
                        key={corner}
                        className={`absolute ${positions[corner as keyof typeof positions]} w-6 h-6 opacity-30`}
                    >
                        <div className={`absolute ${corner.includes('top') ? 'top-0' : 'bottom-0'} ${corner.includes('left') ? 'left-0' : 'right-0'} w-full h-px bg-gnani-primary`} />
                        <div className={`absolute ${corner.includes('top') ? 'top-0' : 'bottom-0'} ${corner.includes('left') ? 'left-0' : 'right-0'} w-px h-full bg-gnani-primary`} />
                    </div>
                );
            })}
        </div>
    );
};

export default LoginLoader;
