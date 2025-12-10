# Stage 2: Circuit Breakers & Fault Tolerance

**Priority:** P0 (Blocking Production)  
**Estimated Time:** 1 week  
**Dependencies:** None

---

## Objective

Implement circuit breakers for all external dependencies (MongoDB, Redis, ChromaDB, Whisper, Ollama) to prevent cascade failures and improve system resilience. Currently, only the LLM service has a circuit breaker.

---

## Current State

**Existing Circuit Breaker:**
- Location: `src/core/reliability/circuit-breaker.ts`
- Used by: `LlmService` only
- Features: Failure threshold, reset timeout, request timeout

**Missing Circuit Breakers:**
- MongoDB connections
- Redis operations
- ChromaDB vector search
- Whisper STT service
- Tool executions

---

## Implementation

### 1. Enhance Circuit Breaker

**File:** `src/core/reliability/circuit-breaker.ts`

Add monitoring and metrics:

```typescript
import metrics from '../monitoring/metrics.js';
import { createContextualLogger } from '../logger/logger.js';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  requestTimeoutMs: number;
  halfOpenRequests?: number; // Number of requests to test in half-open state
  monitoringEnabled?: boolean;
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0; // For half-open state
  private logger;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions
  ) {
    this.logger = createContextualLogger({ module: `CircuitBreaker:${name}` });
    this.options.halfOpenRequests = options.halfOpenRequests || 3;
    this.options.monitoringEnabled = options.monitoringEnabled !== false;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition to HALF_OPEN
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceFailure >= this.options.resetTimeoutMs) {
        this.logger.info(`Circuit transitioning to HALF_OPEN: ${this.name}`);
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.updateMetrics();
      } else {
        this.logger.warn(`Circuit is OPEN, rejecting request: ${this.name}`);
        this.updateMetrics();
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.options.requestTimeoutMs}ms`)),
          this.options.requestTimeoutMs
        )
      )
    ]);
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      this.logger.debug(`Half-open success count: ${this.successCount}/${this.options.halfOpenRequests}`);
      
      if (this.successCount >= (this.options.halfOpenRequests || 3)) {
        this.logger.info(`Circuit transitioning to CLOSED: ${this.name}`);
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0; // Reset on success
    }
    
    this.updateMetrics();
  }

  private onFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    this.logger.error(`Circuit breaker failure (${this.failureCount}/${this.options.failureThreshold}): ${error.message}`);

    if (this.state === 'HALF_OPEN') {
      this.logger.warn(`Half-open test failed, circuit transitioning to OPEN: ${this.name}`);
      this.state = 'OPEN';
      this.successCount = 0;
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.logger.error(`Circuit transitioning to OPEN: ${this.name}`);
      this.state = 'OPEN';
    }
    
    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (!this.options.monitoringEnabled) return;
    
    metrics.circuitBreakerState.set(
      { circuit: this.name, state: this.state },
      this.state === 'CLOSED' ? 0 : this.state === 'HALF_OPEN' ? 1 : 2
    );
    
    metrics.circuitBreakerFailures.set(
      { circuit: this.name },
      this.failureCount
    );
  }

  getState(): string {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }

  // Manual control (for testing/admin)
  forceOpen(): void {
    this.state = 'OPEN';
    this.logger.warn(`Circuit manually forced OPEN: ${this.name}`);
    this.updateMetrics();
  }

  forceClose(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.logger.info(`Circuit manually forced CLOSED: ${this.name}`);
    this.updateMetrics();
  }
}
```

### 2. MongoDB Circuit Breaker

**File:** `src/config/database.config.ts`

```typescript
import mongoose from 'mongoose';
import { CircuitBreaker } from '../core/reliability/circuit-breaker.js';
import { createContextualLogger } from '../core/logger/logger.js';

const logger = createContextualLogger({ module: 'Database' });

const mongoCircuitBreaker = new CircuitBreaker('MongoDB', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  requestTimeoutMs: 10000
});

export async function connectDatabase(): Promise<void> {
  try {
    await mongoCircuitBreaker.execute(async () => {
      await mongoose.connect(process.env.MONGODB_URI!, {
        maxPoolSize: 100,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000
      });
    });
    
    logger.info('MongoDB connected successfully');
  } catch (error: any) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

// Wrapper for MongoDB operations
export async function withMongoCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return mongoCircuitBreaker.execute(operation);
}

export { mongoCircuitBreaker };
```

**Usage in models:**

```typescript
import { withMongoCircuitBreaker } from '../../config/database.config.js';

// In any service
async findUser(userId: string) {
  return withMongoCircuitBreaker(async () => {
    return await User.findById(userId);
  });
}
```

### 3. Redis Circuit Breaker

**File:** `src/config/redis.config.ts`

```typescript
import Redis from 'ioredis';
import { CircuitBreaker } from '../core/reliability/circuit-breaker.js';
import { createContextualLogger } from '../core/logger/logger.js';

const logger = createContextualLogger({ module: 'Redis' });

const redisCircuitBreaker = new CircuitBreaker('Redis', {
  failureThreshold: 5,
  resetTimeoutMs: 20000,
  requestTimeoutMs: 5000
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis max retries exceeded');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  enableReadyCheck: true,
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

// Wrapper for Redis operations
export async function withRedisCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  try {
    return await redisCircuitBreaker.execute(operation);
  } catch (error: any) {
    logger.warn(`Redis operation failed: ${error.message}`);
    if (fallback) {
      logger.info('Using fallback for Redis operation');
      return fallback();
    }
    throw error;
  }
}

export { redis, redisCircuitBreaker };
export default redis;
```

**Usage:**

```typescript
import { withRedisCircuitBreaker } from '../../config/redis.config.js';

async getCachedData(key: string): Promise<string | null> {
  return withRedisCircuitBreaker(
    async () => await redis.get(key),
    () => null // Fallback: return null if Redis is down
  );
}
```

### 4. ChromaDB Circuit Breaker

**File:** `src/modules/vector/vector.manager.ts`

```typescript
import { CircuitBreaker } from '../../core/reliability/circuit-breaker.js';

class VectorManager {
  private chromaCircuitBreaker: CircuitBreaker;

  constructor() {
    this.chromaCircuitBreaker = new CircuitBreaker('ChromaDB', {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      requestTimeoutMs: 15000
    });
  }

  async search(query: string, limit: number = 5): Promise<any[]> {
    try {
      return await this.chromaCircuitBreaker.execute(async () => {
        // Existing ChromaDB search logic
        const results = await this.collection.query({
          queryTexts: [query],
          nResults: limit
        });
        return results;
      });
    } catch (error: any) {
      this.logger.error(`Vector search failed: ${error.message}`);
      // Graceful degradation: return empty results
      return [];
    }
  }
}
```

### 5. Whisper STT Circuit Breaker

**File:** `src/modules/asr/whisper-cpp.service.ts`

```typescript
import { CircuitBreaker } from '../../core/reliability/circuit-breaker.js';

class WhisperCppService {
  private whisperCircuitBreaker: CircuitBreaker;

  constructor() {
    this.whisperCircuitBreaker = new CircuitBreaker('Whisper', {
      failureThreshold: 3,
      resetTimeoutMs: 20000,
      requestTimeoutMs: 30000 // STT can be slow
    });
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    return this.whisperCircuitBreaker.execute(async () => {
      // Existing Whisper transcription logic
      const result = await this.runWhisper(audioBuffer);
      return result.text;
    });
  }
}
```

### 6. Tool Execution Circuit Breaker

**File:** `src/modules/tool/tool.executor.ts`

```typescript
import { CircuitBreaker } from '../../core/reliability/circuit-breaker.js';

class ToolExecutor {
  private toolCircuitBreakers: Map<string, CircuitBreaker> = new Map();

  private getCircuitBreaker(toolName: string): CircuitBreaker {
    if (!this.toolCircuitBreakers.has(toolName)) {
      this.toolCircuitBreakers.set(
        toolName,
        new CircuitBreaker(`Tool:${toolName}`, {
          failureThreshold: 3,
          resetTimeoutMs: 15000,
          requestTimeoutMs: 10000
        })
      );
    }
    return this.toolCircuitBreakers.get(toolName)!;
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const circuitBreaker = this.getCircuitBreaker(toolName);
    
    try {
      return await circuitBreaker.execute(async () => {
        // Existing tool execution logic
        return await this.runTool(toolName, parameters);
      });
    } catch (error: any) {
      this.logger.error(`Tool execution failed: ${toolName} - ${error.message}`);
      return {
        success: false,
        error: `Tool ${toolName} is currently unavailable`
      };
    }
  }
}
```

### 7. Circuit Breaker Monitoring Dashboard

**File:** `src/modules/admin/circuit-breaker.routes.ts`

```typescript
import express from 'express';
import { mongoCircuitBreaker } from '../../config/database.config.js';
import { redisCircuitBreaker } from '../../config/redis.config.js';

const router = express.Router();

/**
 * GET /api/admin/circuit-breakers
 * Get status of all circuit breakers
 */
router.get('/circuit-breakers', (req, res) => {
  const breakers = {
    mongodb: mongoCircuitBreaker.getStats(),
    redis: redisCircuitBreaker.getStats(),
    // Add others as they're registered
  };

  res.json({
    success: true,
    breakers
  });
});

/**
 * POST /api/admin/circuit-breakers/:name/reset
 * Manually reset a circuit breaker
 */
router.post('/circuit-breakers/:name/reset', (req, res) => {
  const { name } = req.params;
  
  // Map name to circuit breaker instance
  const breakers: Record<string, any> = {
    mongodb: mongoCircuitBreaker,
    redis: redisCircuitBreaker
  };

  const breaker = breakers[name];
  if (!breaker) {
    return res.status(404).json({ error: 'Circuit breaker not found' });
  }

  breaker.forceClose();
  
  res.json({
    success: true,
    message: `Circuit breaker ${name} reset to CLOSED`
  });
});

export default router;
```

### 8. Add Prometheus Metrics

**File:** `src/core/monitoring/metrics.ts`

```typescript
import { Gauge, Counter } from 'prom-client';

export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
  labelNames: ['circuit', 'state']
});

export const circuitBreakerFailures = new Gauge({
  name: 'circuit_breaker_failures',
  help: 'Number of failures in circuit breaker',
  labelNames: ['circuit']
});

export const circuitBreakerTrips = new Counter({
  name: 'circuit_breaker_trips_total',
  help: 'Total number of times circuit breaker opened',
  labelNames: ['circuit']
});
```

---

## Testing

### Unit Tests

```typescript
describe('CircuitBreaker', () => {
  it('should open after threshold failures', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      requestTimeoutMs: 500
    });

    const failingFn = async () => {
      throw new Error('Test failure');
    };

    // Trigger failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch (e) {}
    }

    expect(breaker.getState()).toBe('OPEN');
  });

  it('should transition to half-open after timeout', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 2,
      resetTimeoutMs: 100,
      requestTimeoutMs: 500
    });

    // Open circuit
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => { throw new Error('fail'); });
      } catch (e) {}
    }

    expect(breaker.getState()).toBe('OPEN');

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Next request should transition to HALF_OPEN
    try {
      await breaker.execute(async () => 'success');
    } catch (e) {}

    expect(breaker.getState()).toBe('HALF_OPEN');
  });
});
```

---

## Verification Checklist

- [ ] Enhanced CircuitBreaker with half-open state
- [ ] MongoDB circuit breaker implemented
- [ ] Redis circuit breaker with fallback
- [ ] ChromaDB circuit breaker implemented
- [ ] Whisper STT circuit breaker implemented
- [ ] Tool execution circuit breakers (per-tool)
- [ ] Admin API for circuit breaker status
- [ ] Prometheus metrics exported
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Grafana dashboard created

---

## Success Criteria

1. ✅ All external dependencies protected by circuit breakers
2. ✅ System remains operational when dependencies fail
3. ✅ Circuit breakers automatically recover
4. ✅ Metrics exported to Prometheus
5. ✅ Admin can manually reset circuit breakers
