import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => {
    return (
        <div className={`flex items-center gap-3 ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`} onClick={() => !disabled && onChange(!checked)}>
            <div className={`relative w-10 h-5 rounded-full border transition-colors duration-300 ${checked ? 'bg-jarvis-blue/20 border-jarvis-blue shadow-jarvis-glow' : 'bg-jarvis-panel border-jarvis-border'}`}>
                <motion.div
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-md ${checked ? 'bg-jarvis-blue' : 'bg-jarvis-cyan/50'}`}
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
            {label && (
                <span className={`text-sm font-mono ${checked ? 'text-jarvis-text text-glow' : 'text-jarvis-cyan/60'}`}>
                    {label}
                </span>
            )}
        </div>
    );
};

export default Switch;
