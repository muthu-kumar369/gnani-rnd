import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '', text }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <motion.div
                className={`${sizeClasses[size]} rounded-full border-cyan-500/30 border-t-cyan-400`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {text && (
                <span className="text-cyan-400/80 text-sm font-medium animate-pulse">
                    {text}
                </span>
            )}
        </div>
    );
};

export default Loader;
