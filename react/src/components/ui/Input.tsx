import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-jarvis-cyan/50 group-focus-within:text-jarvis-blue transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`w-full bg-jarvis-panel border-b-2 border-jarvis-border px-4 py-2 text-sm text-jarvis-text placeholder-jarvis-cyan/30 focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-t-sm ${icon ? 'pl-10' : ''} ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
                    {...props}
                />
                {/* Animated Underline */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-jarvis-blue group-focus-within:w-full transition-all duration-500 ease-out" />
            </div>
            {error && (
                <span className="text-xs text-red-400 font-mono mt-1 ml-1">{error}</span>
            )}
        </div>
    );
};

export default Input;
