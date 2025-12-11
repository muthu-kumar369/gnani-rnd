import { useEffect, useRef } from 'react';
import { eventManager } from '../utils/eventManager';

/**
 * React hook for managed event listeners with automatic cleanup verification
 * 
 * @example
 * ```tsx
 * useManagedEventListener('keydown', (e) => {
 *   console.log('Key pressed:', e.key);
 * });
 * ```
 */
export const useManagedEventListener = (
    event: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
    deps: React.DependencyList = []
) => {
    const handlerRef = useRef(handler);

    // Update ref when handler changes
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        // Create stable handler that calls the ref
        const stableHandler = (e: Event) => handlerRef.current(e);

        // Get component name from stack
        const componentName = new Error().stack?.split('\n')[2]?.match(/at (\w+)/)?.[1] || 'Unknown';

        // Add listener with tracking
        const cleanup = eventManager.addEventListener(
            event,
            stableHandler as EventListener,
            options,
            componentName
        );

        return cleanup;
    }, [event, options, ...deps]);
};
