import React, { useEffect, useState } from 'react';
import { formatRelativeTime, formatAbsoluteTime, shouldUpdateTimestamp } from '../../utils/date-formatter';

interface MessageTimestampProps {
    timestamp: number;
    className?: string;
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp, className = '' }) => {
    const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(timestamp));
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Initial update
        setRelativeTime(formatRelativeTime(timestamp));

        // Set up auto-update interval
        const updateInterval = shouldUpdateTimestamp(timestamp);
        const intervalId = setInterval(() => {
            setRelativeTime(formatRelativeTime(timestamp));
        }, updateInterval);

        return () => clearInterval(intervalId);
    }, [timestamp]);

    const absoluteTime = formatAbsoluteTime(timestamp);

    return (
        <span
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="text-[10px] text-type-muted/60 hover:text-gnani-primary/80 font-mono cursor-help transition-colors">
                [{relativeTime}]
            </span>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-canvas-popover border border-glass-border rounded text-[10px] text-gnani-primary font-mono whitespace-nowrap shadow-glass backdrop-blur-sm z-50">
                    {absoluteTime}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-canvas-popover" />
                </div>
            )}
        </span>
    );
};

export default MessageTimestamp;
