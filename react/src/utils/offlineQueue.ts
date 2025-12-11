import errorLogger from './errorLogger';

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
        this.startAutoProcessing();
    }

    private startAutoProcessing() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                errorLogger.info('[Offline Queue] Online detected, processing queue', { context: 'OfflineQueue' });
                this.processQueue();
            });
            // Try periodically
            setInterval(() => this.processQueue(), 60000);
        }
    }

    private loadQueue() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (error) {
            errorLogger.error('Failed to load offline queue', error, { context: 'OfflineQueue' });
        }
    }

    private saveQueue() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            errorLogger.error('Failed to save offline queue', error, { context: 'OfflineQueue' });
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

        errorLogger.info('[Offline Queue] Added request', { context: 'OfflineQueue', extra: { requestId: request.id } });
    }

    async processQueue(): Promise<void> {
        if (this.queue.length === 0) return;

        errorLogger.info(`[Offline Queue] Processing ${this.queue.length} queued requests`, { context: 'OfflineQueue' });

        const requests = [...this.queue];
        this.queue = [];
        this.saveQueue();

        for (const request of requests) {
            try {
                const response = await import('./circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                    fetch(request.url, {
                        method: request.method,
                        headers: request.headers,
                        body: request.body ? JSON.stringify(request.body) : undefined,
                    })
                ));

                if (!response.ok) {
                    // Re-queue if failed
                    this.queue.push(request);
                    errorLogger.error('[Offline Queue] Request failed', null, { context: 'OfflineQueue', extra: { requestId: request.id, status: response.status } });
                } else {
                    errorLogger.info('[Offline Queue] Request succeeded', { context: 'OfflineQueue', extra: { requestId: request.id } });
                }
            } catch (error) {
                // Re-queue if network error
                this.queue.push(request);
                errorLogger.error('[Offline Queue] Network error', error, { context: 'OfflineQueue' });
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
