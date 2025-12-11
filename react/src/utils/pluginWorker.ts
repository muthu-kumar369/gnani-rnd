// react/src/utils/pluginWorker.ts
import errorLogger from './errorLogger';

export interface PluginMessage {
    type: 'init' | 'execute' | 'api_call' | 'response' | 'error';
    payload: any;
    requestId?: string;
}

export interface PluginPermissions {
    api: boolean;          // Can make API calls
    storage: boolean;      // Can access localStorage
    notifications: boolean; // Can show notifications
    clipboard: boolean;    // Can access clipboard
}

export class PluginWorkerManager {
    private workers: Map<string, Worker>;
    private pendingRequests: Map<string, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }>;
    private permissions: Map<string, PluginPermissions>;

    constructor() {
        this.workers = new Map();
        this.pendingRequests = new Map();
        this.permissions = new Map();
    }

    /**
     * Load plugin in isolated Web Worker
     */
    async loadPlugin(
        pluginId: string,
        pluginCode: string,
        permissions: PluginPermissions
    ): Promise<void> {
        // Create blob URL for worker
        const blob = new Blob([this.createWorkerCode(pluginCode)], {
            type: 'application/javascript'
        });
        const workerUrl = URL.createObjectURL(blob);

        // Create worker
        const worker = new Worker(workerUrl);

        // Store worker and permissions
        this.workers.set(pluginId, worker);
        this.permissions.set(pluginId, permissions);

        // Setup message handler
        worker.onmessage = (event: MessageEvent<PluginMessage>) => {
            this.handleWorkerMessage(pluginId, event.data);
        };

        worker.onerror = (error) => {
            errorLogger.error(`[PluginWorker] Error in ${pluginId}`, error, { context: 'PluginWorkerManager' });
            this.unloadPlugin(pluginId);
        };

        // Initialize plugin
        await this.sendMessage(pluginId, {
            type: 'init',
            payload: { permissions }
        });

        errorLogger.info(`[PluginWorker] Loaded plugin: ${pluginId}`, { context: 'PluginWorkerManager' });
    }

    /**
     * Execute plugin function
     */
    async executePlugin(
        pluginId: string,
        functionName: string,
        args: any[]
    ): Promise<any> {
        const requestId = `${pluginId}_${Date.now()}_${Math.random()}`;

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });

            this.sendMessage(pluginId, {
                type: 'execute',
                payload: { functionName, args },
                requestId
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Plugin execution timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle messages from worker
     */
    private handleWorkerMessage(pluginId: string, message: PluginMessage): void {
        switch (message.type) {
            case 'response':
                this.handleResponse(message);
                break;

            case 'error':
                this.handleError(message);
                break;

            case 'api_call':
                this.handleApiCall(pluginId, message);
                break;

            default:
                errorLogger.warn(`[PluginWorker] Unknown message type: ${message.type}`, { context: 'PluginWorkerManager' });
        }
    }

    /**
     * Handle response from plugin
     */
    private handleResponse(message: PluginMessage): void {
        const { requestId, payload } = message;
        if (!requestId) return;

        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            pending.resolve(payload);
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Handle error from plugin
     */
    private handleError(message: PluginMessage): void {
        const { requestId, payload } = message;
        if (!requestId) return;

        const pending = this.pendingRequests.get(requestId);
        if (pending) {
            pending.reject(new Error(payload.message || 'Plugin error'));
            this.pendingRequests.delete(requestId);
        }
    }

    /**
     * Handle API call request from plugin
     */
    private async handleApiCall(pluginId: string, message: PluginMessage): Promise<void> {
        const permissions = this.permissions.get(pluginId);
        const { requestId, payload } = message;

        // Check permissions
        if (!permissions?.api) {
            this.sendMessage(pluginId, {
                type: 'error',
                payload: { message: 'API permission denied' },
                requestId
            });
            return;
        }

        try {
            // Make API call on behalf of plugin
            // STAGE 2: Circuit Breaker for Plugins
            const response = await import('./circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                fetch(payload.url, payload.options)
            ));
            const data = await response.json();

            this.sendMessage(pluginId, {
                type: 'response',
                payload: data,
                requestId
            });
        } catch (error: any) {
            this.sendMessage(pluginId, {
                type: 'error',
                payload: { message: error.message },
                requestId
            });
        }
    }

    /**
     * Send message to worker
     */
    private sendMessage(pluginId: string, message: PluginMessage): void {
        const worker = this.workers.get(pluginId);
        if (worker) {
            worker.postMessage(message);
        }
    }

    /**
     * Unload plugin
     */
    unloadPlugin(pluginId: string): void {
        const worker = this.workers.get(pluginId);
        if (worker) {
            worker.terminate();
            this.workers.delete(pluginId);
            this.permissions.delete(pluginId);
            errorLogger.info(`[PluginWorker] Unloaded plugin: ${pluginId}`, { context: 'PluginWorkerManager' });
        }
    }

    /**
     * Create worker code with sandbox
     */
    private createWorkerCode(pluginCode: string): string {
        return `
// Sandboxed plugin environment
const pluginAPI = {
    // Safe API methods
    fetch: async (url, options) => {
        const requestId = Date.now() + '_' + Math.random();
        return new Promise((resolve, reject) => {
            self.postMessage({
                type: 'api_call',
                payload: { url, options },
                requestId
            });
            
            // Store resolver
            self._pendingRequests = self._pendingRequests || {};
            self._pendingRequests[requestId] = { resolve, reject };
        });
    },
    
    log: (...args) => {
        console.log('[Plugin]', ...args);
    },
    
    error: (...args) => {
        console.error('[Plugin]', ...args);
    }
};

// Plugin code execution
${pluginCode}

// Message handler
self.onmessage = async (event) => {
    const { type, payload, requestId } = event.data;
    
    try {
        if (type === 'init') {
            // Initialize plugin
            if (typeof self.onInit === 'function') {
                await self.onInit(payload.permissions);
            }
            self.postMessage({ type: 'response', payload: { initialized: true }, requestId });
        } else if (type === 'execute') {
            // Execute plugin function
            const { functionName, args } = payload;
            if (typeof self[functionName] === 'function') {
                const result = await self[functionName](...args);
                self.postMessage({ type: 'response', payload: result, requestId });
            } else {
                throw new Error(\`Function \${functionName} not found\`);
            }
        } else if (type === 'response') {
            // Handle API response
            const pending = self._pendingRequests?.[requestId];
            if (pending) {
                pending.resolve(payload);
                delete self._pendingRequests[requestId];
            }
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            payload: { message: error.message },
            requestId
        });
    }
};
        `;
    }
}

// Export singleton
export const pluginWorkerManager = new PluginWorkerManager();
