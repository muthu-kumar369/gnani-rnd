import React, { useEffect, useState, useMemo, useRef } from 'react';
import { eventManager } from '../../../utils/eventManager';
import { motion, useSpring, useTransform } from 'framer-motion';
import { type GnaniAppStatus } from '../../../hooks/useGnaniUIState';
import { AVATAR_ASSETS, MOUTH_SPRITE_CONFIG, type AvatarGender, type Viseme } from './AvatarConfig';
import { LipSyncEngine } from './LipSyncEngine';

interface RealHumanAvatarProps {
    status: GnaniAppStatus;
    isSpeaking: boolean;
    gender: AvatarGender;
}

const RealHumanAvatar: React.FC<RealHumanAvatarProps> = ({ status, isSpeaking, gender }) => {
    const [currentViseme, setCurrentViseme] = useState<Viseme>('neutral');
    const lipSyncEngine = useMemo(() => new LipSyncEngine(), []);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parallax Mouse Tracking
    const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            mouseX.set(x);
            mouseY.set(y);
        };

        const cleanup = eventManager.addEventListener('mousemove', handleMouseMove as EventListener, undefined, 'RealHumanAvatar');
        return cleanup;
    }, [mouseX, mouseY]);

    const rotateX = useTransform(mouseY, [-1, 1], [10, -10]); // Look up/down
    const rotateY = useTransform(mouseX, [-1, 1], [-10, 10]); // Look left/right
    const translateX = useTransform(mouseX, [-1, 1], [-5, 5]);
    const translateY = useTransform(mouseY, [-1, 1], [-5, 5]);


    // Subscribe to lip sync
    useEffect(() => {
        const unsubscribe = lipSyncEngine.subscribe((viseme) => {
            setCurrentViseme(viseme);
        });
        return () => {
            unsubscribe();
            lipSyncEngine.cleanup();
        };
    }, [lipSyncEngine]);

    // Calculate sprite position
    const getSpriteStyle = (viseme: Viseme) => {
        const index = MOUTH_SPRITE_CONFIG.map[viseme] || 0;
        const col = index % MOUTH_SPRITE_CONFIG.cols;
        const row = Math.floor(index / MOUTH_SPRITE_CONFIG.cols);

        const x = (col / (MOUTH_SPRITE_CONFIG.cols - 1)) * 100;
        const y = (row / (MOUTH_SPRITE_CONFIG.rows - 1 || 1)) * 100;

        return {
            backgroundImage: `url(${AVATAR_ASSETS.mouths})`,
            backgroundPosition: `${x}% ${y}%`,
            backgroundSize: `${MOUTH_SPRITE_CONFIG.cols * 100}% ${MOUTH_SPRITE_CONFIG.rows * 100}%`
        };
    };

    // Breathing animation variant
    const breatheVariant: import('framer-motion').Variants = {
        animate: {
            scale: [1, 1.02, 1],
            y: [0, -5, 0],
            transition: {
                duration: (status === 'wake-word-listening' || status === 'mic-recording' || status === 'receiving-stt') ? 2 : 5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="relative w-96 h-96 flex items-center justify-center perspective-1000" ref={containerRef}>
            {/* Holographic Floor Glow */}
            <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-jarvis-cyan/20 to-transparent blur-xl" />

            <motion.div
                className="relative w-full h-full rounded-full overflow-hidden border border-jarvis-cyan/40 bg-black/80 backdrop-blur-sm"
                style={{
                    rotateX,
                    rotateY,
                    x: translateX,
                    y: translateY,
                    boxShadow: '0 0 50px rgba(0, 240, 255, 0.15), inset 0 0 20px rgba(0, 240, 255, 0.2)'
                }}
                variants={breatheVariant}
                animate="animate"
            >
                {/* Base Face */}
                <img
                    src={AVATAR_ASSETS[gender].base}
                    alt="Avatar Base"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen"
                />

                {/* Mouth Overlay */}
                <div
                    className="absolute left-1/2 top-[60%] -translate-x-1/2 w-32 h-20 mix-blend-hard-light opacity-90"
                    style={getSpriteStyle(isSpeaking ? currentViseme : 'neutral')}
                />

                {/* VFX: Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%] pointer-events-none" />

                {/* VFX: Moving Scanline */}
                <motion.div
                    className="absolute inset-0 w-full h-[2px] bg-jarvis-cyan/50 z-20"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* VFX: Glitch Overlay (Random) */}
                <motion.div
                    className="absolute inset-0 bg-jarvis-cyan/10 mix-blend-color-dodge z-30"
                    animate={{ opacity: [0, 0, 0.2, 0, 0] }}
                    transition={{ duration: 5, repeat: Infinity, times: [0, 0.9, 0.92, 0.95, 1] }}
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80 z-40" />
            </motion.div>
        </div>
    );
};

export default RealHumanAvatar;
