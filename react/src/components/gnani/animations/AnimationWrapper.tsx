import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IdleAnimation from './IdleAnimation';
import ListeningAnimation from './ListeningAnimation';
import ThinkingAnimation from './ThinkingAnimation';
import SpeakingAnimation from './SpeakingAnimation';

export type AnimationState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

interface AnimationWrapperProps {
    state: AnimationState;
    audioLevel: number;
}

const AnimationWrapper: React.FC<AnimationWrapperProps> = ({ state, audioLevel }) => {
    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            <AnimatePresence mode="wait">
                {state === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute"
                    >
                        <IdleAnimation />
                    </motion.div>
                )}
                {state === 'LISTENING' && (
                    <motion.div
                        key="listening"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute"
                    >
                        <ListeningAnimation audioLevel={audioLevel} />
                    </motion.div>
                )}
                {state === 'THINKING' && (
                    <motion.div
                        key="thinking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute"
                    >
                        <ThinkingAnimation />
                    </motion.div>
                )}
                {state === 'SPEAKING' && (
                    <motion.div
                        key="speaking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute"
                    >
                        <SpeakingAnimation />
                    </motion.div>
                )}
                {state === 'ERROR' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute"
                    >
                        {/* Reusing Idle but red? Or a specific error anim. For now, Idle with red filter via CSS parent? */}
                        {/* Let's just use Idle for now, the status text will show error */}
                        <IdleAnimation />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimationWrapper;
