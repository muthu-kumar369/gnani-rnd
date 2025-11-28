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
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-400 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black animate-spin-slow opacity-30"></div>
            </div>

            {/* Main Loader */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-8">
                    {/* Pulsing Rings */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-cyan-500/30"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-cyan-400/50"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.2, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    {/* Center Core */}
                    <motion.div
                        className="absolute inset-2 rounded-full bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center border border-cyan-400/50"
                        animate={{ boxShadow: ["0 0 10px rgba(6,182,212,0.5)", "0 0 30px rgba(6,182,212,0.8)", "0 0 10px rgba(6,182,212,0.5)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                    </motion.div>
                </div>

                {/* Text */}
                <h1 className="text-2xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 mb-4">
                    GNANI
                </h1>

                <div className="h-6 overflow-hidden">
                    <motion.p
                        key={quoteIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-sm text-cyan-500/70 font-mono"
                    >
                        {QUOTES[quoteIndex]}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
