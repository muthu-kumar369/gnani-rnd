import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "relative overflow-hidden font-mono tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group";

    const variants = {
        primary: "bg-jarvis-blue/10 border border-jarvis-blue text-jarvis-blue hover:bg-jarvis-blue/20 hover:shadow-jarvis-glow",
        secondary: "bg-jarvis-panel border border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:shadow-jarvis-border-glow",
        danger: "bg-red-900/20 border border-red-500/50 text-red-400 hover:bg-red-900/40 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        ghost: "bg-transparent hover:bg-jarvis-blue/5 text-jarvis-cyan/60 hover:text-jarvis-blue",
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Hover Scan Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-jarvis-blue/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

            {isLoading ? (
                <span className="animate-spin-slow w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : icon}

            <motion.span className="relative z-10">{children}</motion.span>
        </motion.button>
    );
};

export default Button;
