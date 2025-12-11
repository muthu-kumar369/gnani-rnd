import { describe, it, expect, vi, afterEach } from 'vitest';
import api from './client';

describe('API Client Deduplication', () => {
    it('should deduplicate simultaneous GET requests', async () => {
        // Mock the underlying axios adapter or simply rely on the fact that we can listen to the promise
        // Actually, since we are testing the wrapper, we can observe if the second call returns the *same* promise object.

        // We need to mock the actual network call to be slow so we can catch it in "pending" state
        // But api is an instance.
        // Let's rely on the behavior:

        const promise1 = api.get('/test-dedupe');
        const promise2 = api.get('/test-dedupe');

        // They should be strict equal if deduplicated
        expect(promise1).toBe(promise2);

        // Cleanup (catch errors since no real backend)
        try {
            await promise1;
        } catch (e) {
            // Expected 404/Connection refused
        }
    });

    it('should NOT deduplicate different GET requests', async () => {
        const promise1 = api.get('/test-dedupe-1');
        const promise2 = api.get('/test-dedupe-2');

        expect(promise1).not.toBe(promise2);

        try { await promise1; } catch (e) { }
        try { await promise2; } catch (e) { }
    });
});
