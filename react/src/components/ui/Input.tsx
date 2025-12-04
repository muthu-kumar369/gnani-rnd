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
            <div className={`relative flex items-center bg-black/30 border rounded-full transition-all duration-300 group ${error
                    ? 'border-red-500/50 focus-within:border-red-500'
                    : 'border-jarvis-border focus-within:border-jarvis-blue focus-within:shadow-jarvis-border-glow'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>

                {leftIcon && (
                    <div className="pl-3 text-jarvis-text/50 group-focus-within:text-jarvis-blue transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    className={`w-full bg-transparent border-none py-2 px-3 text-sm text-jarvis-text placeholder:text-jarvis-text/30 focus:outline-none focus:ring-0 disabled:cursor-not-allowed ${className}`}
                    disabled={disabled}
                    {...props}
                />

                {rightIcon && (
                    <div className="pr-3 text-jarvis-text/50">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-xs text-red-400 pl-2">{error}</span>
            )}
        </div>
    );
};

export default Input;
