import React, { type InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    containerClassName?: string;
}

const GlassInput: React.FC<GlassInputProps> = ({ className = '', containerClassName = '', icon, ...props }) => {
    return (
        <div className={`relative group ${containerClassName}`}>
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-jarvis-cyan transition-colors pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                className={`w-full bg-black/40 border border-white/10 rounded-lg py-2 ${icon ? 'pl-9' : 'pl-3'} pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-jarvis-cyan/50 focus:bg-black/60 focus:ring-1 focus:ring-jarvis-cyan/20 transition-all ${className}`}
                {...props}
            />
        </div>
    );
};

export default GlassInput;
