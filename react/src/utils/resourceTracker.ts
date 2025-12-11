interface ResourceInfo {
    type: string;
    resource: any;
    metadata?: any;
    createdAt: number;
    stack?: string;
}

interface ResourceLeak {
    id: string;
    type: string;
    age: number;
    metadata?: any;
    stack?: string;
}

/**
 * ResourceTracker - Tracks resources and detects memory leaks
 * Stage 4 Task 4.5: Resource Tracking & Memory Leak Detection
 */
class ResourceTracker {
    private resources = new Map<string, ResourceInfo>();
    private enabled = process.env.NODE_ENV === 'development';

    /**
     * Track a resource
     */
    track(type: string, resource: any, metadata?: any): string {
        if (!this.enabled) return '';

        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        this.resources.set(id, {
            type,
            resource,
            metadata,
            createdAt: Date.now(),
            stack: new Error().stack
        });

        return id;
    }

    /**
     * Release a tracked resource
     */
    release(id: string) {
        this.resources.delete(id);
    }

    /**
     * Get potential memory leaks (resources older than threshold)
     */
    getLeaks(threshold: number = 60000): ResourceLeak[] {
        if (!this.enabled) return [];

        const now = Date.now();
        const leaks: ResourceLeak[] = [];

        for (const [id, info] of this.resources) {
            const age = now - info.createdAt;
            if (age > threshold) {
                leaks.push({
                    id,
                    type: info.type,
                    age,
                    metadata: info.metadata,
                    stack: info.stack
                });
            }
        }

        return leaks;
    }

    /**
     * Generate leak report
     */
    report() {
        if (!this.enabled) return null;

        const leaks = this.getLeaks();

        if (leaks.length > 0) {
            console.error('🔴 Memory leaks detected:', leaks);
        }

        const byType = new Map<string, number>();
        this.resources.forEach(info => {
            byType.set(info.type, (byType.get(info.type) || 0) + 1);
        });

        return {
            totalResources: this.resources.size,
            leaks: leaks.length,
            byType: Object.fromEntries(byType),
            leakDetails: leaks
        };
    }

    /**
     * Get current statistics
     */
    getStats() {
        const byType = new Map<string, number>();
        this.resources.forEach(info => {
            byType.set(info.type, (byType.get(info.type) || 0) + 1);
        });

        return {
            total: this.resources.size,
            byType: Object.fromEntries(byType)
        };
    }

    /**
     * Clear all tracked resources (for testing)
     */
    clear() {
        this.resources.clear();
    }
}

export const resourceTracker = new ResourceTracker();

// Report leaks periodically in development
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const report = resourceTracker.report();
        if (report && report.leaks > 0) {
            console.warn('⚠️ Resource leak report:', report);
        }
    }, 120000); // Every 2 minutes
}
