import React, { useEffect, useState } from 'react';
import { eventManager } from '../../../utils/eventManager';
import { motion, AnimatePresence } from 'framer-motion';

const SpeakingAnimation: React.FC = () => {
    const [intensity, setIntensity] = useState(0);
    const [shockwaves, setShockwaves] = useState<{ id: number }[]>([]);

    useEffect(() => {
        const handleWord = () => {
            // Spike intensity
            setIntensity(1);
            setTimeout(() => setIntensity(0), 200);

            // Add a shockwave
            const id = Date.now();
            setShockwaves(prev => [...prev.slice(-4), { id }]); // Keep last 5
            setTimeout(() => {
                setShockwaves(prev => prev.filter(w => w.id !== id));
            }, 1000);
        };

        const cleanup = eventManager.addEventListener('tts:word', handleWord as EventListener, undefined, 'SpeakingAnimation');
        return cleanup;
    }, []);

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gnani-primary/5 blur-3xl rounded-full" />

            {/* Outer Rotating Ring */}
            <motion.div
                className="absolute w-64 h-64 border border-gnani-primary/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-gnani-secondary rounded-full shadow-[0_0_10px_rgba(var(--secondary-rgb),0.8)] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gnani-secondary rounded-full shadow-[0_0_10px_rgba(var(--secondary-rgb),0.8)] -translate-x-1/2 translate-y-1/2" />
            </motion.div>

            {/* Middle Dashed Ring */}
            <motion.div
                className="absolute w-48 h-48 border-2 border-dashed border-gnani-secondary/40 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Fast Ring */}
            <motion.div
                className="absolute w-36 h-36 border-t-2 border-b-2 border-gnani-primary/60 rounded-full"
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{
                    rotate: { duration: 5, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
            />

            {/* Shockwaves */}
            <AnimatePresence>
                {shockwaves.map(wave => (
                    <motion.div
                        key={wave.id}
                        className="absolute border border-gnani-secondary/50 rounded-full"
                        initial={{ width: 40, height: 40, opacity: 0.8 }}
                        animate={{ width: 200, height: 200, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                ))}
            </AnimatePresence>

            {/* Core Energy Sphere */}
            <motion.div
                className="relative z-10 w-20 h-20 bg-gnani-secondary/20 rounded-full backdrop-blur-sm flex items-center justify-center"
                animate={{
                    scale: 1 + (intensity * 0.3),
                    boxShadow: [
                        "0 0 20px rgba(var(--secondary-rgb), 0.4)",
                        "0 0 60px rgba(var(--secondary-rgb), 0.8)",
                        "0 0 20px rgba(var(--secondary-rgb), 0.4)"
                    ]
                }}
                transition={{
                    scale: { duration: 0.1 },
                    boxShadow: { duration: 2, repeat: Infinity }
                }}
            >
                {/* Inner Core Detail */}
                <div className="w-12 h-12 bg-gnani-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)]" />
                <div className="absolute w-full h-full border border-gnani-secondary/50 rounded-full animate-ping opacity-20" />
            </motion.div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    animate={{
                        y: [-20, 20, -20],
                        x: [-20, 20, -20],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut"
                    }}
                    style={{
                        top: `${50 + (Math.random() * 40 - 20)}%`,
                        left: `${50 + (Math.random() * 40 - 20)}%`
                    }}
                />
            ))}
        </div>
    );
};

export default SpeakingAnimation;
