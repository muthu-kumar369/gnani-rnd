import React from 'react';
import { motion } from 'framer-motion';

interface LoginLoaderProps {
    message?: string;
}

const LoginLoader: React.FC<LoginLoaderProps> = ({ message = 'Authenticating...' }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-jarvis-bg">
            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-grid-pattern animate-pulse" />
            </div>

            {/* Holographic rings */}
            <div className="relative">
                {/* Outer ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                    style={{ width: '200px', height: '200px', left: '-100px', top: '-100px' }}
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                />

                {/* Middle ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-500/40"
                    style={{ width: '150px', height: '150px', left: '-75px', top: '-75px' }}
                    animate={{
                        rotate: -360,
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        rotate: { duration: 2.5, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
                    }}
                />

                {/* Inner ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-400/50"
                    style={{ width: '100px', height: '100px', left: '-50px', top: '-50px' }}
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
                    }}
                />

                {/* Center core with pulsing glow */}
                <motion.div
                    className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                    animate={{
                        boxShadow: [
                            '0 0 30px rgba(6,182,212,0.6)',
                            '0 0 50px rgba(6,182,212,0.9)',
                            '0 0 30px rgba(6,182,212,0.6)',
                        ],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {/* Inner glow */}
                    <motion.div
                        className="absolute inset-2 rounded-full bg-white/20"
                        animate={{
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </motion.div>

                {/* Orbiting particles */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-cyan-400"
                        style={{
                            left: '0',
                            top: '0',
                            boxShadow: '0 0 10px rgba(6,182,212,0.8)',
                        }}
                        animate={{
                            rotate: 360,
                            x: [0, 60 * Math.cos((i * Math.PI) / 2), 0],
                            y: [0, 60 * Math.sin((i * Math.PI) / 2), 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>

            {/* Loading text */}
            <motion.div
                className="absolute mt-48 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-xl font-bold text-cyan-400 mb-2" style={{ textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>
                    {message}
                </h3>

                {/* Animated dots */}
                <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-cyan-400"
                            animate={{
                                opacity: [0.3, 1, 0.3],
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>

                {/* Scanning line effect */}
                <motion.div
                    className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    style={{ width: '200px' }}
                    animate={{
                        opacity: [0, 1, 0],
                        scaleX: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.div>

            {/* Corner accents */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
                const positions = {
                    'top-left': 'top-4 left-4',
                    'top-right': 'top-4 right-4',
                    'bottom-left': 'bottom-4 left-4',
                    'bottom-right': 'bottom-4 right-4',
                };

                return (
                    <motion.div
                        key={corner}
                        className={`absolute ${positions[corner as keyof typeof positions]} w-8 h-8`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div className={`absolute ${corner.includes('top') ? 'top-0' : 'bottom-0'} ${corner.includes('left') ? 'left-0' : 'right-0'} w-8 h-0.5 bg-cyan-500/50`} />
                        <div className={`absolute ${corner.includes('top') ? 'top-0' : 'bottom-0'} ${corner.includes('left') ? 'left-0' : 'right-0'} w-0.5 h-8 bg-cyan-500/50`} />
                    </motion.div>
                );
            })}
        </div>
    );
};

export default LoginLoader;
