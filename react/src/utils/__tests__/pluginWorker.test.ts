import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PluginWorkerManager } from '../pluginWorker';

describe('PluginWorkerManager', () => {
    // Mock Worker and URL
    beforeEach(() => {
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

        class MockWorker {
            onmessage: ((e: MessageEvent) => void) | null = null;
            onerror: ((e: ErrorEvent) => void) | null = null;

            postMessage(data: any) {
                // Determine if we should respond immediately based on message type
                if (data.type === 'init') {
                    setTimeout(() => {
                        this.onmessage?.({ data: { type: 'response', payload: { initialized: true }, requestId: data.requestId } } as MessageEvent);
                    }, 10);
                } else if (data.type === 'execute') {
                    setTimeout(() => {
                        if (data.payload.functionName === 'greet') {
                            this.onmessage?.({ data: { type: 'response', payload: `Hello, ${data.payload.args[0]}`, requestId: data.requestId } } as MessageEvent);
                        } else if (data.payload.functionName === 'fetchData') {
                            this.onmessage?.({ data: { type: 'api_call', payload: { url: '/api/data', options: {} }, requestId: data.requestId } } as MessageEvent);
                        }
                    }, 10);
                }
            }
            terminate() { }
            addEventListener() { }
            removeEventListener() { }
            dispatchEvent() { return true; }
        }

        global.Worker = MockWorker as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should load plugin in worker', async () => {
        const manager = new PluginWorkerManager();
        const pluginCode = 'function test() { return "hello"; }';
        const permissions = { api: false, storage: false, notifications: false, clipboard: false };

        await manager.loadPlugin('test-plugin', pluginCode, permissions);

        // Verify worker created (accessing private property via any to verify)
        expect((manager as any).workers.has('test-plugin')).toBe(true);
    });

    it('should execute plugin function', async () => {
        const manager = new PluginWorkerManager();
        const pluginCode = `
            function greet(name) {
                return "Hello, " + name;
            }
        `;
        const permissions = { api: false, storage: false, notifications: false, clipboard: false };

        await manager.loadPlugin('test-plugin', pluginCode, permissions);
        const result = await manager.executePlugin('test-plugin', 'greet', ['World']);

        expect(result).toBe('Hello, World');
    });

    // Note: The logic for deny API is more complex because the worker mock needs to enable it.
    // I simplified the mock to just basic execute. For deeper tests we'd need a smarter mock.
});
