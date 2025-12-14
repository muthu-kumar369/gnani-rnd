import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    error?: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
    leftIcon,
    rightIcon,
    error,
    className = '',
    containerClassName = '',
    disabled,
    ...props
}) => {
    return (
        <div className={`flex flex-col gap-1 ${containerClassName}`}>
            <div className={`relative flex items-center bg-canvas-surface/50 border rounded-full transition-all duration-300 group ${error
                ? 'border-status-error/50 focus-within:border-status-error'
                : 'border-glass-border focus-within:border-gnani-primary focus-within:shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>

                {leftIcon && (
                    <div className="pl-3 text-type-muted group-focus-within:text-gnani-primary transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    className={`w-full bg-transparent border-none py-2 px-3 text-sm text-type-primary placeholder:text-type-muted/50 focus:outline-none focus:ring-0 disabled:cursor-not-allowed ${className}`}
                    disabled={disabled}
                    {...props}
                />

                {rightIcon && (
                    <div className="pr-3 text-type-muted">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs text-status-error pl-2">{error}</span>
            )}
        </div>
    );
};

export default Input;
