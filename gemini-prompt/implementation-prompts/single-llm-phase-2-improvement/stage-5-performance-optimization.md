# Stage 5: Performance Optimization

**Priority:** P2 (Important for Scale)  
**Duration:** 5 days  
**Dependencies:** Stages 1-3 (requires monitoring and testing infrastructure)  
**Current Completion:** 70%

---

## Context & Background

### Current State Analysis

**✅ What Exists:**
- Response caching (Redis, 1 hour TTL)
- Tool result caching
- Circuit breakers for fault tolerance
- Session state caching
- Basic retry logic

**❌ What's Missing:**
- **Tool execution parallelization** (currently sequential)
- **Request deduplication**
- **Database query optimization**
- **Cache warming strategies**
- **Connection pooling optimization**
- **Memory leak prevention**
- **Performance profiling**

### Why This Matters

Without optimization:
- **Slow response times** under load
- **Resource exhaustion** at scale
- **Wasted compute** on duplicate requests
- **Database bottlenecks**
- **Poor cache utilization**

---

## Objectives

### Primary Goals

1. **Parallel Tool Execution** - Execute independent tools concurrently
2. **Request Deduplication** - Avoid redundant LLM calls
3. **Database Optimization** - Faster queries and indexing
4. **Cache Optimization** - Better hit rates and warming
5. **Resource Management** - Prevent leaks and exhaustion

### Success Criteria

- [ ] Tool execution 3x faster for parallel-eligible requests
- [ ] Request deduplication saving 20%+ LLM calls
- [ ] Database queries <100ms p95
- [ ] Cache hit rate >40%
- [ ] Zero memory leaks
- [ ] Connection pools optimized
- [ ] Performance benchmarks documented

---

## Technical Requirements

### 1. Tool Execution Parallelization

#### Current Implementation (Sequential)

```typescript
// src/modules/session/tool.executor.ts (current)
async executeTools(tools: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  for (const tool of tools) {
    const result = await this.executeTool(tool);
    results.push(result);
  }
  
  return results;
}
```

#### Optimized Implementation (Parallel)

Create `src/modules/tool/parallel-executor.service.ts`:

```typescript
import { Logger } from '@/core/logger/logger';
import { ToolService } from './tool.service';

interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  dependencies?: string[]; // IDs of tools this depends on
}

interface ToolResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class ParallelToolExecutor {
  private readonly logger = new Logger('ParallelToolExecutor');

  constructor(private readonly toolService: ToolService) {}

  /**
   * Execute tools in parallel where possible
   */
  async executeTools(tools: ToolCall[]): Promise<ToolResult[]> {
    // Build dependency graph
    const graph = this.buildDependencyGraph(tools);
    
    // Execute in topological order with parallelization
    return this.executeWithDependencies(tools, graph);
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(tools: ToolCall[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const tool of tools) {
      graph.set(tool.id, new Set(tool.dependencies || []));
    }

    return graph;
  }

  /**
   * Execute tools respecting dependencies
   */
  private async executeWithDependencies(
    tools: ToolCall[],
    graph: Map<string, Set<string>>
  ): Promise<ToolResult[]> {
    const results = new Map<string, ToolResult>();
    const executing = new Set<string>();
    const completed = new Set<string>();

    /**
     * Check if tool can be executed (all dependencies completed)
     */
    const canExecute = (toolId: string): boolean => {
      const deps = graph.get(toolId) || new Set();
      return Array.from(deps).every(dep => completed.has(dep));
    };

    /**
     * Execute a single tool
     */
    const executeTool = async (tool: ToolCall): Promise<void> => {
      executing.add(tool.id);
      
      const startTime = Date.now();
      try {
        const result = await this.toolService.execute(tool.name, tool.parameters);
        
        results.set(tool.id, {
          id: tool.id,
          success: true,
          result,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        this.logger.error(`Tool execution failed: ${tool.name}`, error);
        
        results.set(tool.id, {
          id: tool.id,
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
        });
      } finally {
        executing.delete(tool.id);
        completed.add(tool.id);
      }
    };

    // Execute tools in waves
    while (completed.size < tools.length) {
      // Find tools ready to execute
      const ready = tools.filter(
        tool => !executing.has(tool.id) && 
                !completed.has(tool.id) && 
                canExecute(tool.id)
      );

      if (ready.length === 0) {
        // Deadlock or all executing
        if (executing.size === 0) {
          throw new Error('Circular dependency detected in tool execution');
        }
        // Wait for current executions to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Execute all ready tools in parallel
      await Promise.all(ready.map(tool => executeTool(tool)));
    }

    // Return results in original order
    return tools.map(tool => results.get(tool.id)!);
  }

  /**
   * Analyze tools for parallelization opportunities
   */
  analyzeDependencies(tools: ToolCall[]): {
    parallelizable: number;
    sequential: number;
    maxParallelism: number;
  } {
    const graph = this.buildDependencyGraph(tools);
    
    // Count tools with no dependencies
    const parallelizable = Array.from(graph.values())
      .filter(deps => deps.size === 0).length;

    // Calculate max parallelism (longest chain)
    const maxParallelism = this.calculateMaxParallelism(tools, graph);

    return {
      parallelizable,
      sequential: tools.length - parallelizable,
      maxParallelism,
    };
  }

  private calculateMaxParallelism(
    tools: ToolCall[],
    graph: Map<string, Set<string>>
  ): number {
    // Simplified: count tools at each level
    const levels = new Map<string, number>();

    const getLevel = (toolId: string): number => {
      if (levels.has(toolId)) {
        return levels.get(toolId)!;
      }

      const deps = graph.get(toolId) || new Set();
      if (deps.size === 0) {
        levels.set(toolId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...Array.from(deps).map(getLevel));
      const level = maxDepLevel + 1;
      levels.set(toolId, level);
      return level;
    };

    tools.forEach(tool => getLevel(tool.id));

    // Count tools at each level
    const levelCounts = new Map<number, number>();
    for (const level of levels.values()) {
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    }

    return Math.max(...levelCounts.values());
  }
}
```

---

### 2. Request Deduplication

Create `src/core/cache/request-deduplicator.service.ts`:

```typescript
import { RedisService } from './redis.service';
import { Logger } from '@/core/logger/logger';
import crypto from 'crypto';

interface PendingRequest<T> {
  promise: Promise<T>;
  resolvers: Array<(value: T) => void>;
  rejectors: Array<(error: any) => void>;
}

export class RequestDeduplicator {
  private readonly logger = new Logger('RequestDeduplicator');
  private readonly pendingRequests = new Map<string, PendingRequest<any>>();

  constructor(private readonly redis: RedisService) {}

  /**
   * Deduplicate identical requests
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 60
  ): Promise<T> {
    const requestKey = this.generateKey(key);

    // Check if request is already pending
    if (this.pendingRequests.has(requestKey)) {
      this.logger.debug(`Request deduplicated (in-flight): ${key}`);
      return this.waitForPending(requestKey);
    }

    // Check cache
    const cached = await this.redis.get(requestKey);
    if (cached) {
      this.logger.debug(`Request deduplicated (cached): ${key}`);
      return JSON.parse(cached);
    }

    // Execute request
    return this.executeAndCache(requestKey, fn, ttl);
  }

  /**
   * Wait for pending request
   */
  private waitForPending<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const pending = this.pendingRequests.get(key)!;
      pending.resolvers.push(resolve);
      pending.rejectors.push(reject);
    });
  }

  /**
   * Execute request and cache result
   */
  private async executeAndCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const pending: PendingRequest<T> = {
      promise: fn(),
      resolvers: [],
      rejectors: [],
    };

    this.pendingRequests.set(key, pending);

    try {
      const result = await pending.promise;

      // Cache result
      await this.redis.setex(key, ttl, JSON.stringify(result));

      // Resolve all waiting requests
      pending.resolvers.forEach(resolve => resolve(result));

      return result;
    } catch (error) {
      // Reject all waiting requests
      pending.rejectors.forEach(reject => reject(error));
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Generate cache key from request
   */
  private generateKey(input: string): string {
    return `dedup:${crypto.createHash('sha256').update(input).digest('hex')}`;
  }

  /**
   * Clear all pending requests (for shutdown)
   */
  clearPending(): void {
    this.pendingRequests.clear();
  }
}
```

**Integration with LLM Service:**

```typescript
// src/modules/llm/llm.service.ts
import { RequestDeduplicator } from '@/core/cache/request-deduplicator.service';

export class LLMService {
  constructor(
    private readonly deduplicator: RequestDeduplicator,
    // ... other dependencies
  ) {}

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    // Create deduplication key from request
    const dedupKey = JSON.stringify({
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
    });

    return this.deduplicator.deduplicate(
      dedupKey,
      () => this.executeGeneration(request),
      300 // 5 minutes TTL
    );
  }

  private async executeGeneration(request: LLMRequest): Promise<LLMResponse> {
    // Actual LLM call
    // ...
  }
}
```

---

### 3. Database Query Optimization

#### Add Indexes

Create `scripts/optimize-database.ts`:

```typescript
import { MongoClient } from 'mongodb';

async function optimizeDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db();

  // Conversations collection
  await db.collection('conversations').createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, updatedAt: -1 } },
    { key: { 'messages.createdAt': -1 } },
  ]);

  // Sessions collection
  await db.collection('sessions').createIndexes([
    { key: { userId: 1, status: 1 } },
    { key: { conversationId: 1 } },
    { key: { createdAt: -1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
  ]);

  // Memory collection
  await db.collection('memories').createIndexes([
    { key: { userId: 1, importance: -1 } },
    { key: { conversationId: 1 } },
    { key: { createdAt: -1 } },
  ]);

  // Users collection
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { 'oauth.provider': 1, 'oauth.providerId': 1 } },
  ]);

  console.log('Database indexes created successfully');
  await client.close();
}

optimizeDatabase();
```

#### Query Optimization

```typescript
// Before (slow)
const conversations = await db.collection('conversations')
  .find({ userId })
  .toArray();

// After (fast)
const conversations = await db.collection('conversations')
  .find({ userId })
  .sort({ updatedAt: -1 })
  .limit(50)
  .project({ messages: 0 }) // Exclude large fields
  .toArray();
```

#### Aggregation Pipeline Optimization

```typescript
// Optimize conversation summary query
const summaries = await db.collection('conversations').aggregate([
  { $match: { userId } },
  { $sort: { updatedAt: -1 } },
  { $limit: 50 },
  {
    $project: {
      id: 1,
      title: 1,
      updatedAt: 1,
      messageCount: { $size: '$messages' },
      lastMessage: { $arrayElemAt: ['$messages', -1] },
    },
  },
]).toArray();
```

---

### 4. Cache Warming

Create `src/core/cache/cache-warmer.service.ts`:

```typescript
import { CacheService } from './cache.service';
import { Logger } from '@/core/logger/logger';

export class CacheWarmer {
  private readonly logger = new Logger('CacheWarmer');

  constructor(private readonly cache: CacheService) {}

  /**
   * Warm cache on application startup
   */
  async warmCache(): Promise<void> {
    this.logger.info('Starting cache warming...');

    await Promise.all([
      this.warmSystemPrompts(),
      this.warmCommonQueries(),
      this.warmModelConfigs(),
    ]);

    this.logger.info('Cache warming complete');
  }

  /**
   * Warm system prompts
   */
  private async warmSystemPrompts(): Promise<void> {
    // Pre-load common system prompts
    const prompts = [
      'default',
      'helpful-assistant',
      'code-assistant',
      'creative-writer',
    ];

    for (const prompt of prompts) {
      await this.cache.set(
        `system-prompt:${prompt}`,
        await this.loadSystemPrompt(prompt),
        3600
      );
    }
  }

  /**
   * Warm common queries
   */
  private async warmCommonQueries(): Promise<void> {
    // Pre-compute common LLM responses
    const commonQueries = [
      'Hello',
      'How are you?',
      'What can you do?',
    ];

    // Warm these in background
    for (const query of commonQueries) {
      // Trigger LLM call to populate cache
      // ...
    }
  }

  /**
   * Warm model configurations
   */
  private async warmModelConfigs(): Promise<void> {
    // Pre-load model configurations
    const models = ['llama3.1', 'llama3.2', 'mistral'];

    for (const model of models) {
      await this.cache.set(
        `model-config:${model}`,
        await this.loadModelConfig(model),
        3600
      );
    }
  }

  private async loadSystemPrompt(name: string): Promise<string> {
    // Load from database or file
    return '';
  }

  private async loadModelConfig(model: string): Promise<any> {
    // Load model configuration
    return {};
  }
}
```

---

### 5. Connection Pool Optimization

#### MongoDB Connection Pool

```typescript
// src/core/database/mongodb.ts
import { MongoClient, MongoClientOptions } from 'mongodb';

const options: MongoClientOptions = {
  maxPoolSize: 50,           // Increased from default 100
  minPoolSize: 10,           // Maintain minimum connections
  maxIdleTimeMS: 30000,      // Close idle connections after 30s
  waitQueueTimeoutMS: 5000,  // Timeout for waiting for connection
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

export const mongoClient = new MongoClient(process.env.MONGODB_URI!, options);
```

#### Redis Connection Pool

```typescript
// src/core/cache/redis.service.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  
  // Connection pool settings
  connectionName: 'gnani-backend',
  keepAlive: 30000,
  
  // Retry strategy
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});
```

---

### 6. Memory Leak Prevention

Create `src/core/monitoring/memory-monitor.ts`:

```typescript
import { Logger } from '@/core/logger/logger';

export class MemoryMonitor {
  private readonly logger = new Logger('MemoryMonitor');
  private readonly thresholdMB = 1024; // 1GB threshold
  private interval: NodeJS.Timeout | null = null;

  start(): void {
    this.interval = setInterval(() => {
      this.checkMemory();
    }, 30000); // Check every 30 seconds
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private checkMemory(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const rssUsedMB = usage.rss / 1024 / 1024;

    if (heapUsedMB > this.thresholdMB) {
      this.logger.warn('High memory usage detected', {
        heapUsedMB: heapUsedMB.toFixed(2),
        rssUsedMB: rssUsedMB.toFixed(2),
        external: (usage.external / 1024 / 1024).toFixed(2),
      });

      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.info('Manual garbage collection triggered');
      }
    }
  }

  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
      external: usage.external / 1024 / 1024,
    };
  }
}
```

---

## Implementation Checklist

### Day 1: Tool Parallelization
- [ ] Create `parallel-executor.service.ts`
- [ ] Implement dependency graph
- [ ] Test with parallel-eligible tools
- [ ] Measure performance improvement
- [ ] Document parallelization strategy

### Day 2: Request Deduplication
- [ ] Create `request-deduplicator.service.ts`
- [ ] Integrate with LLM service
- [ ] Test deduplication effectiveness
- [ ] Measure cache savings
- [ ] Monitor deduplication metrics

### Day 3: Database Optimization
- [ ] Create database indexes
- [ ] Optimize slow queries
- [ ] Implement query result caching
- [ ] Test query performance
- [ ] Document optimization strategies

### Day 4: Cache Optimization
- [ ] Create cache warmer
- [ ] Implement warming strategies
- [ ] Optimize cache TTLs
- [ ] Monitor cache hit rates
- [ ] Document cache strategy

### Day 5: Resource Management
- [ ] Optimize connection pools
- [ ] Implement memory monitoring
- [ ] Add leak detection
- [ ] Performance profiling
- [ ] Document best practices

---

## Success Metrics

- [ ] Tool execution 3x faster (parallel)
- [ ] 20%+ LLM calls saved (deduplication)
- [ ] Database queries <100ms p95
- [ ] Cache hit rate >40%
- [ ] Zero memory leaks detected
- [ ] Connection pools optimized
- [ ] Performance benchmarks documented

---

**Estimated Effort:** 5 days  
**Complexity:** Moderate  
**Risk:** Low (optimizations are additive)
