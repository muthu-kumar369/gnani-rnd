import React from 'react';
import * as Icons from 'lucide-react';
import { LayoutTemplate } from 'lucide-react';

interface DynamicIconProps {
    name: string;
    size?: number;
    className?: string;
    fallback?: React.ReactNode;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 16, className = '', fallback }) => {
    // Access the icon from the Lucide namespace
    // @ts-ignore - Lucide exports are not strictly indexed by string in TS types
    const IconComponent = Icons[name];

    if (!IconComponent) {
        return fallback ? <>{fallback}</> : <LayoutTemplate size={size} className={className} />;
    }

    return <IconComponent size={size} className={className} />;
};

export default DynamicIcon;
