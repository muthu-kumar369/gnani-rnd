import React, { useEffect } from "react";
import { eventManager } from '../../../utils/eventManager';
import { motion, useAnimation } from "framer-motion";
import type { GnaniAppStatus } from '../../../hooks/useGnaniUIState';

interface CoreOrbProps {
    status: GnaniAppStatus;
    audioLevel: number;
}

const CoreOrb: React.FC<CoreOrbProps> = ({ status, audioLevel }) => {
    const controls = useAnimation();

    useEffect(() => {
        let scale = 1;
        let opacity = 0.8;
        let glow = 10;
        let color = "rgba(0, 240, 255, 0.8)"; // Default Cyan

        switch (status) {
            case 'idle':
                color = "rgba(0, 240, 255, 0.8)";
                controls.start({
                    scale: [1, 1.05, 1],
                    opacity: 0.6,
                    boxShadow: `0 0 20px ${color}`,
                    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                });
                break;
            case 'wake-word-listening':
            case 'mic-recording':
            case 'streaming':
            case 'receiving-stt':
                color = "rgba(76, 175, 80, 0.9)"; // Green for listening
                scale = 1 + audioLevel * 0.5;
                glow = 20 + audioLevel * 40;
                opacity = 1;
                controls.start({
                    scale: scale,
                    opacity: opacity,
                    boxShadow: `0 0 ${glow}px ${color}`,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                });
                break;
            case 'thinking':
                color = "rgba(150, 200, 255, 0.9)"; // Blue-ish for thinking
                controls.start({
                    scale: [0.9, 1.1, 0.9],
                    opacity: 0.9,
                    boxShadow: `0 0 30px ${color}`,
                    transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                });
                break;
            case 'responding':
                // Base state for responding
                color = "rgba(156, 39, 176, 0.9)"; // Purple for speaking
                controls.start({
                    scale: 1,
                    opacity: 1,
                    boxShadow: `0 0 40px ${color}`,
                    transition: { duration: 0.5, ease: "easeOut" }
                });
                break;
            case 'error':
                color = "rgba(255, 50, 50, 1)";
                controls.start({
                    scale: [1, 0.9, 1.1, 1],
                    opacity: 1,
                    boxShadow: `0 0 30px ${color}`,
                    transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                });
                break;
        }
    }, [status, audioLevel, controls]);

    // Event-driven pulse for speaking
    useEffect(() => {
        if (status !== 'responding') return;

        const handleWord = (_e: Event) => {
            // Pulse effect with purple color
            controls.start({
                scale: [1.2, 1],
                boxShadow: ["0 0 60px rgba(156, 39, 176, 1)", "0 0 40px rgba(156, 39, 176, 0.9)"],
                transition: { duration: 0.2, ease: "easeOut" }
            });
        };

        const cleanup = eventManager.addEventListener('tts:word', handleWord as EventListener, undefined, 'CoreOrb');
        return cleanup;
    }, [status, controls]);

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer Glow Ring */}
            <motion.div
                className="absolute w-32 h-32 rounded-full border border-jarvis-cyan/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Rotating Ring */}
            <motion.div
                className="absolute w-24 h-24 rounded-full border-t-2 border-b-2 border-jarvis-blue/50"
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Core Orb */}
            <motion.div
                className="w-16 h-16 bg-jarvis-cyan/20 rounded-full backdrop-blur-sm border border-jarvis-cyan/50"
                animate={controls}
            />
        </div>
    );
};

export default CoreOrb;
