# Stage 3.2: LLM & Tool Caching

**Duration:** Week 11 (5 working days)  
**Priority:** 🟡 High  
**Dependencies:** Stage 3.1 (Whisper.cpp)

---

## Overview

Implement intelligent caching for LLM responses and tool results to reduce latency, save compute resources, and improve user experience.

## Goals

1. Implement LLM response caching with Redis
2. Add tool result caching with TTL
3. Implement cache invalidation strategies
4. Achieve 30% cache hit rate

---

## LLM Response Caching

### Task 1: LLM Cache Service

**File:** `gnani-rnd-backend/src/core/cache/llm-cache.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import redisClient from '../../config/redis.config.js';
import crypto from 'crypto';

const logger = createContextualLogger({ module: 'LLMCache' });

export class LLMCacheService {
  private DEFAULT_TTL = 3600; // 1 hour
  private keyPrefix = 'llm:cache:';

  async get(prompt: string, context?: any): Promise<string | null> {
    try {
      const key = this.generateKey(prompt, context);
      const cached = await redisClient.get(key);

      if (cached) {
        logger.info('LLM cache hit', { keyHash: this.hashKey(key) });
        return cached;
      }

      logger.debug('LLM cache miss', { keyHash: this.hashKey(key) });
      return null;

    } catch (error: any) {
      logger.error('Error getting from LLM cache', { error: error.message });
      return null;
    }
  }

  async set(prompt: string, response: string, context?: any, ttl?: number): Promise<void> {
    try {
      const key = this.generateKey(prompt, context);
      await redisClient.setex(key, ttl || this.DEFAULT_TTL, response);

      logger.debug('LLM response cached', {
        keyHash: this.hashKey(key),
        ttl: ttl || this.DEFAULT_TTL
      });

    } catch (error: any) {
      logger.error('Error setting LLM cache', { error: error.message });
    }
  }

  async invalidate(prompt: string, context?: any): Promise<void> {
    try {
      const key = this.generateKey(prompt, context);
      await redisClient.del(key);

      logger.info('LLM cache invalidated', { keyHash: this.hashKey(key) });

    } catch (error: any) {
      logger.error('Error invalidating LLM cache', { error: error.message });
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info('LLM cache cleared', { count: keys.length });
      }
    } catch (error: any) {
      logger.error('Error clearing LLM cache', { error: error.message });
    }
  }

  private generateKey(prompt: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const combined = `${prompt}${contextStr}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return `${this.keyPrefix}${hash}`;
  }

  private hashKey(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 8);
  }

  async getStats(): Promise<{ hits: number; misses: number; hitRate: number }> {
    // Implement cache statistics tracking
    const hits = parseInt(await redisClient.get('llm:cache:stats:hits') || '0');
    const misses = parseInt(await redisClient.get('llm:cache:stats:misses') || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    return { hits, misses, hitRate };
  }
}

export default new LLMCacheService();
```

### Task 2: Integrate Cache into LLM Executor

**File:** `gnani-rnd-backend/src/modules/session/llm.executor.ts`

```typescript
import llmCache from '../../core/cache/llm-cache.service.js';
import metrics from '../../core/monitoring/metrics.js';

export class LLMExecutor {
  async generate(context: any, onChunk?: Function): Promise<any> {
    const prompt = this.buildPrompt(context);

    // Check cache first
    const cached = await llmCache.get(prompt, {
      recentMessages: context.recentMessages.slice(-3) // Only cache based on last 3 messages
    });

    if (cached) {
      metrics.increment('llm_cache_hits');
      
      // Stream cached response
      if (onChunk) {
        for (const char of cached) {
          await onChunk(char);
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming
        }
      }

      return { text: cached, toolCalls: [] };
    }

    metrics.increment('llm_cache_misses');

    // Generate new response
    let fullResponse = '';
    for await (const chunk of llmManager.generate(prompt)) {
      fullResponse += chunk;
      if (onChunk) await onChunk(chunk);
    }

    // Cache the response
    await llmCache.set(prompt, fullResponse, {
      recentMessages: context.recentMessages.slice(-3)
    });

    return { text: fullResponse, toolCalls: this.extractToolCalls(fullResponse) };
  }
}
```

---

## Tool Result Caching

### Task 3: Tool Cache Service

**File:** `gnani-rnd-backend/src/core/cache/tool-cache.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import redisClient from '../../config/redis.config.js';
import crypto from 'crypto';

const logger = createContextualLogger({ module: 'ToolCache' });

export class ToolCacheService {
  private keyPrefix = 'tool:cache:';
  private ttlMap: Map<string, number> = new Map([
    ['web_search', 3600],      // 1 hour
    ['file_read', 300],         // 5 minutes
    ['weather', 1800],          // 30 minutes
    ['calculator', 86400],      // 24 hours (deterministic)
    ['default', 1800]           // 30 minutes
  ]);

  async get(toolName: string, params: any): Promise<any | null> {
    try {
      const key = this.generateKey(toolName, params);
      const cached = await redisClient.get(key);

      if (cached) {
        logger.info('Tool cache hit', { tool: toolName });
        return JSON.parse(cached);
      }

      logger.debug('Tool cache miss', { tool: toolName });
      return null;

    } catch (error: any) {
      logger.error('Error getting from tool cache', { error: error.message });
      return null;
    }
  }

  async set(toolName: string, params: any, result: any): Promise<void> {
    try {
      const key = this.generateKey(toolName, params);
      const ttl = this.ttlMap.get(toolName) || this.ttlMap.get('default')!;

      await redisClient.setex(key, ttl, JSON.stringify(result));

      logger.debug('Tool result cached', { tool: toolName, ttl });

    } catch (error: any) {
      logger.error('Error setting tool cache', { error: error.message });
    }
  }

  async invalidate(toolName: string, params?: any): Promise<void> {
    try {
      if (params) {
        const key = this.generateKey(toolName, params);
        await redisClient.del(key);
      } else {
        // Invalidate all cache entries for this tool
        const pattern = `${this.keyPrefix}${toolName}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      logger.info('Tool cache invalidated', { tool: toolName });

    } catch (error: any) {
      logger.error('Error invalidating tool cache', { error: error.message });
    }
  }

  private generateKey(toolName: string, params: any): string {
    const paramsStr = JSON.stringify(params);
    const hash = crypto.createHash('sha256').update(paramsStr).digest('hex');
    return `${this.keyPrefix}${toolName}:${hash}`;
  }

  setTTL(toolName: string, ttl: number): void {
    this.ttlMap.set(toolName, ttl);
    logger.info('Tool cache TTL updated', { tool: toolName, ttl });
  }
}

export default new ToolCacheService();
```

### Task 4: Integrate Cache into Tool Executor

**File:** `gnani-rnd-backend/src/modules/session/tool.executor.ts`

```typescript
import toolCache from '../../core/cache/tool-cache.service.js';
import metrics from '../../core/monitoring/metrics.js';

export class ToolExecutor {
  async executeTools(sessionId: string, toolCalls: any[], onStatus?: Function): Promise<any[]> {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        // Check cache first
        const cached = await toolCache.get(toolCall.name, toolCall.parameters);

        if (cached) {
          logger.info('Using cached tool result', { tool: toolCall.name });
          metrics.increment('tool_cache_hits', { tool: toolCall.name });
          
          results.push({
            toolName: toolCall.name,
            data: cached,
            cached: true
          });
          continue;
        }

        metrics.increment('tool_cache_misses', { tool: toolCall.name });

        // Execute tool
        const result = await toolRegistry.executeTool(
          toolCall.name,
          toolCall.parameters,
          onStatus
        );

        // Cache result
        if (result.data && !result.error) {
          await toolCache.set(toolCall.name, toolCall.parameters, result.data);
        }

        results.push(result);

      } catch (error: any) {
        logger.error('Tool execution failed', { tool: toolCall.name, error: error.message });
        results.push({
          toolName: toolCall.name,
          error: error.message
        });
      }
    }

    return results;
  }
}
```

---

## Cache Invalidation

### Task 5: Smart Cache Invalidation

**File:** `gnani-rnd-backend/src/core/cache/cache-invalidation.service.ts`

```typescript
import llmCache from './llm-cache.service.js';
import toolCache from './tool-cache.service.js';
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'CacheInvalidation' });

export class CacheInvalidationService {
  // Invalidate cache when user updates preferences
  async onUserPreferencesUpdate(userId: string): Promise<void> {
    logger.info('Invalidating cache for user preferences update', { userId });
    
    // Clear LLM cache (preferences might affect responses)
    await llmCache.clear();
  }

  // Invalidate tool cache when data changes
  async onDataUpdate(toolName: string): Promise<void> {
    logger.info('Invalidating tool cache for data update', { toolName });
    
    await toolCache.invalidate(toolName);
  }

  // Scheduled cache cleanup (run daily)
  async scheduledCleanup(): Promise<void> {
    logger.info('Running scheduled cache cleanup');
    
    // Get cache stats
    const llmStats = await llmCache.getStats();
    
    logger.info('Cache statistics', {
      llm: llmStats
    });

    // Clear old entries (Redis handles this with TTL, but log it)
  }
}

export default new CacheInvalidationService();
```

---

## Monitoring

### Task 6: Cache Metrics

**File:** `gnani-rnd-backend/src/core/monitoring/metrics.ts` (Add to existing)

```typescript
// Add cache-specific metrics
this.cacheHits = new Counter({
  name: 'gnani_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type', 'tool']
});

this.cacheMisses = new Counter({
  name: 'gnani_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type', 'tool']
});

this.cacheHitRate = new Gauge({
  name: 'gnani_cache_hit_rate',
  help: 'Cache hit rate (0-1)',
  labelNames: ['cache_type']
});
```

---

## Testing

### Task 7: Cache Tests

**File:** `gnani-rnd-backend/tests/unit/llm-cache.test.ts`

```typescript
import llmCache from '../../src/core/cache/llm-cache.service';

describe('LLM Cache', () => {
  beforeEach(async () => {
    await llmCache.clear();
  });

  it('should cache and retrieve LLM responses', async () => {
    const prompt = 'What is the capital of France?';
    const response = 'Paris';

    await llmCache.set(prompt, response);
    const cached = await llmCache.get(prompt);

    expect(cached).toBe(response);
  });

  it('should return null for cache miss', async () => {
    const cached = await llmCache.get('non-existent prompt');
    expect(cached).toBeNull();
  });

  it('should invalidate cache', async () => {
    const prompt = 'Test prompt';
    await llmCache.set(prompt, 'Test response');
    
    await llmCache.invalidate(prompt);
    
    const cached = await llmCache.get(prompt);
    expect(cached).toBeNull();
  });
});
```

---

## Success Metrics

- ✅ LLM cache hit rate > 30%
- ✅ Tool cache hit rate > 50%
- ✅ Average response time reduced by 40%
- ✅ Redis memory usage < 500MB
- ✅ All tests passing

---

## Next Stage

**Stage 3.3: Production Deployment & Load Testing**
