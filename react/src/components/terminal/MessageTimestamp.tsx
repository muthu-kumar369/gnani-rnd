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
            <span className="text-[10px] text-cyan-700 font-mono cursor-help">
                [{relativeTime}]
            </span>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-cyan-500/30 rounded text-[10px] text-cyan-300 font-mono whitespace-nowrap shadow-lg backdrop-blur-sm z-50">
                    {absoluteTime}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
                </div>
            )}
        </span>
    );
};

export default MessageTimestamp;
