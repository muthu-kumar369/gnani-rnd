import { useState, useEffect, useCallback } from 'react';

interface UseTimeoutReturn {
    timeLeft: number;
    isActive: boolean;
    start: () => void;
    stop: () => void;
    extend: (seconds: number) => void;
    reset: () => void;
}

export const useTimeout = (duration: number, onTimeout: () => void): UseTimeoutReturn => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    onTimeout();
                    setIsActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, onTimeout]);

    const start = useCallback(() => {
        setIsActive(true);
        setTimeLeft(duration);
    }, [duration]);

    const stop = useCallback(() => {
        setIsActive(false);
    }, []);

    const extend = useCallback((seconds: number) => {
        setTimeLeft((prev) => prev + seconds);
    }, []);

    const reset = useCallback(() => {
        setTimeLeft(duration);
        setIsActive(false);
    }, [duration]);

    return { timeLeft, isActive, start, stop, extend, reset };
};
