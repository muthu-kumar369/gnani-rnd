# Stage 8: Caching & Performance

**Priority:** P1  
**Estimated Time:** 1 week  
**Dependencies:** Stage 7 (Database Optimization)

---

## Objective

Implement multi-layer caching strategy to reduce latency, minimize database load, and improve overall system performance through intelligent caching of LLM responses, vector search results, and user data.

---

## Current State

**Existing Caching:**
- LLM responses cached in Redis (1 hour TTL)
- Basic session state in Redis
- No cache invalidation strategy
- No cache warming
- No cache metrics

---

## Implementation

### 1. Multi-Layer Cache Service

**File:** `src/core/cache/cache.service.ts`

```typescript
import redis from '../../config/redis.config.js';
import { createContextualLogger } from '../logger/logger.js';
import { cacheOperations, cacheLatency, cacheSize } from '../monitoring/metrics.js';
import crypto from 'crypto';

const logger = createContextualLogger({ module: 'CacheService' });

export interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  tags?: string[];  // Tags for grouped invalidation
  compress?: boolean;  // Compress large values
}

export class CacheService {
  private readonly prefix: string;
  private readonly defaultTTL: number = 3600; // 1 hour

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const start = Date.now();

    try {
      const cached = await redis.get(fullKey);
      const duration = (Date.now() - start) / 1000;
      
      cacheLatency.observe({ operation: 'get' }, duration);

      if (cached) {
        cacheOperations.inc({ operation: 'get', result: 'hit' });
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached) as T;
      }

      cacheOperations.inc({ operation: 'get', result: 'miss' });
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error: any) {
      cacheOperations.inc({ operation: 'get', result: 'error' });
      logger.error(`Cache get error: ${error.message}`, { key });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key);
    const ttl = options.ttl || this.defaultTTL;
    const start = Date.now();

    try {
      const serialized = JSON.stringify(value);
      
      // Compress if value is large (>10KB)
      const shouldCompress = options.compress || serialized.length > 10240;
      const finalValue = shouldCompress 
        ? await this.compress(serialized)
        : serialized;

      await redis.setex(fullKey, ttl, finalValue);

      // Store tags for grouped invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(key, options.tags);
      }

      const duration = (Date.now() - start) / 1000;
      cacheLatency.observe({ operation: 'set' }, duration);
      cacheOperations.inc({ operation: 'set', result: 'success' });

      // Update cache size metric
      cacheSize.set({ cache_type: this.prefix }, finalValue.length);

      logger.debug(`Cache set: ${key}`, { ttl, size: finalValue.length });
    } catch (error: any) {
      cacheOperations.inc({ operation: 'set', result: 'error' });
      logger.error(`Cache set error: ${error.message}`, { key });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    const start = Date.now();

    try {
      await redis.del(fullKey);
      
      const duration = (Date.now() - start) / 1000;
      cacheLatency.observe({ operation: 'del' }, duration);
      cacheOperations.inc({ operation: 'del', result: 'success' });

      logger.debug(`Cache deleted: ${key}`);
    } catch (error: any) {
      cacheOperations.inc({ operation: 'del', result: 'error' });
      logger.error(`Cache delete error: ${error.message}`, { key });
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.buildKey(pattern);
    
    try {
      const keys = await redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      await redis.del(...keys);
      cacheOperations.inc({ operation: 'invalidate', result: 'success' }, keys.length);
      
      logger.info(`Invalidated ${keys.length} cache entries`, { pattern });
      return keys.length;
    } catch (error: any) {
      cacheOperations.inc({ operation: 'invalidate', result: 'error' });
      logger.error(`Cache invalidation error: ${error.message}`, { pattern });
      return 0;
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const tag of tags) {
      const tagKey = `${this.prefix}:tag:${tag}`;
      const keys = await redis.smembers(tagKey);

      if (keys.length > 0) {
        const fullKeys = keys.map(k => this.buildKey(k));
        await redis.del(...fullKeys);
        await redis.del(tagKey);
        totalInvalidated += keys.length;
      }
    }

    logger.info(`Invalidated ${totalInvalidated} entries by tags`, { tags });
    return totalInvalidated;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch from source
    logger.debug(`Cache miss, fetching from source: ${key}`);
    const value = await factory();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Warm cache with data
   */
  async warm(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    logger.info(`Warming cache with ${entries.length} entries`);

    const promises = entries.map(({ key, value, options }) =>
      this.set(key, value, options)
    );

    await Promise.all(promises);
    logger.info('Cache warming completed');
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const pattern = `${this.prefix}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.warn(`Cleared ${keys.length} cache entries`);
    }
  }

  // Private helper methods

  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private async storeTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `${this.prefix}:tag:${tag}`;
      await redis.sadd(tagKey, key);
    }
  }

  private async compress(data: string): Promise<string> {
    // Simple compression using Buffer
    return Buffer.from(data).toString('base64');
  }

  private async decompress(data: string): Promise<string> {
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  /**
   * Generate cache key from object
   */
  static generateKey(...parts: any[]): string {
    const combined = parts.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':');
    
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }
}

// Create service instances for different cache types
export const llmCache = new CacheService('llm');
export const vectorCache = new CacheService('vector');
export const userCache = new CacheService('user');
export const conversationCache = new CacheService('conversation');

export default CacheService;
```

### 2. LLM Response Caching

**File:** `src/modules/llm/llm.cache.ts`

```typescript
import { llmCache, CacheService } from '../../core/cache/cache.service.js';
import { createContextualLogger } from '../../core/logger/logger.js';

const logger = createContextualLogger({ module: 'LLMCache' });

export class LLMCacheService {
  /**
   * Generate cache key for LLM request
   */
  private generateCacheKey(prompt: any): string {
    const normalized = {
      query: prompt.current_user_query,
      intent: prompt.classified_intent,
      systemPrompt: prompt.system_message?.substring(0, 100),
      model: prompt.model || 'default'
    };
    
    return CacheService.generateKey('llm', normalized);
  }

  /**
   * Get cached LLM response
   */
  async get(prompt: any): Promise<{ text: string; action: any } | null> {
    const key = this.generateCacheKey(prompt);
    return llmCache.get(key);
  }

  /**
   * Cache LLM response
   */
  async set(prompt: any, response: { text: string; action: any }): Promise<void> {
    const key = this.generateCacheKey(prompt);
    
    await llmCache.set(key, response, {
      ttl: 3600, // 1 hour
      tags: [
        `user:${prompt.user_id}`,
        `intent:${prompt.classified_intent}`,
        `model:${prompt.model || 'default'}`
      ]
    });
  }

  /**
   * Invalidate user's LLM cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await llmCache.invalidateByTags([`user:${userId}`]);
  }

  /**
   * Invalidate by model
   */
  async invalidateModel(model: string): Promise<void> {
    await llmCache.invalidateByTags([`model:${model}`]);
  }
}

export default new LLMCacheService();
```

### 3. Conversation Caching

**File:** `src/modules/conversation/conversation.cache.ts`

```typescript
import { conversationCache } from '../../core/cache/cache.service.js';
import Conversation from './conversation.model.js';
import ConversationMessage from '../memory/entities/conversation.entity.js';

export class ConversationCacheService {
  /**
   * Get conversation metadata
   */
  async getConversation(conversationId: string) {
    return conversationCache.getOrSet(
      `metadata:${conversationId}`,
      async () => {
        return await Conversation.findOne({ conversationId }).lean();
      },
      { ttl: 1800, tags: [`conversation:${conversationId}`] } // 30 minutes
    );
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit: number = 50) {
    return conversationCache.getOrSet(
      `messages:${conversationId}:${limit}`,
      async () => {
        return await ConversationMessage.getConversationHistory(conversationId, { limit });
      },
      { ttl: 300, tags: [`conversation:${conversationId}`] } // 5 minutes
    );
  }

  /**
   * Invalidate conversation cache
   */
  async invalidate(conversationId: string): Promise<void> {
    await conversationCache.invalidateByTags([`conversation:${conversationId}`]);
  }

  /**
   * Warm cache for active conversations
   */
  async warmActiveConversations(userId: string): Promise<void> {
    const conversations = await Conversation.findUserConversations(userId, { limit: 10 });
    
    const entries = conversations.map(conv => ({
      key: `metadata:${conv.conversationId}`,
      value: conv,
      options: { ttl: 1800, tags: [`conversation:${conv.conversationId}`] }
    }));

    await conversationCache.warm(entries);
  }
}

export default new ConversationCacheService();
```

### 4. Cache Warming Strategy

**File:** `src/jobs/cache-warming.job.ts`

```typescript
import cron from 'node-cron';
import { createContextualLogger } from '../core/logger/logger.js';
import conversationCacheService from '../modules/conversation/conversation.cache.js';
import User from '../modules/user/user.model.js';

const logger = createContextualLogger({ module: 'CacheWarmingJob' });

/**
 * Warm cache for active users
 * Runs every hour
 */
export const cacheWarmingJob = cron.schedule('0 * * * *', async () => {
  logger.info('Starting cache warming job...');

  try {
    // Get active users (logged in within last 24 hours)
    const activeUsers = await User.find({
      lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).select('_id').lean();

    logger.info(`Warming cache for ${activeUsers.length} active users`);

    // Warm conversation cache for each user
    for (const user of activeUsers) {
      try {
        await conversationCacheService.warmActiveConversations(user._id);
      } catch (error: any) {
        logger.error(`Failed to warm cache for user ${user._id}: ${error.message}`);
      }
    }

    logger.info('Cache warming completed');
  } catch (error: any) {
    logger.error(`Cache warming job failed: ${error.message}`);
  }
});

export function startCacheWarmingJob() {
  cacheWarmingJob.start();
  logger.info('Cache warming job started (runs every hour)');
}

export function stopCacheWarmingJob() {
  cacheWarmingJob.stop();
  logger.info('Cache warming job stopped');
}
```

### 5. Cache Invalidation Hooks

**File:** `src/modules/conversation/conversation.service.ts`

```typescript
import conversationCacheService from './conversation.cache.js';
import Conversation from './conversation.model.js';
import ConversationMessage from '../memory/entities/conversation.entity.js';

export class ConversationService {
  /**
   * Create message (with cache invalidation)
   */
  async createMessage(data: any) {
    const message = await ConversationMessage.create(data);
    
    // Invalidate conversation cache
    await conversationCacheService.invalidate(data.conversationId);
    
    // Update conversation metadata
    await Conversation.findOneAndUpdate(
      { conversationId: data.conversationId },
      {
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 }
      }
    );

    return message;
  }

  /**
   * Update conversation (with cache invalidation)
   */
  async updateConversation(conversationId: string, updates: any) {
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      updates,
      { new: true }
    );

    // Invalidate cache
    await conversationCacheService.invalidate(conversationId);

    return conversation;
  }
}

export default new ConversationService();
```

---

## Testing

```typescript
describe('CacheService', () => {
  it('should cache and retrieve values', async () => {
    await llmCache.set('test-key', { data: 'test' }, { ttl: 60 });
    const cached = await llmCache.get('test-key');
    expect(cached).toEqual({ data: 'test' });
  });

  it('should invalidate by tags', async () => {
    await llmCache.set('key1', 'value1', { tags: ['user:123'] });
    await llmCache.set('key2', 'value2', { tags: ['user:123'] });
    
    await llmCache.invalidateByTags(['user:123']);
    
    expect(await llmCache.get('key1')).toBeNull();
    expect(await llmCache.get('key2')).toBeNull();
  });

  it('should use getOrSet pattern', async () => {
    let factoryCalled = 0;
    const factory = async () => {
      factoryCalled++;
      return { data: 'from-factory' };
    };

    // First call - cache miss
    const result1 = await llmCache.getOrSet('test', factory);
    expect(factoryCalled).toBe(1);

    // Second call - cache hit
    const result2 = await llmCache.getOrSet('test', factory);
    expect(factoryCalled).toBe(1); // Factory not called again
    expect(result2).toEqual(result1);
  });
});
```

---

## Verification Checklist

- [ ] Multi-layer cache service implemented
- [ ] LLM responses cached with 1h TTL
- [ ] Conversation data cached with 30m TTL
- [ ] Vector search results cached with 5m TTL
- [ ] Cache invalidation on data updates
- [ ] Cache warming job running hourly
- [ ] Cache metrics exported (hit rate, latency, size)
- [ ] Cache hit rate >60%
- [ ] Latency reduced by >30%

---

## Success Criteria

1. ✅ **Cache Hit Rate:** >60% for LLM requests
2. ✅ **Latency Reduction:** 30%+ improvement on cached requests
3. ✅ **Database Load:** 50%+ reduction in read queries
4. ✅ **Memory Usage:** Cache size <2GB
5. ✅ **Invalidation:** Stale data <1% of cache
