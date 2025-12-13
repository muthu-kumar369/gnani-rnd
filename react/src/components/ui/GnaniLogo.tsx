import React from 'react';
import gnaniLogo from '../../assets/logo.svg';

interface GnaniLogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

const GnaniLogo: React.FC<GnaniLogoProps> = ({ className = '', size = 32, showText = true }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src={gnaniLogo}
                alt="Gnani Logo"
                style={{ width: size, height: size }}
                className="object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            />

            {showText && (
                <span className="font-mono font-bold text-xl tracking-[0.2em] text-white">
                    GNANI
                </span>
            )}
        </div>
    );
};

export default GnaniLogo;
