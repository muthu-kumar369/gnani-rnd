# Stage 2.2: Task Queue Implementation

**Duration:** 2 weeks  
**Goal:** Implement BullMQ task queue for async tool execution with progress tracking

---

## Context

Currently, long-running tools (web search, code analysis) block the gRPC stream, causing timeouts and poor UX. We need async task execution with real-time progress updates.

---

## Objectives

1. Set up BullMQ with Redis
2. Create task queue for tool execution
3. Implement progress tracking
4. Update gRPC to stream progress
5. Add queue monitoring dashboard

---

## Implementation Tasks

### Task 1: Install BullMQ

**File:** `gnani-rnd-backend/package.json`

```json
{
  "dependencies": {
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2"
  }
}
```

---

### Task 2: Create Task Queue

**File:** `gnani-rnd-backend/src/queues/tool.queue.ts`

```typescript
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { toolRegistry } from '../modules/tool/tool.registry.js';
import logger from '../utils/logger.js';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

export const toolQueue = new Queue('tools', { connection });

// Worker to process tool execution
export const toolWorker = new Worker(
  'tools',
  async (job: Job) => {
    const { toolName, params, sessionId } = job.data;
    
    logger.info('Executing tool', { toolName, sessionId, jobId: job.id });
    
    try {
      // Update progress: started
      await job.updateProgress(10);
      
      // Execute tool
      const tool = toolRegistry.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      
      // Update progress: executing
      await job.updateProgress(50);
      
      const result = await tool.execute(params);
      
      // Update progress: complete
      await job.updateProgress(100);
      
      logger.info('Tool execution complete', { toolName, sessionId, jobId: job.id });
      
      return result;
    } catch (error) {
      logger.error('Tool execution failed', error, { toolName, sessionId, jobId: job.id });
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

// Event listeners
toolWorker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

toolWorker.on('failed', (job, error) => {
  logger.error('Job failed', error, { jobId: job?.id });
});

toolWorker.on('progress', (job, progress) => {
  logger.debug('Job progress', { jobId: job.id, progress });
});
```

---

### Task 3: Update Tool Execution

**File:** `gnani-rnd-backend/src/modules/tool/tool.executor.ts`

```typescript
import { toolQueue } from '../../queues/tool.queue.js';
import { EventEmitter } from 'events';

export class ToolExecutor extends EventEmitter {
  async executeTool(toolName: string, params: any, sessionId: string) {
    // Add job to queue
    const job = await toolQueue.add('execute', {
      toolName,
      params,
      sessionId,
      timestamp: Date.now()
    });
    
    // Listen for progress updates
    job.on('progress', (progress: number) => {
      this.emit('progress', {
        jobId: job.id,
        toolName,
        progress
      });
    });
    
    // Wait for completion
    const result = await job.finished();
    
    return result;
  }
  
  async getJobStatus(jobId: string) {
    const job = await toolQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    const progress = job.progress;
    
    return { state, progress };
  }
}

export const toolExecutor = new ToolExecutor();
```

---

### Task 4: Update gRPC Stream

**File:** `gnani-rnd-backend/src/grpc.ts`

Update to stream tool progress:

```typescript
import { toolExecutor } from './modules/tool/tool.executor.js';

// In audioStream handler
toolExecutor.on('progress', (data) => {
  call.write({
    tool_status: {
      tool_name: data.toolName,
      status: 'running',
      progress: data.progress
    }
  });
});

// Execute tool asynchronously
const toolResult = await toolExecutor.executeTool(toolName, params, sessionId);

call.write({
  tool_status: {
    tool_name: toolName,
    status: 'completed',
    progress: 100
  }
});
```

---

### Task 5: Add Queue Monitoring

**File:** `gnani-rnd-backend/src/routes/queue.routes.ts`

```typescript
import express from 'express';
import { toolQueue } from '../queues/tool.queue.js';

const router = express.Router();

// Get queue stats
router.get('/stats', async (req, res) => {
  const waiting = await toolQueue.getWaitingCount();
  const active = await toolQueue.getActiveCount();
  const completed = await toolQueue.getCompletedCount();
  const failed = await toolQueue.getFailedCount();
  
  res.json({ waiting, active, completed, failed });
});

// Get job details
router.get('/jobs/:jobId', async (req, res) => {
  const job = await toolQueue.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  res.json({ id: job.id, state, progress, data: job.data });
});

export default router;
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-task-queue.sh`

```bash
#!/bin/bash

echo "Setting up Task Queue (BullMQ)..."

# Install dependencies
npm install bullmq ioredis

# Check Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Redis is running"
else
  echo "❌ Redis is not running. Please start Redis first."
  exit 1
fi

# Create queue directories
mkdir -p src/queues

# Run tests
npm test -- tests/unit/queues

echo "✅ Task Queue setup complete!"
```

---

## Verification Steps

1. **Run setup:**
   ```bash
   ./scripts/setup-task-queue.sh
   ```

2. **Test queue:**
   ```bash
   # Start backend
   npm run dev
   
   # Check queue stats
   curl http://localhost:3000/api/queue/stats
   ```

3. **Test tool execution:**
   ```bash
   # Trigger a long-running tool (web search)
   # Verify progress updates in gRPC stream
   ```

---

## Success Criteria

- [ ] BullMQ installed and configured
- [ ] Tool queue created
- [ ] Worker processing jobs
- [ ] Progress tracking working
- [ ] gRPC streaming progress
- [ ] Queue monitoring API
- [ ] No blocking on long tools

---

## Next Stage

Proceed to [Stage 3.1 - Horizontal Scaling](./stage-3.1-horizontal-scaling.md)
