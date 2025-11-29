// react/src/components/gnani/AdvancedAvatar.tsx
import React, { useEffect, useState } from "react";
import { motion, useAnimation, type Variants } from "framer-motion";
import type { GnaniAppStatus } from '../../hooks/useGnaniUIState';

interface AdvancedAvatarProps {
    status: GnaniAppStatus;
    audioLevel: number; // 0 to 1
}

// Define variants OUTSIDE the component to ensure stable references
const baseRingVariants: Variants = {
    idle: {
        rotate: 360,
        scale: 1,
        opacity: 0.3,
        transition: { rotate: { duration: 20, repeat: Infinity, ease: "linear" } }
    },
    listening: {
        rotate: 360,
        scale: 1.1,
        opacity: 0.6,
        transition: { rotate: { duration: 4, repeat: Infinity, ease: "linear" } }
    },
    thinking: {
        rotate: 360,
        scale: 0.9,
        opacity: 0.8,
        transition: { rotate: { duration: 1, repeat: Infinity, ease: "linear" } }
    },
    speaking: {
        rotate: 360,
        scale: 1,
        opacity: 0.7,
        transition: { rotate: { duration: 8, repeat: Infinity, ease: "linear" } }
    },
    error: {
        rotate: 0,
        scale: 1,
        opacity: 0.5,
        transition: { duration: 0.5 }
    }
};

// Specific variants for each ring to avoid inline object creation
const ring1Variants: Variants = {
    ...baseRingVariants
};

const ring2Variants: Variants = {
    ...baseRingVariants,
    idle: { ...baseRingVariants.idle, rotate: -360, transition: { duration: 25, repeat: Infinity, ease: "linear" } },
    listening: { ...baseRingVariants.listening, rotate: -360, scale: 1.2, opacity: 0.4, transition: { duration: 5, repeat: Infinity, ease: "linear" } },
    thinking: { ...baseRingVariants.thinking, rotate: -360, scale: 1.1, opacity: 0.5, transition: { duration: 1.5, repeat: Infinity, ease: "linear" } },
    speaking: { ...baseRingVariants.speaking, rotate: -360, scale: 1.1, opacity: 0.5, transition: { duration: 10, repeat: Infinity, ease: "linear" } }
};

const ring3Variants: Variants = {
    ...baseRingVariants,
    idle: { ...baseRingVariants.idle, transition: { duration: 30, repeat: Infinity, ease: "linear" } },
    listening: { ...baseRingVariants.listening, scale: 1.1, opacity: 0.2, transition: { duration: 10, repeat: Infinity, ease: "linear" } },
    speaking: { ...baseRingVariants.speaking, opacity: 0.2, transition: { duration: 15, repeat: Infinity, ease: "linear" } }
};

const AdvancedAvatar: React.FC<AdvancedAvatarProps> = ({ status, audioLevel }) => {
    const coreControls = useAnimation();
    const [simulatedVolume, setSimulatedVolume] = useState(0);

    // Simulated Speaking Waveform Loop
    useEffect(() => {
        let animationFrameId: number;

        const animateSpeaking = () => {
            if (status === 'responding') {
                const time = Date.now() / 150;
                const noise = (Math.sin(time) + Math.cos(time * 1.3) + 2) / 4;
                setSimulatedVolume(0.3 + noise * 0.7);
                animationFrameId = requestAnimationFrame(animateSpeaking);
            } else {
                setSimulatedVolume(0);
            }
        };

        if (status === 'responding') {
            animateSpeaking();
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [status]);

    // Reactive Animation Logic for Core Orb (Audio Level / Volume)
    useEffect(() => {
        if (status === "wake-word-listening" || status === "mic-recording" || status === "streaming" || status === "receiving-stt") {
            const scale = 1 + audioLevel * 0.5;
            const glow = 10 + audioLevel * 30;

            coreControls.start({
                scale: scale,
                opacity: 1,
                filter: `drop-shadow(0 0 ${glow}px rgba(0, 255, 255, 0.9))`,
                transition: { type: "spring", stiffness: 300, damping: 20 }
            });
        } else if (status === "responding") {
            const speakScale = 1 + simulatedVolume * 0.3;
            const speakGlow = 15 + simulatedVolume * 25;

            coreControls.start({
                scale: speakScale,
                opacity: 1,
                filter: `drop-shadow(0 0 ${speakGlow}px rgba(0, 240, 255, 1))`,
                transition: { type: "spring", stiffness: 200, damping: 15 }
            });
        } else {
            switch (status) {
                case "idle":
                case "initializing":
                    coreControls.start({
                        scale: [1, 1.05, 1],
                        opacity: 0.8,
                        filter: "drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))",
                        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    });
                    break;
                case "thinking":
                    coreControls.start({
                        scale: [0.9, 1.1, 0.9],
                        opacity: 0.9,
                        filter: "drop-shadow(0 0 20px rgba(0, 200, 255, 0.8))",
                        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                    });
                    break;
                case "error":
                    coreControls.start({
                        scale: [1, 0.9, 1.1, 1],
                        opacity: 1,
                        filter: "drop-shadow(0 0 20px rgba(255, 50, 50, 1))",
                        transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                    });
                    break;
            }
        }
    }, [status, audioLevel, simulatedVolume, coreControls]);

    const getRingVariant = (s: GnaniAppStatus) => {
        switch (s) {
            case 'wake-word-listening':
            case 'mic-recording':
            case 'streaming':
            case 'receiving-stt': return 'listening';
            case 'thinking': return 'thinking';
            case 'responding': return 'speaking';
            case 'error': return 'error';
            default: return 'idle';
        }
    };

    const currentRingVariant = getRingVariant(status);

    // Helper to render circular visualizer bars
    const renderVisualizerBars = (count: number, radius: number, value: number, color: string) => {
        return [...Array(count)].map((_, i) => {
            const angle = (i / count) * 360;
            const height = 10 + (value * 40);

            return (
                <motion.div
                    key={i}
                    className={`absolute w-1 rounded-full ${color}`}
                    style={{
                        height: `${height}px`,
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
                    }}
                    animate={{
                        height: `${height}px`,
                        opacity: 0.6 + (value * 0.4),
                        boxShadow: `0 0 ${10 + value * 10}px ${color.replace('bg-', '')}`
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        mass: 0.5
                    }}
                />
            );
        });
    };

    // Helper to render horizontal waveform (for speaking)
    const renderHorizontalWaveform = () => {
        return (
            <div className="absolute flex gap-1 items-center justify-center z-20">
                {[...Array(12)].map((_, i) => {
                    const height = 10 + (simulatedVolume * 40 * (Math.random() * 0.5 + 0.5));
                    return (
                        <motion.div
                            key={`bar-${i}`}
                            className="w-1 bg-jarvis-cyan/80 rounded-full shadow-jarvis-glow"
                            animate={{
                                height: height,
                                opacity: 0.5 + (simulatedVolume * 0.5)
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 15
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-jarvis-blue/5 blur-3xl rounded-full" />

            {/* Ring 3 (Outer) */}
            <motion.div
                className="absolute w-64 h-64 border border-jarvis-cyan/20 rounded-full border-dashed"
                animate={currentRingVariant}
                variants={ring3Variants}
            />

            {/* Ring 2 (Middle) */}
            <motion.div
                className="absolute w-52 h-52 border-2 border-jarvis-blue/30 rounded-full border-t-transparent border-b-transparent"
                animate={currentRingVariant}
                variants={ring2Variants}
            />

            {/* Ring 1 (Inner) */}
            <motion.div
                className="absolute w-40 h-40 border-2 border-jarvis-cyan/50 rounded-full border-l-transparent border-r-transparent"
                animate={currentRingVariant}
                variants={ring1Variants}
            />

            {/* Audio Visualizer Bars (Listening - Circular) */}
            {(status === 'mic-recording' || status === 'streaming' || status === 'receiving-stt' || status === 'wake-word-listening') && (
                <div className="absolute inset-0 z-0">
                    {renderVisualizerBars(32, 80, audioLevel, 'bg-jarvis-cyan')}
                </div>
            )}

            {/* Speaking Waveform (Horizontal) */}
            {(status === 'responding') && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    {renderHorizontalWaveform()}
                </div>
            )}

            {/* Core Orb */}
            <motion.div
                className="relative z-10 w-24 h-24 bg-jarvis-blue/80 rounded-full flex items-center justify-center"
                animate={coreControls}
            >
                {/* Inner Core Detail */}
                <div className="absolute inset-2 border border-white/30 rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full opacity-50" />
            </motion.div>

            {/* Particle Effects for Thinking (Persistent, opacity toggled) */}
            <motion.div
                className="absolute w-full h-full pointer-events-none"
                animate={{
                    opacity: status === 'thinking' ? 1 : 0,
                    rotate: 360
                }}
                transition={{
                    opacity: { duration: 0.3 },
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                }}
            >
                <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />
                <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />
            </motion.div>
        </div>
    );
};

export default AdvancedAvatar;
