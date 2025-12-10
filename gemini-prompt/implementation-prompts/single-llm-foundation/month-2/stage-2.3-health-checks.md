# Stage 2.3: Health Checks & Graceful Shutdown

**Duration:** Week 8 (5 working days)  
**Priority:** 🟡 High  
**Dependencies:** Stage 2.2 (Monitoring)

---

## Overview

Implement comprehensive health checks and graceful shutdown mechanisms to ensure zero-downtime deployments and reliable service status reporting.

## Goals

1. Add health check endpoints (health, readiness, liveness)
2. Implement graceful shutdown for all services
3. Add connection draining for active sessions
4. Test zero-downtime deployment

---

## Health Check Endpoints

### Task 1: Health Check Routes

**File:** `gnani-rnd-backend/src/routes/health.routes.ts` (Update existing)

```typescript
import express from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis.config.js';
import { llmManager } from '../core/llm/llm.manager.js';
import whisperService from '../modules/asr/whisper.service.js';
import vectorManager from '../modules/vector/vector.manager.js';

const router = express.Router();

// Basic health check - always returns 200 if server is running
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check - checks if all dependencies are ready
router.get('/ready', async (req, res) => {
  const checks = {
    mongodb: false,
    redis: false,
    llm: false,
    whisper: false,
    vector: false
  };

  let allReady = true;

  // Check MongoDB
  try {
    checks.mongodb = mongoose.connection.readyState === 1;
  } catch (error) {
    checks.mongodb = false;
  }

  // Check Redis
  try {
    await redisClient.ping();
    checks.redis = true;
  } catch (error) {
    checks.redis = false;
  }

  // Check LLM
  try {
    checks.llm = await llmManager.currentProvider.isAvailable();
  } catch (error) {
    checks.llm = false;
  }

  // Check Whisper
  try {
    checks.whisper = whisperService.isReady();
  } catch (error) {
    checks.whisper = false;
  }

  // Check Vector DB
  try {
    checks.vector = await vectorManager.isHealthy();
  } catch (error) {
    checks.vector = false;
  }

  allReady = Object.values(checks).every(check => check === true);

  res.status(allReady ? 200 : 503).json({
    status: allReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

// Liveness check - checks if server is alive (not deadlocked)
router.get('/live', (req, res) => {
  // Simple check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;
```

### Task 2: Add Health Checks to Services

**File:** `gnani-rnd-backend/src/modules/asr/whisper.service.ts`

```typescript
export class WhisperService {
  private ready: boolean = false;

  async initialize(): Promise<void> {
    try {
      // Test whisper process
      await this.testTranscription();
      this.ready = true;
      this.logger.info('Whisper service ready');
    } catch (error) {
      this.ready = false;
      this.logger.error('Whisper service initialization failed', error);
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  private async testTranscription(): Promise<void> {
    // Send a small test audio to verify whisper works
    const testAudio = Buffer.alloc(16000); // 1 second of silence
    await this.transcribe('test-session', testAudio, 16000);
  }
}
```

---

## Graceful Shutdown

### Task 3: Shutdown Manager

**File:** `gnani-rnd-backend/src/core/shutdown/shutdown-manager.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';
import { Server } from 'http';
import mongoose from 'mongoose';
import redisClient from '../../config/redis.config.js';
import sessionCoordinator from '../../modules/session/session.coordinator.js';

const logger = createContextualLogger({ module: 'ShutdownManager' });

class ShutdownManager {
  private isShuttingDown = false;
  private httpServer: Server | null = null;

  setHttpServer(server: Server) {
    this.httpServer = server;
  }

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    try {
      // Step 1: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Step 2: Wait for active sessions to complete (with timeout)
      await this.drainActiveSessions();

      // Step 3: Close database connections
      await this.closeDatabases();

      // Step 4: Cleanup resources
      await this.cleanup();

      logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error: any) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }

  private async stopAcceptingConnections(): Promise<void> {
    return new Promise((resolve) => {
      if (this.httpServer) {
        logger.info('Stopping HTTP server from accepting new connections');
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async drainActiveSessions(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let waited = 0;

    logger.info('Waiting for active sessions to complete...');

    while (waited < maxWaitTime) {
      const activeSessions = sessionCoordinator.getActiveSessionCount();
      
      if (activeSessions === 0) {
        logger.info('All sessions completed');
        return;
      }

      logger.info(`Waiting for ${activeSessions} active sessions...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    logger.warn(`Timeout waiting for sessions, forcing shutdown`);
  }

  private async closeDatabases(): Promise<void> {
    logger.info('Closing database connections...');

    // Close MongoDB
    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    } catch (error: any) {
      logger.error('Error disconnecting MongoDB', { error: error.message });
    }

    // Close Redis
    try {
      await redisClient.quit();
      logger.info('Redis disconnected');
    } catch (error: any) {
      logger.error('Error disconnecting Redis', { error: error.message });
    }
  }

  private async cleanup(): Promise<void> {
    logger.info('Cleaning up resources...');
    
    // Add any additional cleanup here
    // e.g., close file handles, stop background jobs, etc.
  }
}

export default new ShutdownManager();
```

### Task 4: Register Shutdown Handlers

**File:** `gnani-rnd-backend/src/app.ts`

```typescript
import shutdownManager from './core/shutdown/shutdown-manager.js';

// ... existing code ...

// Start Express server
const httpServer = startExpressServer();
shutdownManager.setHttpServer(httpServer);

// Register shutdown handlers
process.on('SIGTERM', () => shutdownManager.shutdown('SIGTERM'));
process.on('SIGINT', () => shutdownManager.shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  shutdownManager.shutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  shutdownManager.shutdown('UNHANDLED_REJECTION');
});
```

---

## Connection Draining

### Task 5: Session Tracking

**File:** `gnani-rnd-backend/src/modules/session/session.coordinator.ts`

```typescript
export class SessionCoordinator {
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  async drainAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    
    logger.info(`Draining ${sessionIds.length} active sessions`);

    for (const sessionId of sessionIds) {
      try {
        await this.endSession(sessionId);
      } catch (error: any) {
        logger.error(`Error ending session ${sessionId}`, { error: error.message });
      }
    }
  }
}
```

---

## Zero-Downtime Deployment

### Task 6: Deployment Script

**File:** `gnani-rnd-backend/scripts/deploy-zero-downtime.sh`

```bash
#!/bin/bash

echo "========================================="
echo "Zero-Downtime Deployment"
echo "========================================="

# Build new version
echo "Building new version..."
npm run build

# Start new instance on different port
echo "Starting new instance on port 3001..."
PORT=3001 npm start &
NEW_PID=$!

# Wait for new instance to be ready
echo "Waiting for new instance to be ready..."
for i in {1..30}; do
  if curl -f http://localhost:3001/api/ready > /dev/null 2>&1; then
    echo "New instance is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# Check if new instance is ready
if ! curl -f http://localhost:3001/api/ready > /dev/null 2>&1; then
  echo "ERROR: New instance failed to start"
  kill $NEW_PID
  exit 1
fi

# Update load balancer to point to new instance
echo "Updating load balancer..."
# (Add your load balancer update logic here)

# Send SIGTERM to old instance
echo "Gracefully shutting down old instance..."
OLD_PID=$(cat .pid)
kill -TERM $OLD_PID

# Wait for old instance to shutdown
wait $OLD_PID

# Save new PID
echo $NEW_PID > .pid

echo "========================================="
echo "Deployment complete!"
echo "========================================="
```

---

## Testing

### Task 7: Health Check Tests

**File:** `gnani-rnd-backend/tests/integration/health-checks.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Health Checks', () => {
  it('should return 200 for /health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should return 200 for /ready when all services are up', async () => {
    const response = await request(app).get('/api/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.checks.mongodb).toBe(true);
    expect(response.body.checks.redis).toBe(true);
  });

  it('should return 200 for /live', async () => {
    const response = await request(app).get('/api/live');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });
});

describe('Graceful Shutdown', () => {
  it('should drain active sessions before shutdown', async () => {
    // Start a session
    const sessionId = await sessionCoordinator.startSession('user123', jest.fn());
    
    // Trigger shutdown
    const shutdownPromise = shutdownManager.shutdown('TEST');
    
    // Session should complete
    await sessionCoordinator.endSession(sessionId);
    
    // Shutdown should complete
    await shutdownPromise;
  });
});
```

---

## Success Metrics

- ✅ Health endpoints respond correctly
- ✅ Readiness check validates all dependencies
- ✅ Graceful shutdown completes within 30 seconds
- ✅ Zero-downtime deployment tested
- ✅ All active sessions drained before shutdown

---

## Next Stage

**Stage 3.1: Whisper.cpp Integration** (Month 3)
