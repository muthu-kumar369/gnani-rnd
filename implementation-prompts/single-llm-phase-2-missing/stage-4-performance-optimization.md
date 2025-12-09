# Stage 4: Performance & Optimization

**Priority:** P2 (Enhancement)  
**Duration:** 3-4 days  
**Dependencies:** Stages 1-2  
**Effort:** 24-32 hours

---

## Context & Background

### Current State

Stage 5 (Performance Optimization) from the original Phase 2 plan is 50% complete:

**Implemented:**
- ⚠️ Parallel tool executor exists but not integrated

**Missing:**
- ❌ Request deduplication service
- ❌ Database query optimization
- ❌ Cache warming strategies
- ❌ Connection pool tuning
- ❌ Memory leak prevention measures

### Why This Matters

Performance optimizations enable:
- **Cost Savings:** Reduce redundant LLM calls (expensive)
- **Faster Response:** Optimized queries and caching
- **Better Scalability:** Efficient resource usage
- **Reliability:** Prevent memory leaks and resource exhaustion

---

## Objectives

### Primary Goals

1. **Implement Request Deduplication** - Avoid redundant LLM calls
2. **Optimize Database Queries** - Reduce query latency
3. **Add Cache Warming** - Preload frequently accessed data
4. **Tune Connection Pools** - Optimize MongoDB and Redis connections
5. **Prevent Memory Leaks** - Add monitoring and cleanup

### Success Criteria

- [ ] Request deduplication saves 20%+ LLM calls
- [ ] Database queries <100ms p95
- [ ] Cache hit rate >40%
- [ ] Zero memory leaks detected
- [ ] Connection pools optimized

---

## Technical Requirements

### 1. Request Deduplication

#### Implementation Steps

**Step 1: Create Deduplication Service**

File: `src/core/cache/deduplication.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import { redisClient } from '../../config/redis.config.js';
import crypto from 'crypto';

export interface DedupRequest {
    key: string;
    promise: Promise<any>;
    timestamp: number;
}

export class DeduplicationService {
    private readonly logger = createContextualLogger({ module: 'Deduplication' });
    private inFlightRequests: Map<string, DedupRequest> = new Map();
    private readonly ttl = 60 * 1000; // 1 minute

    /**
     * Execute request with deduplication
     */
    async deduplicate<T>(
        key: string,
        fn: () => Promise<T>,
        ttl: number = this.ttl
    ): Promise<T> {
        const requestKey = this.generateKey(key);

        // Check if request is already in flight
        const inFlight = this.inFlightRequests.get(requestKey);
        if (inFlight) {
            this.logger.info('Request deduplicated (in-flight)', { key: requestKey });
            return inFlight.promise as Promise<T>;
        }

        // Check cache
        const cached = await this.getFromCache(requestKey);
        if (cached !== null) {
            this.logger.info('Request deduplicated (cached)', { key: requestKey });
            return cached;
        }

        // Execute request
        const promise = fn();
        this.inFlightRequests.set(requestKey, {
            key: requestKey,
            promise,
            timestamp: Date.now(),
        });

        try {
            const result = await promise;

            // Cache result
            await this.setInCache(requestKey, result, ttl);

            return result;
        } finally {
            // Clean up in-flight request
            this.inFlightRequests.delete(requestKey);
        }
    }

    /**
     * Generate cache key from request
     */
    private generateKey(input: string): string {
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    /**
     * Get from Redis cache
     */
    private async getFromCache(key: string): Promise<any> {
        try {
            const cached = await redisClient.get(`dedup:${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.error('Cache get error', error);
            return null;
        }
    }

    /**
     * Set in Redis cache
     */
    private async setInCache(key: string, value: any, ttl: number): Promise<void> {
        try {
            await redisClient.setex(
                `dedup:${key}`,
                Math.ceil(ttl / 1000),
                JSON.stringify(value)
            );
        } catch (error) {
            this.logger.error('Cache set error', error);
        }
    }

    /**
     * Clean up expired in-flight requests
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, request] of this.inFlightRequests) {
            if (now - request.timestamp > this.ttl) {
                this.inFlightRequests.delete(key);
            }
        }
    }
}
```

**Step 2: Integrate into LLM Service**

Update `src/modules/llm/llm.service.ts`:

```typescript
import { DeduplicationService } from '../../core/cache/deduplication.service.js';

export class LLMService {
    private deduplication: DeduplicationService;

    constructor(/* ... */) {
        this.deduplication = new DeduplicationService();

        // Clean up every minute
        setInterval(() => this.deduplication.cleanup(), 60000);
    }

    async getLlmResponse(request: LLMRequest): Promise<LLMResponse> {
        // Create deduplication key from request
        const dedupKey = JSON.stringify({
            messages: request.messages,
            model: request.model,
            temperature: request.temperature,
        });

        // Deduplicate request
        return this.deduplication.deduplicate(
            dedupKey,
            () => this.executeLlmRequest(request),
            5 * 60 * 1000 // 5 minute TTL
        );
    }

    private async executeLlmRequest(request: LLMRequest): Promise<LLMResponse> {
        // Existing LLM request logic
        // ...
    }
}
```

**Testing:**

```typescript
describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
        const request = { messages: [{ role: 'user', content: 'Hello' }] };

        // Make 3 identical requests concurrently
        const [r1, r2, r3] = await Promise.all([
            llmService.getLlmResponse(request),
            llmService.getLlmResponse(request),
            llmService.getLlmResponse(request),
        ]);

        // All should return same result
        expect(r1).toEqual(r2);
        expect(r2).toEqual(r3);

        // Should only make 1 actual LLM call
        expect(mockLLMProvider.generate).toHaveBeenCalledTimes(1);
    });
});
```

---

### 2. Database Query Optimization

#### Implementation Steps

**Step 1: Add Database Indexes**

File: `src/database/indexes.ts`

```typescript
import { MongoClient } from 'mongodb';

export async function createIndexes(client: MongoClient): Promise<void> {
    const db = client.db();

    // Conversations collection
    await db.collection('conversations').createIndexes([
        { key: { userId: 1, createdAt: -1 } }, // User's conversations by date
        { key: { userId: 1, updatedAt: -1 } }, // Recently updated
        { key: { 'messages.createdAt': -1 } }, // Message timeline
    ]);

    // Sessions collection
    await db.collection('sessions').createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        { key: { conversationId: 1 } },
        { key: { sessionId: 1 }, unique: true },
        { key: { createdAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60 }, // 30 days TTL
    ]);

    // Memories collection
    await db.collection('memories').createIndexes([
        { key: { userId: 1, importance: -1 } },
        { key: { userId: 1, createdAt: -1 } },
        { key: { tags: 1 } },
    ]);

    // Users collection
    await db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { userId: 1 }, unique: true },
    ]);

    console.log('Database indexes created successfully');
}
```

**Step 2: Optimize Queries**

Update `src/modules/conversation/conversation.service.ts`:

```typescript
async getUserConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    // BEFORE: No projection, fetches all fields
    // const conversations = await this.db.collection('conversations')
    //     .find({ userId })
    //     .toArray();

    // AFTER: Use projection and limit
    const conversations = await this.db.collection('conversations')
        .find({ userId })
        .project({
            _id: 1,
            conversationId: 1,
            title: 1,
            updatedAt: 1,
            messageCount: 1,
            // Exclude heavy fields like full message history
        })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

    return conversations;
}

async getConversationMessages(
    conversationId: string,
    skip: number = 0,
    limit: number = 50
): Promise<Message[]> {
    // Use pagination for large conversations
    const conversation = await this.db.collection('conversations')
        .findOne(
            { conversationId },
            {
                projection: {
                    messages: { $slice: [skip, limit] }
                }
            }
        );

    return conversation?.messages || [];
}
```

**Step 3: Add Query Performance Monitoring**

File: `src/middleware/query-monitor.middleware.ts`

```typescript
import { MongoClient } from 'mongodb';
import { createContextualLogger } from '../core/logger/logger.js';
import metrics from '../core/monitoring/metrics.js';

const logger = createContextualLogger({ module: 'QueryMonitor' });

export function monitorQueries(client: MongoClient): void {
    const originalFind = client.db().collection.prototype.find;
    const originalFindOne = client.db().collection.prototype.findOne;

    // Wrap find method
    client.db().collection.prototype.find = function(...args: any[]) {
        const startTime = Date.now();
        const collectionName = this.collectionName;

        const cursor = originalFind.apply(this, args);
        const originalToArray = cursor.toArray;

        cursor.toArray = async function() {
            const result = await originalToArray.apply(this);
            const duration = Date.now() - startTime;

            metrics.recordDatabaseQuery(collectionName, 'find', duration);

            if (duration > 100) {
                logger.warn('Slow query detected', {
                    collection: collectionName,
                    duration,
                    resultCount: result.length,
                });
            }

            return result;
        };

        return cursor;
    };

    // Similar for findOne
    client.db().collection.prototype.findOne = async function(...args: any[]) {
        const startTime = Date.now();
        const collectionName = this.collectionName;

        const result = await originalFindOne.apply(this, args);
        const duration = Date.now() - startTime;

        metrics.recordDatabaseQuery(collectionName, 'findOne', duration);

        if (duration > 50) {
            logger.warn('Slow query detected', {
                collection: collectionName,
                operation: 'findOne',
                duration,
            });
        }

        return result;
    };
}
```

---

### 3. Cache Warming

#### Implementation Steps

**Step 1: Create Cache Warming Service**

File: `src/core/cache/cache-warming.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import { redisClient } from '../../config/redis.config.js';

export interface WarmingStrategy {
    name: string;
    interval: number; // milliseconds
    execute: () => Promise<void>;
}

export class CacheWarmingService {
    private readonly logger = createContextualLogger({ module: 'CacheWarming' });
    private strategies: WarmingStrategy[] = [];
    private intervals: NodeJS.Timeout[] = [];

    /**
     * Register a cache warming strategy
     */
    registerStrategy(strategy: WarmingStrategy): void {
        this.strategies.push(strategy);
        this.logger.info('Registered cache warming strategy', {
            name: strategy.name,
            interval: strategy.interval,
        });
    }

    /**
     * Start all warming strategies
     */
    start(): void {
        for (const strategy of this.strategies) {
            // Execute immediately
            this.executeStrategy(strategy);

            // Schedule periodic execution
            const interval = setInterval(
                () => this.executeStrategy(strategy),
                strategy.interval
            );

            this.intervals.push(interval);
        }

        this.logger.info('Cache warming started', {
            strategyCount: this.strategies.length,
        });
    }

    /**
     * Stop all warming strategies
     */
    stop(): void {
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
        this.intervals = [];
        this.logger.info('Cache warming stopped');
    }

    /**
     * Execute a warming strategy
     */
    private async executeStrategy(strategy: WarmingStrategy): Promise<void> {
        try {
            const startTime = Date.now();
            await strategy.execute();
            const duration = Date.now() - startTime;

            this.logger.debug('Cache warming strategy executed', {
                name: strategy.name,
                duration,
            });
        } catch (error: any) {
            this.logger.error('Cache warming strategy failed', {
                name: strategy.name,
                error: error.message,
            });
        }
    }
}
```

**Step 2: Define Warming Strategies**

File: `src/core/cache/warming-strategies.ts`

```typescript
import { WarmingStrategy } from './cache-warming.service.js';
import { ConversationService } from '../../modules/conversation/conversation.service.js';
import { TemplateService } from '../../modules/template/template.service.js';
import { redisClient } from '../../config/redis.config.js';

/**
 * Warm popular templates
 */
export const warmTemplatesStrategy: WarmingStrategy = {
    name: 'warm-templates',
    interval: 10 * 60 * 1000, // 10 minutes
    execute: async () => {
        const templateService = new TemplateService();
        const templates = await templateService.getPopularTemplates(10);

        for (const template of templates) {
            await redisClient.setex(
                `template:${template.id}`,
                60 * 60, // 1 hour
                JSON.stringify(template)
            );
        }
    },
};

/**
 * Warm active user data
 */
export const warmActiveUsersStrategy: WarmingStrategy = {
    name: 'warm-active-users',
    interval: 5 * 60 * 1000, // 5 minutes
    execute: async () => {
        // Get list of active users (logged in recently)
        const activeUsers = await getActiveUsers();

        for (const userId of activeUsers) {
            // Warm user's recent conversations
            const conversationService = new ConversationService();
            const conversations = await conversationService.getUserConversations(userId, 5);

            await redisClient.setex(
                `user:${userId}:conversations`,
                5 * 60, // 5 minutes
                JSON.stringify(conversations)
            );
        }
    },
};

/**
 * Warm frequently used tools
 */
export const warmToolsStrategy: WarmingStrategy = {
    name: 'warm-tools',
    interval: 15 * 60 * 1000, // 15 minutes
    execute: async () => {
        const toolService = new ToolService();
        const tools = await toolService.getAvailableTools();

        await redisClient.setex(
            'tools:available',
            15 * 60, // 15 minutes
            JSON.stringify(tools)
        );
    },
};
```

**Step 3: Initialize Cache Warming**

Update `src/app.ts`:

```typescript
import { CacheWarmingService } from './core/cache/cache-warming.service.js';
import {
    warmTemplatesStrategy,
    warmActiveUsersStrategy,
    warmToolsStrategy,
} from './core/cache/warming-strategies.js';

// Initialize cache warming
const cacheWarming = new CacheWarmingService();
cacheWarming.registerStrategy(warmTemplatesStrategy);
cacheWarming.registerStrategy(warmActiveUsersStrategy);
cacheWarming.registerStrategy(warmToolsStrategy);
cacheWarming.start();

// Stop on shutdown
process.on('SIGTERM', () => {
    cacheWarming.stop();
});
```

---

### 4. Connection Pool Tuning

#### Implementation Steps

**Step 1: Optimize MongoDB Connection Pool**

Update `src/config/database.config.ts`:

```typescript
import { MongoClient, MongoClientOptions } from 'mongodb';

export const mongoOptions: MongoClientOptions = {
    // Connection pool settings
    minPoolSize: 10,          // Minimum connections
    maxPoolSize: 50,          // Maximum connections
    maxIdleTimeMS: 30000,     // Close idle connections after 30s
    waitQueueTimeoutMS: 5000, // Wait 5s for connection from pool

    // Performance settings
    compressors: ['zlib'],    // Enable compression
    zlibCompressionLevel: 6,  // Compression level (1-9)

    // Reliability settings
    retryWrites: true,
    retryReads: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Monitoring
    monitorCommands: true,
};

export async function connectDatabase(): Promise<MongoClient> {
    const client = new MongoClient(process.env.MONGODB_URI!, mongoOptions);

    // Monitor connection pool
    client.on('connectionPoolCreated', () => {
        logger.info('MongoDB connection pool created');
    });

    client.on('connectionPoolClosed', () => {
        logger.info('MongoDB connection pool closed');
    });

    client.on('connectionCheckedOut', () => {
        metrics.incrementConnectionPoolCheckout('mongodb');
    });

    client.on('connectionCheckedIn', () => {
        metrics.incrementConnectionPoolCheckin('mongodb');
    });

    await client.connect();
    return client;
}
```

**Step 2: Optimize Redis Connection Pool**

Update `src/config/redis.config.ts`:

```typescript
import Redis from 'ioredis';

export const redisOptions = {
    // Connection pool
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: true,
    enableOfflineQueue: true,

    // Performance
    lazyConnect: false,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,

    // Retry strategy
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },

    // Reconnect strategy
    reconnectOnError(err: Error) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    },
};

export const redisClient = new Redis(process.env.REDIS_URL!, redisOptions);

// Monitor connection
redisClient.on('connect', () => {
    logger.info('Redis connected');
});

redisClient.on('ready', () => {
    logger.info('Redis ready');
    metrics.setRedisStatus('ready');
});

redisClient.on('error', (error) => {
    logger.error('Redis error', { error: error.message });
    metrics.incrementRedisErrors();
});

redisClient.on('close', () => {
    logger.warn('Redis connection closed');
    metrics.setRedisStatus('closed');
});
```

---

### 5. Memory Leak Prevention

#### Implementation Steps

**Step 1: Add Memory Monitoring**

File: `src/core/monitoring/memory-monitor.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import metrics from './metrics.js';

const logger = createContextualLogger({ module: 'MemoryMonitor' });

export class MemoryMonitor {
    private readonly warningThreshold = 0.8; // 80% of heap limit
    private readonly criticalThreshold = 0.9; // 90% of heap limit
    private monitorInterval?: NodeJS.Timeout;

    start(intervalMs: number = 30000): void {
        this.monitorInterval = setInterval(() => {
            this.checkMemory();
        }, intervalMs);

        logger.info('Memory monitoring started', { intervalMs });
    }

    stop(): void {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = undefined;
        }
        logger.info('Memory monitoring stopped');
    }

    private checkMemory(): void {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / 1024 / 1024;
        const heapTotalMB = usage.heapTotal / 1024 / 1024;
        const externalMB = usage.external / 1024 / 1024;
        const rssMB = usage.rss / 1024 / 1024;

        // Record metrics
        metrics.recordMemoryUsage(heapUsedMB, heapTotalMB, rssMB);

        // Calculate heap usage percentage
        const heapUsagePercent = heapUsedMB / heapTotalMB;

        // Check thresholds
        if (heapUsagePercent >= this.criticalThreshold) {
            logger.error('CRITICAL: Memory usage very high', {
                heapUsedMB: heapUsedMB.toFixed(2),
                heapTotalMB: heapTotalMB.toFixed(2),
                percentage: (heapUsagePercent * 100).toFixed(2),
            });

            // Force garbage collection if available
            if (global.gc) {
                logger.info('Forcing garbage collection');
                global.gc();
            }
        } else if (heapUsagePercent >= this.warningThreshold) {
            logger.warn('WARNING: Memory usage high', {
                heapUsedMB: heapUsedMB.toFixed(2),
                heapTotalMB: heapTotalMB.toFixed(2),
                percentage: (heapUsagePercent * 100).toFixed(2),
            });
        }

        // Log detailed memory info periodically
        if (Math.random() < 0.1) { // 10% of checks
            logger.debug('Memory usage details', {
                heapUsed: `${heapUsedMB.toFixed(2)} MB`,
                heapTotal: `${heapTotalMB.toFixed(2)} MB`,
                external: `${externalMB.toFixed(2)} MB`,
                rss: `${rssMB.toFixed(2)} MB`,
            });
        }
    }
}
```

**Step 2: Add Resource Cleanup**

File: `src/core/cleanup/resource-cleanup.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'ResourceCleanup' });

export class ResourceCleanupService {
    private cleanupTasks: Array<() => Promise<void>> = [];

    /**
     * Register a cleanup task
     */
    registerCleanup(task: () => Promise<void>): void {
        this.cleanupTasks.push(task);
    }

    /**
     * Execute all cleanup tasks
     */
    async cleanup(): Promise<void> {
        logger.info('Starting resource cleanup', {
            taskCount: this.cleanupTasks.length,
        });

        for (const task of this.cleanupTasks) {
            try {
                await task();
            } catch (error: any) {
                logger.error('Cleanup task failed', {
                    error: error.message,
                });
            }
        }

        logger.info('Resource cleanup completed');
    }
}

// Global cleanup service
export const cleanupService = new ResourceCleanupService();

// Register common cleanup tasks
cleanupService.registerCleanup(async () => {
    // Clean up old sessions
    logger.info('Cleaning up old sessions');
    // Implementation
});

cleanupService.registerCleanup(async () => {
    // Clean up expired cache entries
    logger.info('Cleaning up expired cache');
    // Implementation
});

// Schedule periodic cleanup
setInterval(() => {
    cleanupService.cleanup();
}, 60 * 60 * 1000); // Every hour
```

**Step 3: Add Heap Snapshot on Demand**

File: `src/routes/debug.routes.ts`

```typescript
import { Router } from 'express';
import v8 from 'v8';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/debug/heap-snapshot', async (req, res) => {
    try {
        const filename = `heap-${Date.now()}.heapsnapshot`;
        const filepath = path.join(process.cwd(), 'logs', filename);

        // Write heap snapshot
        const snapshot = v8.writeHeapSnapshot(filepath);

        res.json({
            success: true,
            file: snapshot,
            message: 'Heap snapshot created',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
```

---

## Verification Steps

### 1. Request Deduplication

```bash
# Monitor deduplication metrics
curl http://localhost:3000/metrics | grep dedup
```

### 2. Database Performance

```bash
# Check slow queries in logs
grep "Slow query" logs/app.log

# Monitor query metrics
curl http://localhost:3000/metrics | grep db_query
```

### 3. Cache Performance

```bash
# Check cache hit rate
curl http://localhost:3000/metrics | grep cache_hit

# Monitor warming
grep "Cache warming" logs/app.log
```

### 4. Memory Monitoring

```bash
# Check memory usage
curl http://localhost:3000/metrics | grep memory

# Create heap snapshot
curl -X POST http://localhost:3000/debug/heap-snapshot
```

---

## Documentation Updates

### 1. Performance Guide

File: `docs/performance/optimization-guide.md`

```markdown
# Performance Optimization Guide

## Request Deduplication
- Automatically deduplicates identical LLM requests
- 5-minute cache TTL
- Saves ~20% of LLM calls

## Database Optimization
- Indexes on all frequently queried fields
- Query monitoring for slow queries (>100ms)
- Projection to fetch only needed fields

## Cache Warming
- Templates warmed every 10 minutes
- Active users warmed every 5 minutes
- Tools warmed every 15 minutes

## Connection Pools
- MongoDB: 10-50 connections
- Redis: Optimized retry strategy
- Monitoring on all connections

## Memory Management
- Monitoring every 30 seconds
- Warning at 80% heap usage
- Critical at 90% heap usage
- Automatic garbage collection trigger
```

---

## Success Metrics

### Before Optimization
- Request deduplication: 0%
- Database queries: Unknown latency
- Cache hit rate: ~25%
- Memory monitoring: None
- Connection pools: Default settings

### After Optimization
- [ ] Request deduplication: 20%+ savings
- [ ] Database queries: <100ms p95
- [ ] Cache hit rate: >40%
- [ ] Memory monitoring: Active
- [ ] Connection pools: Tuned

---

## Completion Checklist

- [ ] Request deduplication implemented
- [ ] Database indexes created
- [ ] Query monitoring added
- [ ] Cache warming strategies active
- [ ] Connection pools tuned
- [ ] Memory monitoring active
- [ ] Resource cleanup scheduled
- [ ] Documentation updated
- [ ] Performance benchmarks updated

---

**Stage 4 Status:** Ready for Implementation  
**Estimated Time:** 24-32 hours  
**Risk Level:** Low (mostly configuration and monitoring)
