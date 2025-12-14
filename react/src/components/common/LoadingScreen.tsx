import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const QUOTES = [
    "Initializing neural networks...",
    "Calibrating sensors...",
    "Loading knowledge base...",
    "Establishing secure connection...",
    "Syncing with the cloud...",
    "Optimizing performance...",
    "Waking up Gnani...",
    "Preparing your assistant..."
];

const LoadingScreen: React.FC = () => {
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-canvas-app text-type-primary overflow-hidden relative transition-colors duration-300">
            {/* Animated background grid - Subtle */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-grid-pattern animate-pulse" />
            </div>

            {/* Main Unified Loader Container */}
            <div className="relative flex flex-col items-center justify-center z-10">

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

                {/* Text */}
                <h1 className="text-2xl font-bold tracking-[0.2em] text-gnani-primary mb-4">
                    GNANI
                </h1>

                <div className="h-6 overflow-hidden">
                    <motion.p
                        key={quoteIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-sm text-type-secondary font-mono"
                    >
                        {QUOTES[quoteIndex]}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
