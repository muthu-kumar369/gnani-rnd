import React from 'react';
import { motion } from 'framer-motion';

interface BatteryIconProps {
    level: number;
    isCharging: boolean;
    size?: number;
    className?: string;
}

const BatteryIcon: React.FC<BatteryIconProps> = ({ level, isCharging, size = 24, className = "" }) => {
    // Determine color based on level (Critical < 20, Low < 50, Normal > 50)
    // For charging, we always use the premium Cyan/Blue theme unless critically low
    const getFillColor = () => {
        if (isCharging) return "bg-cyan-400"; // Always cyan when charging for that "energy" look
        if (level <= 20) return "bg-red-500";
        if (level <= 50) return "bg-yellow-400";
        return "bg-cyan-400";
    };

    const getGlowColor = () => {
        if (isCharging) return "shadow-[0_0_10px_#22d3ee]";
        if (level <= 20) return "shadow-[0_0_10px_#ef4444]";
        if (level <= 50) return "shadow-[0_0_10px_#facc15]";
        return "shadow-[0_0_10px_#22d3ee]";
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size / 2 }}>
            {/* Battery Container (Glassmorphism) */}
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 24 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
            >
                {/* Main Body Frame */}
                <rect
                    x="1"
                    y="1"
                    width="20"
                    height="10"
                    rx="2"
                    stroke={isCharging ? "#22d3ee" : "#555"}
                    strokeWidth="1.5"
                    strokeOpacity={isCharging ? 0.8 : 0.5}
                    fill="rgba(0,0,0,0.6)"
                />
                {/* Terminal */}
                <path
                    d="M22 4C22.5523 4 23 4.44772 23 5V7C23 7.55228 22.5523 8 22 8V4Z"
                    fill={isCharging ? "#22d3ee" : "#555"}
                    fillOpacity={isCharging ? 0.8 : 0.5}
                />
            </svg>

            {/* Energy Fill */}
            <div className="absolute top-[15%] left-[8%] bottom-[15%] right-[12%] overflow-hidden rounded-sm">
                <motion.div
                    className={`h-full ${getFillColor()} ${getGlowColor()}`}
                    initial={{ width: 0 }}
                    animate={{
                        width: `${level}%`,
                        opacity: isCharging ? [0.6, 1, 0.6] : 1, // Pulse effect when charging
                    }}
                    transition={{
                        width: { duration: 0.5, ease: "easeOut" },
                        opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                >
                    {/* Charging Flow Effect (Energy moving through the cell) */}
                    {isCharging && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </motion.div>
            </div>

            {/* Charging Indicator (Subtle high-tech bolt integrated, not overlay) */}
            {isCharging && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {/* A small, sharp energy spark in the center */}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white" />
                    </svg>
                </motion.div>
            )}
        </div>
    );
};

export default BatteryIcon;
