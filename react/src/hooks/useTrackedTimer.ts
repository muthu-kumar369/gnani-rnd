import { useEffect, useRef, useCallback } from 'react';
import { resourceTracker } from '../utils/resourceTracker';

/**
 * Hook for tracked setTimeout/setInterval with automatic cleanup
 * 
 * @example
 * ```tsx
 * const { setTimeout, setInterval } = useTrackedTimer('MyComponent');
 * 
 * useEffect(() => {
 *   const timer = setTimeout(() => console.log('Hello'), 1000);
 *   return () => clearTimeout(timer);
 * }, []);
 * ```
 */
export const useTrackedTimer = (componentName: string) => {
    const timersRef = useRef<Set<number>>(new Set());

    const trackedSetTimeout = useCallback((callback: () => void, delay: number): number => {
        const timerId = window.setTimeout(() => {
            callback();
            timersRef.current.delete(timerId);
            resourceTracker.release('timer', `${componentName}-timeout-${timerId}`);
        }, delay) as unknown as number;

        timersRef.current.add(timerId);
        resourceTracker.track('timer', `${componentName}-timeout-${timerId}`, timerId, {
            type: 'timeout',
            delay,
            component: componentName
        });

        return timerId;
    }, [componentName]);

    const trackedSetInterval = useCallback((callback: () => void, delay: number): number => {
        const timerId = window.setInterval(callback, delay) as unknown as number;

        timersRef.current.add(timerId);
        resourceTracker.track('timer', `${componentName}-interval-${timerId}`, timerId, {
            type: 'interval',
            delay,
            component: componentName
        });

        return timerId;
    }, [componentName]);

    const trackedClearTimeout = useCallback((timerId: number) => {
        window.clearTimeout(timerId);
        timersRef.current.delete(timerId);
        resourceTracker.release('timer', `${componentName}-timeout-${timerId}`);
    }, [componentName]);

    const trackedClearInterval = useCallback((timerId: number) => {
        window.clearInterval(timerId);
        timersRef.current.delete(timerId);
        resourceTracker.release('timer', `${componentName}-interval-${timerId}`);
    }, [componentName]);

    // Cleanup all timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach(timerId => {
                window.clearTimeout(timerId);
                window.clearInterval(timerId);
                // Try both timeout and interval release
                resourceTracker.release('timer', `${componentName}-timeout-${timerId}`);
                resourceTracker.release('timer', `${componentName}-interval-${timerId}`);
            });
            timersRef.current.clear();
        };
    }, [componentName]);

    return {
        setTimeout: trackedSetTimeout,
        setInterval: trackedSetInterval,
        clearTimeout: trackedClearTimeout,
        clearInterval: trackedClearInterval
    };
};
