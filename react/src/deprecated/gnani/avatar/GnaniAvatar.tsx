import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GnaniAppStatus } from '../../../hooks/useGnaniUIState';

interface GnaniAvatarProps {
    status: GnaniAppStatus;
    mouthOpenness: number; // 0 to 1, driven by TTS
    isMale?: boolean;
}

const GnaniAvatar: React.FC<GnaniAvatarProps> = ({ status, mouthOpenness, isMale = false }) => {
    const [blink, setBlink] = useState(false);

    // Random blinking logic
    useEffect(() => {
        const blinkLoop = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
            const nextBlink = Math.random() * 3000 + 2000; // 2-5 seconds
            setTimeout(blinkLoop, nextBlink);
        };
        const timeout = setTimeout(blinkLoop, 2000);
        return () => clearTimeout(timeout);
    }, []);

    // Eye variants
    const eyeVariants = {
        idle: { scaleY: blink ? 0.1 : 1, transition: { duration: 0.1 } },
        listening: { scaleY: blink ? 0.1 : 1.2, scaleX: 1.1, transition: { duration: 0.2 } }, // Wide eyes
        thinking: { scaleY: blink ? 0.1 : 0.8, x: [0, 2, -2, 0], transition: { x: { repeat: Infinity, duration: 1 } } }, // Looking around
        speaking: { scaleY: blink ? 0.1 : 1, transition: { duration: 0.1 } }
    };

    // Mouth variants (Simple scaling for now, driven by prop)
    const mouthHeight = Math.max(2, mouthOpenness * 20); // Min 2px, Max 20px

    const color = isMale ? '#00f0ff' : '#00f0ff'; // Can customize gender colors later

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Holographic Scanlines Overlay */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-20 pointer-events-none mix-blend-overlay" />

            <svg width="100%" height="100%" viewBox="0 0 200 200" className="drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                <defs>
                    <linearGradient id="holoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Head Outline (Abstract) */}
                <motion.path
                    d={isMale
                        ? "M50,60 Q100,20 150,60 L160,120 Q100,180 40,120 Z" // Square jaw
                        : "M50,60 Q100,20 150,60 L155,130 Q100,190 45,130 Z" // Soft jaw
                    }
                    fill="url(#holoGradient)"
                    stroke={color}
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                />

                {/* Eyes */}
                <motion.g animate={status === 'thinking' ? 'thinking' : status === 'wake-word-listening' || status === 'mic-recording' ? 'listening' : 'idle'} variants={eyeVariants}>
                    {/* Left Eye */}
                    <ellipse cx="70" cy="90" rx="12" ry="8" fill={color} filter="url(#glow)" />
                    {/* Right Eye */}
                    <ellipse cx="130" cy="90" rx="12" ry="8" fill={color} filter="url(#glow)" />
                </motion.g>

                {/* Nose (Minimal) */}
                <path d="M100,100 L95,120 L105,120 Z" fill={color} opacity="0.5" />

                {/* Mouth */}
                <motion.rect
                    x="80"
                    y="140"
                    width="40"
                    height={mouthHeight}
                    rx="2"
                    fill={color}
                    filter="url(#glow)"
                    animate={{
                        height: status === 'responding' ? mouthHeight : 2,
                        y: 140 - (status === 'responding' ? mouthHeight / 2 : 1) // Center vertically
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </svg>

            {/* Status Text Overlay */}
            {status === 'thinking' && (
                <motion.div
                    className="absolute bottom-0 text-[10px] text-jarvis-cyan font-mono tracking-widest uppercase"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    Processing
                </motion.div>
            )}
        </div>
    );
};

export default GnaniAvatar;
