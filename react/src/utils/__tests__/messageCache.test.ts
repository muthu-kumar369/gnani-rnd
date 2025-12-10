import { describe, it, expect, beforeEach } from 'vitest';
import { MessageCache } from '../messageCache';

describe('MessageCache', () => {
    let cache: MessageCache;

    beforeEach(() => {
        cache = new MessageCache(3); // Small cache for testing
    });

    it('should cache and retrieve messages', () => {
        const messages: any[] = [{ id: '1', content: 'test', role: 'user', timestamp: Date.now() }];
        cache.set('conv1', messages);

        const retrieved = cache.get('conv1');
        expect(retrieved).toEqual(messages);
    });

    it('should return null for cache miss', () => {
        const result = cache.get('nonexistent');
        expect(result).toBeNull();
    });

    it('should evict LRU when cache is full', () => {
        cache.set('conv1', []);
        cache.set('conv2', []);
        cache.set('conv3', []);
        cache.set('conv4', []); // Should evict conv1

        expect(cache.get('conv1')).toBeNull();
        expect(cache.get('conv2')).not.toBeNull();
        expect(cache.get('conv3')).not.toBeNull();
        expect(cache.get('conv4')).not.toBeNull();
    });

    it('should update access time on get', () => {
        cache.set('conv1', []);
        cache.set('conv2', []);
        cache.set('conv3', []);

        // Access conv1 to make it most recently used
        cache.get('conv1');

        // Add conv4, should evict conv2 (least recently used)
        cache.set('conv4', []);

        expect(cache.get('conv1')).not.toBeNull();
        expect(cache.get('conv2')).toBeNull();
    });

    it('should invalidate specific conversation', () => {
        cache.set('conv1', []);
        cache.invalidate('conv1');

        expect(cache.get('conv1')).toBeNull();
    });

    it('should calculate hit rate correctly', () => {
        cache.set('conv1', []);

        cache.get('conv1'); // Hit
        cache.get('conv2'); // Miss
        cache.get('conv1'); // Hit

        const stats = cache.getStats();
        // 2 hits, 1 miss = 66.67% -> 67%
        expect(stats.hitRate).toBe(67);
    });
});
