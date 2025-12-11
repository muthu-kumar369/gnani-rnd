// react/src/utils/messageCache.ts
import type { ConversationMessage } from '../types/conversation';
import errorLogger from './errorLogger';

interface CacheEntry {
    conversationId: string;
    messages: ConversationMessage[];
    timestamp: number;
    accessCount: number;
}

class MessageCache {
    private cache: Map<string, CacheEntry>;
    private maxSize: number;
    private hits: number;
    private misses: number;

    constructor(maxSize: number = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get messages from cache
     */
    get(conversationId: string): ConversationMessage[] | null {
        const entry = this.cache.get(conversationId);

        if (!entry) {
            this.misses++;
            errorLogger.debug(`[MessageCache] MISS for ${conversationId} (hit rate: ${this.getHitRate()}%)`, { context: 'MessageCache' });
            return null;
        }

        // Update access metadata
        entry.timestamp = Date.now();
        entry.accessCount++;
        this.hits++;

        errorLogger.debug(`[MessageCache] HIT for ${conversationId} (hit rate: ${this.getHitRate()}%)`, { context: 'MessageCache' });
        return entry.messages;
    }

    /**
     * Set messages in cache
     */
    set(conversationId: string, messages: ConversationMessage[]): void {
        // If cache is full, evict least recently used
        if (this.cache.size >= this.maxSize && !this.cache.has(conversationId)) {
            this.evictLRU();
        }

        this.cache.set(conversationId, {
            conversationId,
            messages,
            timestamp: Date.now(),
            accessCount: 1
        });

        console.log(`[MessageCache] SET ${conversationId} (size: ${this.cache.size}/${this.maxSize})`);
        errorLogger.debug(`[MessageCache] SET ${conversationId} (size: ${this.cache.size}/${this.maxSize})`, { context: 'MessageCache' });
    }

    /**
     * Invalidate specific conversation
     */
    invalidate(conversationId: string): void {
        const deleted = this.cache.delete(conversationId);
        if (deleted) {
            errorLogger.debug(`[MessageCache] INVALIDATED ${conversationId}`, { context: 'MessageCache' });
        }
    }

    /**
     * Invalidate all cache
     */
    invalidateAll(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        errorLogger.debug('[MessageCache] INVALIDATED ALL', { context: 'MessageCache' });
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let lruKey: string | null = null;
        let lruTimestamp = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < lruTimestamp) {
                lruTimestamp = entry.timestamp;
                lruKey = key;
            }
        }

        if (lruKey) {
            this.cache.delete(lruKey);
            errorLogger.debug(`[MessageCache] EVICTED LRU: ${lruKey}`, { context: 'MessageCache' });
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            entries: Array.from(this.cache.values()).map(e => ({
                conversationId: e.conversationId,
                messageCount: e.messages.length,
                accessCount: e.accessCount,
                age: Date.now() - e.timestamp
            }))
        };
    }

    /**
     * Get cache hit rate percentage
     */
    private getHitRate(): number {
        const total = this.hits + this.misses;
        return total === 0 ? 0 : Math.round((this.hits / total) * 100);
    }

    /**
     * Prefetch conversation (for hover optimization)
     */
    async prefetch(conversationId: string, fetchFn: () => Promise<ConversationMessage[]>): Promise<void> {
        if (this.cache.has(conversationId)) {
            return; // Already cached
        }

        try {
            const messages = await fetchFn();
            this.set(conversationId, messages);
        } catch (error) {
            errorLogger.error(`[MessageCache] Prefetch failed for ${conversationId}:`, error, { context: 'MessageCache' });
        }
    }
}

// Export singleton instance
export const messageCache = new MessageCache(50);

// Export class for testing
export { MessageCache };
