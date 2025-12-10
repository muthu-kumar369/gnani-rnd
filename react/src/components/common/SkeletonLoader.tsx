import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
}

export const MessageSkeleton: React.FC<SkeletonLoaderProps> = ({ className = '' }) => (
    <div className={`animate-pulse space-y-2 ${className}`}>
        <div className="h-4 bg-cyan-500/20 rounded w-3/4"></div>
        <div className="h-4 bg-cyan-500/20 rounded w-1/2"></div>
        <div className="h-4 bg-cyan-500/20 rounded w-5/6"></div>
    </div>
);

export const ConversationSkeleton: React.FC<SkeletonLoaderProps> = ({ className = '' }) => (
    <div className={`animate-pulse space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-black/40 border border-transparent">
                <div className="h-4 bg-cyan-500/20 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-cyan-500/10 rounded w-1/3"></div>
            </div>
        ))}
    </div>
);

export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({
    count = 5,
    className = ''
}) => (
    <div className={`space-y-2 ${className}`}>
        {[...Array(count)].map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="h-12 bg-cyan-500/10 rounded"></div>
            </div>
        ))}
    </div>
);

export default MessageSkeleton;
