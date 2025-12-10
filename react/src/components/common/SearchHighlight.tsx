import React from 'react';

interface SearchHighlightProps {
    text: string;
    searchTerm: string;
    className?: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ text, searchTerm, className = '' }) => {
    if (!searchTerm || !text) return <span className={className}>{text}</span>;

    // Escape special characters in search term for regex
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, index) =>
                part.toLowerCase() === searchTerm.toLowerCase() ? (
                    <mark key={index} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
};
