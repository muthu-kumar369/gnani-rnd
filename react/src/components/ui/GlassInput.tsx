import React, { type InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    containerClassName?: string;
}

const GlassInput: React.FC<GlassInputProps> = ({ className = '', containerClassName = '', icon, ...props }) => {
    return (
        <div className={`relative group ${containerClassName}`}>
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-type-muted group-focus-within:text-gnani-primary transition-colors pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                className={`w-full bg-canvas-surface border border-glass-border rounded-lg py-2 ${icon ? 'pl-9' : 'pl-3'} pr-3 text-sm text-type-primary placeholder:text-type-muted/60 focus:outline-none focus:border-gnani-primary/50 focus:bg-canvas-surface/80 focus:ring-1 focus:ring-gnani-primary/20 transition-all ${className}`}
                {...props}
            />
        </div>
    );
};

export default GlassInput;
