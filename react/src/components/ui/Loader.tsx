import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '', text }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-20 h-20'
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-jarvis-blue border-r-jarvis-blue/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner Ring */}
                <motion.div
                    className="absolute inset-2 rounded-full border-2 border-transparent border-b-jarvis-cyan border-l-jarvis-cyan/50"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                {/* Core Pulse */}
                <motion.div
                    className="w-2 h-2 bg-jarvis-blue rounded-full shadow-jarvis-glow"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            </div>
            {text && (
                <span className="text-jarvis-cyan/80 text-xs font-mono tracking-widest uppercase animate-pulse">
                    {text}
                </span>
            )}
        </div>
    );
};

export default Loader;
