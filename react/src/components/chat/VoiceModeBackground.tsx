import React from 'react';
import { motion } from 'framer-motion';
import type { GnaniState } from '../../store/useGnaniStore';

interface VoiceModeBackgroundProps {
    status: GnaniState;
}

const VoiceModeBackground: React.FC<VoiceModeBackgroundProps> = ({ status }) => {
    // Determine color palette based on state
    // Idle: Deep Cosmic Blue/Purple (Calm)
    // Listening: Cyan/Teal (Attentive)
    // Thinking: Violet/Magenta (Processing)
    // Speaking: Blue/White/Cyan (Active communication)

    const variants = {
        idle: {
            background: 'linear-gradient(135deg, #020617 0%, #172554 100%)',
            transition: { duration: 1.5, ease: 'easeInOut' }
        },
        listening: {
            background: 'linear-gradient(135deg, #022c22 0%, #0d9488 100%)', // Brighter Teal
            transition: { duration: 0.5, ease: 'easeOut' }
        },
        thinking: {
            background: 'linear-gradient(135deg, #2e1065 0%, #7e22ce 100%)', // Brighter Violet
            transition: { duration: 0.8, ease: 'easeInOut' }
        },
        speaking: {
            background: 'linear-gradient(135deg, #172554 0%, #3b82f6 100%)', // Brighter Blue
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    // Get current variant key
    const currentVariant = ['idle', 'listening', 'thinking', 'speaking'].includes(status)
        ? status
        : 'idle';

    return (
        <motion.div
            className="absolute inset-0 z-0 overflow-hidden"
            initial="idle"
            animate={currentVariant}
            variants={variants as any} // Typing cast for simple bg switch
        >
            {/* Ambient Blobs Layer */}
            <div className="absolute inset-0 opacity-60 mix-blend-screen">
                {/* Blob 1: Top Left */}
                <motion.div
                    className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full blur-[120px]"
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -30, 20, 0],
                        scale: [1, 1.1, 0.9, 1],
                        backgroundColor: status === 'listening' ? '#2dd4bf' : status === 'thinking' ? '#d8b4fe' : '#60a5fa'
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />

                {/* Blob 2: Bottom Right */}
                <motion.div
                    className="absolute -bottom-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full blur-[140px]"
                    animate={{
                        x: [0, -60, 40, 0],
                        y: [0, 50, -30, 0],
                        scale: [1, 1.2, 0.8, 1],
                        backgroundColor: status === 'listening' ? '#14b8a6' : status === 'thinking' ? '#a855f7' : '#3b82f6'
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 2
                    }}
                />

                {/* Blob 3: Center Highlight (The Glow source) */}
                {status !== 'idle' && (
                    <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-plus-lighter"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.4, 1],
                            backgroundColor: status === 'listening' ? '#99f6e4' : status === 'thinking' ? '#f0abfc' : '#bfdbfe'
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                )}
            </div>

            {/* Noise Texture Overlay for "Film Grain" feel - adds premium texture */}
            <div className="absolute inset-0 opacity-[0.03] z-[1] pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-[2]" />
        </motion.div>
    );
};

export default VoiceModeBackground;
