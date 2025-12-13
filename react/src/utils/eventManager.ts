/**
 * EventManager - Advanced event listener tracking and cleanup verification
 * Provides automatic memory leak detection for window event listeners
 */

import { resourceTracker } from './resourceTracker';

interface TrackedListener {
    event: string;
    handler: EventListener;
    component: string;
    timestamp: number;
    stack?: string;
    resourceId?: string; // Unique ID for ResourceTracker
}

class EventManager {
    private listeners: Map<string, TrackedListener[]> = new Map();
    private static instance: EventManager;

    private constructor() {
        if (import.meta.env.MODE === 'development') {
            // Log active listeners periodically
            setInterval(() => {
                this.reportActiveListeners();
            }, 30000); // Every 30 seconds
        }
    }

    static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    /**
     * Add event listener with automatic tracking
     */
    addEventListener(
        event: string,
        handler: EventListener,
        options?: AddEventListenerOptions,
        componentName?: string
    ): () => void {
        const trackingKey = this.generateKey(event, handler);

        // Track the listener
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const resourceId = `${componentName || 'Unknown'}-${event}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const tracked: TrackedListener = {
            event,
            handler,
            component: componentName || this.getComponentName(),
            timestamp: Date.now(),
            stack: import.meta.env.MODE === 'development' ? new Error().stack : undefined,
            resourceId
        };

        this.listeners.get(event)!.push(tracked);

        // Track in ResourceTracker
        resourceTracker.track('listener', resourceId, handler, {
            event,
            component: componentName || 'Unknown',
            originalName: `${componentName || 'Unknown'}-${event}`
        });

        // Add the actual listener
        window.addEventListener(event, handler, options);

        // Return cleanup function
        return () => {
            this.removeEventListener(event, handler);
        };
    }

    /**
     * Remove event listener and verify cleanup
     */
    removeEventListener(event: string, handler: EventListener): void {
        window.removeEventListener(event, handler);

        // Remove from tracking
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.findIndex(l => l.handler === handler);
            if (index !== -1) {
                const listener = listeners[index];
                listeners.splice(index, 1);
                if (listeners.length === 0) {
                    this.listeners.delete(event);
                }

                // Release from ResourceTracker
                if (listener.resourceId) {
                    resourceTracker.release('listener', listener.resourceId);
                } else {
                    // Fallback for legacy/migrated listeners
                    resourceTracker.release('listener', `${listener.component}-${event}`);
                }
            }
        }

        // Verify cleanup in development
        if (import.meta.env.MODE === 'development') {
            setTimeout(() => {
                this.verifyCleanup(event, handler);
            }, 100);
        }
    }

    /**
     * Verify that a listener was actually removed
     */
    private verifyCleanup(event: string, handler: EventListener): void {
        const listeners = this.listeners.get(event);
        const stillExists = listeners?.some(l => l.handler === handler);

        if (stillExists) {
            const listener = listeners!.find(l => l.handler === handler);
            console.warn(
                `[EventManager] Cleanup verification failed for event "${event}"`,
                {
                    component: listener?.component,
                    age: listener ? Date.now() - listener.timestamp : 0,
                    stack: listener?.stack
                }
            );
        }
    }

    /**
     * Get listener count for a specific event
     */
    getListenerCount(event: string): number {
        return this.listeners.get(event)?.length || 0;
    }

    /**
     * Get all active listeners
     */
    getActiveListeners(): Map<string, TrackedListener[]> {
        return new Map(this.listeners);
    }

    /**
     * Report active listeners (development only)
     */
    private reportActiveListeners(): void {
        if (this.listeners.size === 0) return;

        const report: Record<string, any> = {};
        for (const [event, listeners] of this.listeners) {
            report[event] = listeners.map(l => ({
                component: l.component,
                age: Date.now() - l.timestamp,
                ageMinutes: ((Date.now() - l.timestamp) / 60000).toFixed(2)
            }));
        }

        console.log('[EventManager] Active listeners:', report);
    }

    /**
     * Generate unique key for event + handler combination
     */
    private generateKey(event: string, handler: EventListener): string {
        return `${event}_${handler.toString().substring(0, 50)}`;
    }

    /**
     * Try to extract component name from stack trace
     */
    private getComponentName(): string {
        try {
            const stack = new Error().stack || '';
            const lines = stack.split('\n');

            // Look for React component names in stack
            for (const line of lines) {
                const match = line.match(/at (\w+)/);
                if (match && match[1] && !['EventManager', 'addEventListener', 'useEffect'].includes(match[1])) {
                    return match[1];
                }
            }
        } catch (e) {
            // Ignore errors
        }
        return 'Unknown';
    }

    /**
     * Clear all tracked listeners (for testing)
     */
    clear(): void {
        this.listeners.clear();
    }

    /**
     * Get memory leak report
     */
    getLeakReport(thresholdMinutes: number = 5): TrackedListener[] {
        const leaks: TrackedListener[] = [];
        const threshold = thresholdMinutes * 60 * 1000;
        const now = Date.now();

        for (const listeners of this.listeners.values()) {
            for (const listener of listeners) {
                if (now - listener.timestamp > threshold) {
                    leaks.push(listener);
                }
            }
        }

        return leaks;
    }
    /**
     * Dispatch a custom event to the window
     */
    dispatchEvent(eventName: string, detail?: any): void {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
}

// Export singleton instance
export const eventManager = EventManager.getInstance();

// Export hook for React components
export const useEventListener = (
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
    componentName?: string
) => {
    return eventManager.addEventListener(event, handler, options, componentName);
};
