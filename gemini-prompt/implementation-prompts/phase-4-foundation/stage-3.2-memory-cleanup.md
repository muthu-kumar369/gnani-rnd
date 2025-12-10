# Stage 3.2: Memory Management & Cleanup

**Duration:** 2 weeks  
**Goal:** Implement TTL policies and cleanup jobs to prevent unbounded memory growth

---

## Context

Currently, Redis and ChromaDB grow unbounded, leading to memory leaks and slow queries. We need automated cleanup.

---

## Objectives

1. Add TTL policies to Redis
2. Implement ChromaDB cleanup job
3. Add MongoDB index cleanup
4. Create monitoring dashboard
5. Set up automated cleanup cron jobs

---

## Implementation Tasks

### Task 1: Redis TTL Policies

**File:** `gnani-rnd-backend/src/modules/session/session.manager.ts`

Add TTL to all Redis keys:

```typescript
class SessionManager {
  async createSession(userId: string): Promise<Session> {
    const session = { sessionId: uuidv4(), userId, createdAt: Date.now() };
    
    // 1 hour TTL for sessions
    await redis.setex(
      `session:${session.sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    return session;
  }
  
  async storeMemory(sessionId: string, memory: any) {
    // 24 hours TTL for short-term memory
    await redis.setex(
      `memory:${sessionId}`,
      86400,
      JSON.stringify(memory)
    );
  }
}
```

---

### Task 2: ChromaDB Cleanup Job

**File:** `gnani-rnd-backend/src/jobs/cleanup.job.ts`

```typescript
import cron from 'node-cron';
import { chromaClient } from '../database/chroma.js';
import logger from '../utils/logger.js';

export class CleanupJob {
  start() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting cleanup job');
      
      try {
        // Delete embeddings older than 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const collection = await chromaClient.getCollection({ name: 'conversations' });
        
        await collection.delete({
          where: {
            timestamp: { $lt: thirtyDaysAgo }
          }
        });
        
        logger.info('Cleanup job completed');
      } catch (error) {
        logger.error('Cleanup job failed', error);
      }
    });
  }
}

export const cleanupJob = new CleanupJob();
```

---

### Task 3: MongoDB Index Cleanup

**File:** `gnani-rnd-backend/src/jobs/mongodb-cleanup.job.ts`

```typescript
import cron from 'node-cron';
import Conversation from '../modules/conversation/conversation.model.js';
import logger from '../utils/logger.js';

export class MongoDBCleanupJob {
  start() {
    // Run weekly on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      logger.info('Starting MongoDB cleanup');
      
      try {
        // Delete conversations older than 90 days
        const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
        
        const result = await Conversation.deleteMany({
          createdAt: { $lt: ninetyDaysAgo },
          archived: true
        });
        
        logger.info('MongoDB cleanup completed', { deleted: result.deletedCount });
      } catch (error) {
        logger.error('MongoDB cleanup failed', error);
      }
    });
  }
}

export const mongoDBCleanupJob = new MongoDBCleanupJob();
```

---

### Task 4: Memory Monitoring Dashboard

**File:** `gnani-rnd-backend/src/routes/monitoring.routes.ts`

```typescript
import express from 'express';
import redis from '../database/redis.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/memory', async (req, res) => {
  const memory = {
    redis: {
      used: 0,
      keys: 0,
      maxMemory: 0
    },
    mongodb: {
      collections: {},
      totalSize: 0
    },
    process: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      rss: process.memoryUsage().rss
    }
  };
  
  // Redis stats
  const redisInfo = await redis.info('memory');
  memory.redis.used = parseInt(redisInfo.match(/used_memory:(\d+)/)?.[1] || '0');
  memory.redis.maxMemory = parseInt(redisInfo.match(/maxmemory:(\d+)/)?.[1] || '0');
  
  const dbSize = await redis.dbsize();
  memory.redis.keys = dbSize;
  
  // MongoDB stats
  const db = mongoose.connection.db;
  const stats = await db.stats();
  memory.mongodb.totalSize = stats.dataSize;
  
  res.json(memory);
});

export default router;
```

---

### Task 5: Start Cleanup Jobs

**File:** `gnani-rnd-backend/src/index.ts`

```typescript
import { cleanupJob } from './jobs/cleanup.job.js';
import { mongoDBCleanupJob } from './jobs/mongodb-cleanup.job.js';

// Start cleanup jobs
cleanupJob.start();
mongoDBCleanupJob.start();

logger.info('Cleanup jobs started');
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-memory-cleanup.sh`

```bash
#!/bin/bash

echo "Setting up Memory Cleanup..."

# Install cron dependency
npm install node-cron

# Create jobs directory
mkdir -p src/jobs

# Run tests
npm test -- tests/unit/jobs

echo "✅ Memory cleanup setup complete!"
```

---

## Verification Steps

1. **Run setup:**
   ```bash
   ./scripts/setup-memory-cleanup.sh
   ```

2. **Check memory usage:**
   ```bash
   curl http://localhost:3000/api/monitoring/memory
   ```

3. **Test cleanup manually:**
   ```bash
   # Trigger cleanup job
   node -e "require('./dist/jobs/cleanup.job.js').cleanupJob.run()"
   ```

---

## Success Criteria

- [ ] Redis TTL policies implemented
- [ ] ChromaDB cleanup job running
- [ ] MongoDB cleanup job running
- [ ] Memory monitoring dashboard
- [ ] Cron jobs scheduled
- [ ] Memory usage stable over 24 hours

---

## Phase 4 Complete! 🎉

All foundation improvements implemented. Proceed to Phase 5 for multi-agent architecture.
