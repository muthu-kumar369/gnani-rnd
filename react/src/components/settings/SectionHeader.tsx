import React from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => {
    return (
        <div className="mb-8">
            <h3 className="text-2xl font-bold text-cyan-100 mb-2">{title}</h3>
            {description && (
                <p className="text-cyan-400/70 text-sm">{description}</p>
            )}
            <div className="h-px w-full bg-gradient-to-r from-cyan-500/50 to-transparent mt-4" />
        </div>
    );
};

export default SectionHeader;
