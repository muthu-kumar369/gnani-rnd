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
            <div className={`relative w-10 h-5 rounded-full border transition-colors duration-300 ${checked ? 'bg-gnani-primary/20 border-gnani-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-canvas-surface border-glass-border'}`}>
                <motion.div
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-md ${checked ? 'bg-gnani-primary' : 'bg-type-muted/30'}`}
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
            {label && (
                <span className={`text-sm font-mono ${checked ? 'text-type-primary text-glow' : 'text-type-muted'}`}>
                    {label}
                </span>
            )}
        </div>
    );
};

export default Switch;
