// react/src/components/gnani/SpokenTextDisplay.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpokenWord } from '../../hooks/useSpokenText';

interface SpokenTextDisplayProps {
    words: SpokenWord[];
    isVisible: boolean;
}

/**
 * SpokenTextDisplay - Shows real-time text that Gnani is speaking
 * 
 * Features:
 * - Progressive word reveal
 * - Current word highlighting with glow effect
 * - Smooth fade in/out
 * - Jarvis-themed styling
 */
const SpokenTextDisplay: React.FC<SpokenTextDisplayProps> = ({ words, isVisible }) => {
    if (!isVisible || words.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="w-full max-w-4xl mx-auto px-6 py-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                <motion.div
                    className="relative bg-black/30 backdrop-blur-md rounded-lg p-6 border border-cyan-300/20"
                    style={{
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
                    }}
                >
                    {/* Label */}
                    <div className="text-xs font-mono uppercase text-cyan-300/70 mb-3 tracking-wider">
                        &lt; Gnani Speaking
                    </div>

                    {/* Spoken Text */}
                    <div className="text-center min-h-[60px] flex items-center justify-center">
                        <motion.p className="text-2xl md:text-3xl font-display leading-relaxed">
                            {words.map((word, index) => (
                                <motion.span
                                    key={`${word.text}-${index}`}
                                    className={`inline-block mx-1 ${word.isCurrent
                                        ? 'text-green-300 font-semibold'
                                        : 'text-cyan-200'
                                        }`}
                                    style={{
                                        textShadow: word.isCurrent
                                            ? '0 0 10px rgba(74, 222, 128, 0.8), 0 0 20px rgba(74, 222, 128, 0.4)'
                                            : '0 0 5px rgba(0, 255, 255, 0.3)',
                                    }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: 1,
                                        scale: word.isCurrent ? 1.08 : 1,
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        scale: {
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                        },
                                    }}
                                >
                                    {word.text}
                                </motion.span>
                            ))}
                        </motion.p>
                    </div>

                    {/* Animated bottom border */}
                    <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut',
                        }}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SpokenTextDisplay;
