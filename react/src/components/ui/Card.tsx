import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, noPadding = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-panel rounded-lg overflow-hidden flex flex-col ${className}`}
        >
            {(title || action) && (
                <div className="px-4 py-3 border-b border-glass-border flex justify-between items-center bg-gnani-primary/5">
                    {title && (
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gnani-primary flex items-center gap-2">
                            <span className="w-1 h-4 bg-gnani-primary rounded-sm" />
                            {title}
                        </h3>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={`relative ${noPadding ? '' : 'p-4'}`}>
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gnani-primary/50 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gnani-primary/50 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gnani-primary/50 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gnani-primary/50 rounded-br-sm" />

                {children}
            </div>
        </motion.div>
    );
};

export default Card;
