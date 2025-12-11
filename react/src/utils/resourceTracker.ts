/**
 * ResourceTracker - Enhanced resource tracking and leak detection
 * Tracks timers, event listeners, gRPC streams, and other resources
 * Integrates with EventManager for comprehensive monitoring
 */

export type ResourceType = 'timer' | 'listener' | 'stream' | 'custom';

interface TrackedResource {
    type: ResourceType;
    name: string;
    resource: any;
    timestamp: number;
    stack?: string;
    metadata?: Record<string, any>;
}

class ResourceTracker {
    private resources: Map<string, TrackedResource> = new Map();
    private static instance: ResourceTracker;
    private reportInterval: NodeJS.Timeout | null = null;
    private enabled = import.meta.env.MODE === 'development';

    private constructor() {
        if (this.enabled) {
            // Periodic leak detection every 60 seconds
            this.reportInterval = setInterval(() => {
                this.detectLeaks();
            }, 60000);
        }
    }

    static getInstance(): ResourceTracker {
        if (!ResourceTracker.instance) {
            ResourceTracker.instance = new ResourceTracker();
        }
        return ResourceTracker.instance;
    }

    /**
     * Track a resource
     */
    track(type: ResourceType, name: string, resource: any, metadata?: Record<string, any>): void {
        if (!this.enabled) return;

        const key = this.generateKey(type, name);

        const tracked: TrackedResource = {
            type,
            name,
            resource,
            timestamp: Date.now(),
            stack: new Error().stack,
            metadata
        };

        this.resources.set(key, tracked);
        console.debug(`[ResourceTracker] Tracked ${type}: ${name}`, metadata);
    }

    /**
     * Release a tracked resource
     */
    release(type: ResourceType, name: string): void {
        if (!this.enabled) return;

        const key = this.generateKey(type, name);
        const resource = this.resources.get(key);

        if (resource) {
            this.resources.delete(key);
            const age = Date.now() - resource.timestamp;
            console.debug(`[ResourceTracker] Released ${type}: ${name} (age: ${age}ms)`);
        } else {
            console.warn(`[ResourceTracker] Attempted to release untracked ${type}: ${name}`);
        }
    }

    /**
     * Get resources older than threshold
     */
    getLeaks(thresholdMs: number = 60000): TrackedResource[] {
        if (!this.enabled) return [];

        const now = Date.now();
        const leaks: TrackedResource[] = [];

        for (const resource of this.resources.values()) {
            if (now - resource.timestamp > thresholdMs) {
                leaks.push(resource);
            }
        }

        return leaks;
    }

    /**
     * Get all tracked resources
     */
    getAll(): TrackedResource[] {
        return Array.from(this.resources.values());
    }

    /**
     * Get resources by type
     */
    getByType(type: ResourceType): TrackedResource[] {
        return Array.from(this.resources.values()).filter(r => r.type === type);
    }

    /**
     * Get resource count
     */
    getCount(): number {
        return this.resources.size;
    }

    /**
     * Get resource count by type
     */
    getCountByType(type: ResourceType): number {
        return this.getByType(type).length;
    }

    /**
     * Get summary report
     */
    getReport(): Record<ResourceType, number> {
        const report: Record<string, number> = {
            timer: 0,
            listener: 0,
            stream: 0,
            custom: 0
        };

        for (const resource of this.resources.values()) {
            report[resource.type]++;
        }

        return report as Record<ResourceType, number>;
    }

    /**
     * Detect and report leaks
     */
    private detectLeaks(): void {
        const leaks = this.getLeaks(60000); // 1 minute threshold

        if (leaks.length > 0) {
            console.warn(`[ResourceTracker] Detected ${leaks.length} potential resource leak(s):`);

            const grouped = this.groupByType(leaks);
            for (const [type, resources] of Object.entries(grouped)) {
                console.warn(`  ${type}: ${resources.length} leak(s)`);
                resources.forEach(r => {
                    const age = Date.now() - r.timestamp;
                    const ageMinutes = (age / 60000).toFixed(2);
                    console.warn(`    - ${r.name} (age: ${ageMinutes} min)`, {
                        metadata: r.metadata,
                        stack: r.stack
                    });
                });
            }
        }

        // Also log summary
        const report = this.getReport();
        const total = Object.values(report).reduce((sum, count) => sum + count, 0);

        if (total > 0) {
            console.log('[ResourceTracker] Active resources:', report, `(total: ${total})`);
        }
    }

    /**
     * Group resources by type
     */
    private groupByType(resources: TrackedResource[]): Record<string, TrackedResource[]> {
        const grouped: Record<string, TrackedResource[]> = {};

        for (const resource of resources) {
            if (!grouped[resource.type]) {
                grouped[resource.type] = [];
            }
            grouped[resource.type].push(resource);
        }

        return grouped;
    }

    /**
     * Generate unique key for resource
     */
    private generateKey(type: ResourceType, name: string): string {
        return `${type}:${name}`;
    }

    /**
     * Clear all tracked resources (for testing)
     */
    clear(): void {
        this.resources.clear();
    }

    /**
     * Cleanup (stop periodic reporting)
     */
    destroy(): void {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }
}

// Export singleton instance
export const resourceTracker = ResourceTracker.getInstance();
