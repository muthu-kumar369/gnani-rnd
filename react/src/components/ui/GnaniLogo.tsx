import React from 'react';

interface GnaniLogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

const GnaniLogo: React.FC<GnaniLogoProps> = ({ className = '', size = 32, showText = true }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-jarvis-cyan"
            >
                {/* Outer Hexagon/Neural Node */}
                <path
                    d="M20 2L37.3205 12V32L20 42L2.67949 32V12L20 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-80"
                />

                {/* Inner Connections (Abstract 'G') */}
                <path
                    d="M20 12V20L28 24M20 20L12 24M20 20V28"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Central Pulse/Core */}
                <circle cx="20" cy="20" r="3" fill="currentColor" className="animate-pulse" />

                {/* Decorative Glow */}
                <defs>
                    <filter id="glow" x="-10" y="-10" width="60" height="60" filterUnits="userSpaceOnUse">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
            </svg>

            {showText && (
                <span className="font-mono font-bold text-xl tracking-[0.2em] text-white">
                    GNANI
                </span>
            )}
        </div>
    );
};

export default GnaniLogo;
