interface QueuedRequest {
    id: string;
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    timestamp: number;
}

class OfflineQueue {
    private queue: QueuedRequest[] = [];
    private readonly STORAGE_KEY = 'gnani_offline_queue';

    constructor() {
        this.loadQueue();
    }

    private loadQueue() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
        }
    }

    private saveQueue() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    add(url: string, method: string, body?: any, headers?: Record<string, string>) {
        const request: QueuedRequest = {
            id: Math.random().toString(36).substr(2, 9),
            url,
            method,
            body,
            headers,
            timestamp: Date.now(),
        };

        this.queue.push(request);
        this.saveQueue();

        console.log('[Offline Queue] Added request:', request.id);
    }

    async processQueue(): Promise<void> {
        if (this.queue.length === 0) return;

        console.log(`[Offline Queue] Processing ${this.queue.length} queued requests`);

        const requests = [...this.queue];
        this.queue = [];
        this.saveQueue();

        for (const request of requests) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body ? JSON.stringify(request.body) : undefined,
                });

                if (!response.ok) {
                    // Re-queue if failed
                    this.queue.push(request);
                    console.error('[Offline Queue] Request failed:', request.id);
                } else {
                    console.log('[Offline Queue] Request succeeded:', request.id);
                }
            } catch (error) {
                // Re-queue if network error
                this.queue.push(request);
                console.error('[Offline Queue] Network error:', error);
            }
        }

        this.saveQueue();
    }

    clear() {
        this.queue = [];
        this.saveQueue();
    }

    getQueue(): QueuedRequest[] {
        return [...this.queue];
    }

    size(): number {
        return this.queue.length;
    }
}

export const offlineQueue = new OfflineQueue();
