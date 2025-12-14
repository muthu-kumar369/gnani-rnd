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
        primary: "bg-gnani-primary/10 border border-gnani-primary text-gnani-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] hover:bg-gnani-primary/20 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]",
        secondary: "bg-canvas-surface border border-glass-border text-type-secondary hover:text-gnani-primary hover:border-gnani-primary hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]",
        ghost: "bg-transparent border border-transparent text-type-secondary hover:text-gnani-primary hover:bg-gnani-primary/5",
        danger: "bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 hover:border-status-error/50 hover:text-status-error",
        outline: "bg-transparent border border-glass-border text-type-secondary hover:text-gnani-primary hover:border-gnani-primary hover:bg-gnani-primary/5"
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
                <div className="absolute inset-0 bg-gnani-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
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
