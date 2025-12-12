import React from 'react';

const MessageSkeleton: React.FC = () => {
    return (
        <div className="flex gap-4 max-w-4xl mx-auto w-full animate-pulse p-4">
            {/* Avatar Skeleton */}
            <div className="w-8 h-8 bg-white/10 rounded-full shrink-0" />

            {/* Content Skeleton */}
            <div className="flex flex-col gap-2 w-full max-w-[85%]">
                {/* Header Skeleton */}
                <div className="h-3 bg-white/10 rounded w-24 mb-1" />

                {/* Bubble Skeleton */}
                <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 w-full">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-5/6" />
                </div>
            </div>
        </div>
    );
};

export default MessageSkeleton;
