import { useState, useEffect, useCallback } from 'react';

interface RateLimitInfo {
    remainingRequests: number;
    maxRequests: number;
    resetTime: Date;
    isLimited: boolean;
}

export const useRateLimit = (maxRequests: number = 60, windowMs: number = 60000): RateLimitInfo & { recordRequest: () => void } => {
    const [remainingRequests, setRemainingRequests] = useState(maxRequests);
    const [resetTime, setResetTime] = useState(new Date(Date.now() + windowMs));
    const [requestTimestamps, setRequestTimestamps] = useState<number[]>([]);

    // Clean up old timestamps and reset counter
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const validTimestamps = requestTimestamps.filter(ts => now - ts < windowMs);

            if (validTimestamps.length !== requestTimestamps.length) {
                setRequestTimestamps(validTimestamps);
                setRemainingRequests(maxRequests - validTimestamps.length);
            }

            // Update reset time if window has passed
            if (now >= resetTime.getTime()) {
                setResetTime(new Date(now + windowMs));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [requestTimestamps, windowMs, maxRequests, resetTime]);

    const recordRequest = useCallback(() => {
        const now = Date.now();
        const validTimestamps = requestTimestamps.filter(ts => now - ts < windowMs);

        if (validTimestamps.length < maxRequests) {
            const newTimestamps = [...validTimestamps, now];
            setRequestTimestamps(newTimestamps);
            setRemainingRequests(maxRequests - newTimestamps.length);

            // Set reset time to when the oldest request expires
            if (newTimestamps.length > 0) {
                setResetTime(new Date(newTimestamps[0] + windowMs));
            }
        }
    }, [requestTimestamps, windowMs, maxRequests]);

    return {
        remainingRequests,
        maxRequests,
        resetTime,
        isLimited: remainingRequests === 0,
        recordRequest,
    };
};
