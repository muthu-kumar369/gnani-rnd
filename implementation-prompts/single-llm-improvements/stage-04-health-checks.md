# Stage 4: Health Checks & Readiness Probes

**Priority:** P0  
**Time:** 3 days  
**Dependencies:** Stages 1-3

---

## Objective

Implement comprehensive health checks and readiness probes for production deployment, enabling load balancers and orchestrators to route traffic only to healthy instances.

---

## Implementation

### 1. Health Check Endpoint

**File:** `src/routes/health.routes.ts`

```typescript
import express from 'express';
import mongoose from 'mongoose';
import redis from '../config/redis.config.js';
import { createContextualLogger } from '../core/logger/logger.js';

const router = express.Router();
const logger = createContextualLogger({ module: 'HealthCheck' });

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      latency?: number;
      message?: string;
    };
  };
}

/**
 * GET /health
 * Liveness probe - is the service running?
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/ready
 * Readiness probe - is the service ready to accept traffic?
 */
router.get('/health/ready', async (req, res) => {
  const checks: HealthStatus['checks'] = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check MongoDB
  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    checks.mongodb = {
      status: 'up',
      latency: Date.now() - start
    };
  } catch (error: any) {
    checks.mongodb = {
      status: 'down',
      message: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    checks.redis = {
      status: 'up',
      latency: Date.now() - start
    };
  } catch (error: any) {
    checks.redis = {
      status: 'down',
      message: error.message
    };
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  // Check LLM service
  try {
    const start = Date.now();
    const response = await fetch(`${process.env.LLM_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    checks.llm = {
      status: response.ok ? 'up' : 'down',
      latency: Date.now() - start
    };
    if (!response.ok) {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }
  } catch (error: any) {
    checks.llm = {
      status: 'down',
      message: error.message
    };
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  });
});

/**
 * GET /health/detailed
 * Detailed health information (admin only)
 */
router.get('/health/detailed', async (req, res) => {
  const memUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    },
    cpu: process.cpuUsage(),
    nodejs: process.version,
    pid: process.pid
  });
});

export default router;
```

### 2. Startup Checks

**File:** `src/core/startup/startup-checks.ts`

```typescript
import mongoose from 'mongoose';
import redis from '../../config/redis.config.js';
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'StartupChecks' });

export async function runStartupChecks(): Promise<boolean> {
  logger.info('Running startup checks...');

  const checks = [
    checkMongoDB(),
    checkRedis(),
    checkLLMService(),
    checkRequiredEnvVars()
  ];

  const results = await Promise.allSettled(checks);
  
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    logger.error(`Startup checks failed: ${failures.length}/${checks.length}`);
    failures.forEach((f: any) => {
      logger.error(`  - ${f.reason}`);
    });
    return false;
  }

  logger.info('All startup checks passed ✓');
  return true;
}

async function checkMongoDB(): Promise<void> {
  try {
    await mongoose.connection.db.admin().ping();
    logger.info('✓ MongoDB connection OK');
  } catch (error: any) {
    throw new Error(`MongoDB check failed: ${error.message}`);
  }
}

async function checkRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info('✓ Redis connection OK');
  } catch (error: any) {
    throw new Error(`Redis check failed: ${error.message}`);
  }
}

async function checkLLMService(): Promise<void> {
  try {
    const response = await fetch(`${process.env.LLM_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      throw new Error(`LLM service returned ${response.status}`);
    }
    logger.info('✓ LLM service OK');
  } catch (error: any) {
    throw new Error(`LLM service check failed: ${error.message}`);
  }
}

function checkRequiredEnvVars(): Promise<void> {
  const required = [
    'MONGODB_URI',
    'REDIS_HOST',
    'LLM_SERVER_URL',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  logger.info('✓ Environment variables OK');
  return Promise.resolve();
}
```

### 3. Graceful Shutdown

**File:** `src/core/shutdown/graceful-shutdown.ts`

```typescript
import { Server } from 'http';
import mongoose from 'mongoose';
import redis from '../../config/redis.config.js';
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'GracefulShutdown' });

let isShuttingDown = false;

export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Give existing requests 30s to complete
    setTimeout(() => {
      logger.error('Forcefully shutting down after timeout');
      process.exit(1);
    }, 30000);

    try {
      // Close database connections
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      await redis.quit();
      logger.info('Redis connection closed');

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error: any) {
      logger.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

### 4. Update Server Startup

**File:** `src/index.ts`

```typescript
import { runStartupChecks } from './core/startup/startup-checks.js';
import { setupGracefulShutdown } from './core/shutdown/graceful-shutdown.js';

async function startServer() {
  // Run startup checks
  const checksPass = await runStartupChecks();
  if (!checksPass) {
    logger.error('Startup checks failed, exiting...');
    process.exit(1);
  }

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Setup graceful shutdown
  setupGracefulShutdown(server);
}

startServer();
```

---

## Kubernetes Configuration

**File:** `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gnani-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: gnani-backend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
```

---

## Verification

- [ ] Health endpoint returns 200
- [ ] Readiness probe checks all dependencies
- [ ] Startup checks prevent unhealthy starts
- [ ] Graceful shutdown completes within 30s
- [ ] K8s probes configured correctly
- [ ] Load balancer routes only to ready instances

---

## Success Criteria

1. ✅ Zero downtime deployments
2. ✅ Unhealthy instances automatically removed from load balancer
3. ✅ Graceful shutdown prevents connection drops
4. ✅ Startup failures detected before accepting traffic
