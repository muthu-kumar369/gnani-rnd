interface CleanupInfo {
    cleanup: () => void;
    registeredAt: number;
    metadata?: any;
    stack?: string;
}

/**
 * CleanupTracker - Tracks and verifies cleanup of resources
 * Stage 4 Task 4.4: Cleanup Verification
 */
class CleanupTracker {
    private cleanups = new Map<string, CleanupInfo>();
    private enabled = process.env.NODE_ENV === 'development';

    /**
     * Register a cleanup function
     */
    register(id: string, cleanup: () => void, metadata?: any) {
        if (!this.enabled) return;

        this.cleanups.set(id, {
            cleanup,
            registeredAt: Date.now(),
            metadata,
            stack: new Error().stack
        });
    }

    /**
     * Execute and remove a cleanup function
     */
    cleanup(id: string) {
        const info = this.cleanups.get(id);
        if (info) {
            try {
                info.cleanup();
            } catch (error) {
                console.error(`Cleanup failed for ${id}:`, error);
            }
            this.cleanups.delete(id);
        }
    }

    /**
     * Verify all cleanups have been called
     */
    verify() {
        if (!this.enabled) return;

        if (this.cleanups.size > 0) {
            console.warn('⚠️ Uncleaned resources detected:', {
                count: this.cleanups.size,
                resources: Array.from(this.cleanups.entries()).map(([id, info]) => ({
                    id,
                    age: Date.now() - info.registeredAt,
                    metadata: info.metadata,
                    stack: info.stack
                }))
            });
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        const byType = new Map<string, number>();

        this.cleanups.forEach(info => {
            const type = info.metadata?.type || 'unknown';
            byType.set(type, (byType.get(type) || 0) + 1);
        });

        return {
            total: this.cleanups.size,
            byType: Object.fromEntries(byType)
        };
    }

    /**
     * Clear all tracked cleanups (for testing)
     */
    clear() {
        this.cleanups.clear();
    }
}

export const cleanupTracker = new CleanupTracker();

// Verify cleanups periodically in development
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        cleanupTracker.verify();
    }, 60000); // Every minute
}
