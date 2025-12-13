import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "relative font-mono tracking-wider rounded-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-jarvis-blue/20 border border-jarvis-blue text-jarvis-blue shadow-jarvis-glow hover:bg-jarvis-blue/30 hover:shadow-jarvis-glow-lg",
        secondary: "bg-jarvis-panel border border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:shadow-jarvis-border-glow",
        ghost: "bg-transparent border border-transparent text-jarvis-cyan/60 hover:text-jarvis-cyan hover:bg-jarvis-blue/5",
        danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300",
        outline: "bg-transparent border border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:bg-jarvis-blue/5"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Hover Effect Overlay */}
            {variant !== 'ghost' && (
                <div className="absolute inset-0 bg-jarvis-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            )}

            {isLoading ? (
                <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
            ) : (
                <>
                    {leftIcon}
                    <span className="relative z-10">{children}</span>
                    {rightIcon}
                </>
            )}
        </button>
    );
};

export default Button;
