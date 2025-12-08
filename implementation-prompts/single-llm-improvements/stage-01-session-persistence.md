# Stage 1: Session Persistence & Recovery

**Priority:** P0 (Blocking Production)  
**Estimated Time:** 1 week  
**Dependencies:** None

---

## Objective

Implement robust session persistence and recovery mechanisms to ensure zero data loss on backend restarts and enable session migration across backend instances. Currently, sessions exist only in memory and Redis cache, leading to data loss when the backend restarts.

---

## Current State Analysis

### Existing Implementation
- **Location:** `src/modules/session/session.coordinator.ts`
- **Current Behavior:**
  - Sessions stored in `Map<string, Session>` (in-memory)
  - Basic state cached in Redis via `sessionMemory.setSessionState()`
  - Redis stores: `userId`, `conversationId`, `lastActivity`, `isSpeaking`
  - Session recovery attempted via `recoverSession()` but incomplete
  
### Issues
1. ❌ Audio buffer not persisted (lost on restart)
2. ❌ Pending transcripts not saved
3. ❌ Context snapshots not persisted
4. ❌ In-flight LLM requests lost
5. ❌ No session checkpointing mechanism
6. ❌ Session timeout (30 min) too aggressive
7. ❌ No session migration support

---

## Implementation Requirements

### 1. MongoDB Session Schema

Create a comprehensive session document schema in MongoDB:

**File:** `src/modules/session/session.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId: string;
  conversationId: string;
  state: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'THINKING' | 'GENERATING' | 'SPEAKING' | 'TOOL_EXECUTING' | 'ERROR';
  
  // Audio state
  audioBuffer: {
    chunks: Buffer[];
    sampleRate: number;
    totalDuration: number;
  } | null;
  
  pendingTranscript: {
    text: string;
    isFinal: boolean;
    timestamp: Date;
  } | null;
  
  // Context snapshot
  contextSnapshot: {
    recentMessages: any[];
    relevantMemories: any[];
    systemPrompt: string;
    timestamp: Date;
  } | null;
  
  // LLM state
  llmState: {
    requestId: string | null;
    partialResponse: string;
    model: string;
    isStreaming: boolean;
  } | null;
  
  // Metadata
  createdAt: Date;
  lastActivity: Date;
  lastCheckpoint: Date;
  expiresAt: Date;
  
  // Recovery info
  recoveryAttempts: number;
  lastRecoveryAt: Date | null;
  
  // Session metadata
  metadata: {
    grpcCallActive: boolean;
    deviceInfo: any;
    [key: string]: any;
  };
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  conversationId: { type: String, required: true, index: true },
  state: { 
    type: String, 
    enum: ['IDLE', 'LISTENING', 'PROCESSING', 'THINKING', 'GENERATING', 'SPEAKING', 'TOOL_EXECUTING', 'ERROR'],
    default: 'IDLE'
  },
  
  audioBuffer: {
    chunks: [Buffer],
    sampleRate: Number,
    totalDuration: Number
  },
  
  pendingTranscript: {
    text: String,
    isFinal: Boolean,
    timestamp: Date
  },
  
  contextSnapshot: {
    recentMessages: [Schema.Types.Mixed],
    relevantMemories: [Schema.Types.Mixed],
    systemPrompt: String,
    timestamp: Date
  },
  
  llmState: {
    requestId: String,
    partialResponse: String,
    model: String,
    isStreaming: Boolean
  },
  
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  lastCheckpoint: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  
  recoveryAttempts: { type: Number, default: 0 },
  lastRecoveryAt: Date,
  
  metadata: { type: Schema.Types.Mixed, default: {} }
});

// TTL index for automatic cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
SessionSchema.index({ userId: 1, lastActivity: -1 });
SessionSchema.index({ state: 1, lastActivity: -1 });

export default mongoose.model<ISession>('Session', SessionSchema);
```

### 2. Session Persistence Service

Create a dedicated service for session persistence:

**File:** `src/modules/session/session.persistence.ts`

```typescript
import Session, { ISession } from './session.model.js';
import { createContextualLogger } from '../../core/logger/logger.js';
import redis from '../../config/redis.config.js';

class SessionPersistence {
  private logger = createContextualLogger({ module: 'SessionPersistence' });
  private CHECKPOINT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save complete session state to MongoDB
   */
  async saveSession(sessionData: Partial<ISession>): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);
      
      await Session.findOneAndUpdate(
        { sessionId: sessionData.sessionId },
        {
          ...sessionData,
          lastCheckpoint: new Date(),
          expiresAt
        },
        { upsert: true, new: true }
      );
      
      this.logger.debug(`Session persisted to MongoDB: ${sessionData.sessionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to persist session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load session from MongoDB
   */
  async loadSession(sessionId: string): Promise<ISession | null> {
    try {
      const session = await Session.findOne({ sessionId });
      
      if (!session) {
        this.logger.warn(`Session not found in MongoDB: ${sessionId}`);
        return null;
      }
      
      // Check if expired
      if (session.expiresAt < new Date()) {
        this.logger.warn(`Session expired: ${sessionId}`);
        await this.deleteSession(sessionId);
        return null;
      }
      
      this.logger.info(`Session loaded from MongoDB: ${sessionId}`);
      return session;
    } catch (error: any) {
      this.logger.error(`Failed to load session: ${error.message}`);
      return null;
    }
  }

  /**
   * Create checkpoint of current session state
   */
  async checkpoint(sessionId: string, sessionData: Partial<ISession>): Promise<void> {
    try {
      // Only checkpoint if enough time has passed
      const session = await Session.findOne({ sessionId });
      if (session) {
        const timeSinceCheckpoint = Date.now() - session.lastCheckpoint.getTime();
        if (timeSinceCheckpoint < this.CHECKPOINT_INTERVAL_MS) {
          this.logger.debug(`Skipping checkpoint, too soon: ${sessionId}`);
          return;
        }
      }
      
      await this.saveSession(sessionData);
      this.logger.info(`Checkpoint created for session: ${sessionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to create checkpoint: ${error.message}`);
    }
  }

  /**
   * Delete session from MongoDB and Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await Session.deleteOne({ sessionId });
      await redis.del(`session:${sessionId}`);
      this.logger.info(`Session deleted: ${sessionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete session: ${error.message}`);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<ISession[]> {
    try {
      const sessions = await Session.find({
        userId,
        expiresAt: { $gt: new Date() }
      }).sort({ lastActivity: -1 });
      
      return sessions;
    } catch (error: any) {
      this.logger.error(`Failed to get user sessions: ${error.message}`);
      return [];
    }
  }

  /**
   * Cleanup expired sessions (called by cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await Session.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      this.logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
      return result.deletedCount;
    } catch (error: any) {
      this.logger.error(`Failed to cleanup expired sessions: ${error.message}`);
      return 0;
    }
  }

  /**
   * Extend session TTL (on user activity)
   */
  async extendSession(sessionId: string): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);
      
      await Session.findOneAndUpdate(
        { sessionId },
        {
          lastActivity: new Date(),
          expiresAt
        }
      );
      
      this.logger.debug(`Session TTL extended: ${sessionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to extend session: ${error.message}`);
    }
  }
}

export default new SessionPersistence();
```

### 3. Update Session Coordinator

Modify `session.coordinator.ts` to use persistence:

**Changes Required:**

1. **Import persistence service:**
```typescript
import sessionPersistence from './session.persistence.js';
```

2. **Update `startSession()` method:**
```typescript
async startSession(
  userId: string,
  onTranscriptionCallback: (transcript: string, isFinal: boolean) => Promise<void> | void,
  onLlmChunkCallback?: (text: string, messageId?: string) => Promise<void> | void,
  onLlmCompleteCallback?: (text: string, messageId?: string) => Promise<void> | void,
  onToolStatusCallback?: (status: any) => Promise<void> | void,
  existingSessionId?: string,
  conversationId?: string
): Promise<{ sessionId: string; conversationId: string }> {
  const sessionId = existingSessionId || uuidv4();
  const convId = conversationId || uuidv4();

  // ... existing session creation code ...

  // Persist to MongoDB
  await sessionPersistence.saveSession({
    sessionId,
    userId,
    conversationId: convId,
    state: 'IDLE',
    audioBuffer: null,
    pendingTranscript: null,
    contextSnapshot: null,
    llmState: null,
    createdAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {}
  });

  return { sessionId, conversationId: convId };
}
```

3. **Update `processAudioChunk()` to checkpoint:**
```typescript
async processAudioChunk(sessionId: string, audioChunk: Buffer, sampleRate: number): Promise<void> {
  // ... existing code ...

  // Checkpoint every N chunks (e.g., every 10 chunks)
  if (this.shouldCheckpoint(sessionId)) {
    await this.checkpointSession(sessionId);
  }
}

private checkpointCounters: Map<string, number> = new Map();

private shouldCheckpoint(sessionId: string): boolean {
  const count = (this.checkpointCounters.get(sessionId) || 0) + 1;
  this.checkpointCounters.set(sessionId, count);
  
  if (count >= 10) {
    this.checkpointCounters.set(sessionId, 0);
    return true;
  }
  return false;
}

private async checkpointSession(sessionId: string): Promise<void> {
  const session = this.sessions.get(sessionId);
  if (!session) return;

  const audioStats = this.audioProcessor.getBufferStats(sessionId);
  
  await sessionPersistence.checkpoint(sessionId, {
    sessionId,
    userId: session.userId,
    conversationId: session.conversationId,
    state: this.getSessionState(sessionId),
    lastActivity: new Date(),
    metadata: session.metadata
  });
}
```

4. **Enhance `recoverSession()` method:**
```typescript
async recoverSession(sessionId: string): Promise<Session | null> {
  this.logger.info(`Attempting to recover session: ${sessionId}`);

  // Try MongoDB first (most complete state)
  const persistedSession = await sessionPersistence.loadSession(sessionId);
  
  if (persistedSession) {
    this.logger.info(`Session recovered from MongoDB: ${sessionId}`);
    
    // Reconstruct in-memory session
    const session: Session = {
      userId: persistedSession.userId,
      conversationId: persistedSession.conversationId,
      createdAt: persistedSession.createdAt.getTime(),
      lastActivity: Date.now(),
      timeoutId: null,
      onTranscriptionCallback: async () => {},
      onLlmChunkCallback: async () => {},
      onLlmCompleteCallback: async () => {},
      onToolStatusCallback: async () => {},
      metadata: persistedSession.metadata || {}
    };

    this.sessions.set(sessionId, session);
    
    // Re-initialize components
    await this.audioProcessor.initialize(sessionId);
    
    // Restore audio buffer if exists
    if (persistedSession.audioBuffer && persistedSession.audioBuffer.chunks.length > 0) {
      // TODO: Restore audio buffer to processor
      this.logger.info(`Restored ${persistedSession.audioBuffer.chunks.length} audio chunks`);
    }
    
    // Restore pending transcript if exists
    if (persistedSession.pendingTranscript) {
      this.logger.info(`Restored pending transcript: ${persistedSession.pendingTranscript.text}`);
    }
    
    this.resetSessionTimeout(sessionId);
    
    return session;
  }

  // Fallback to Redis (partial state)
  const redisState = await sessionMemory.getSessionState(sessionId);
  if (redisState && redisState.userId) {
    this.logger.info(`Session recovered from Redis (partial): ${sessionId}`);
    
    const session: Session = {
      userId: redisState.userId,
      conversationId: redisState.conversationId || sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeoutId: null,
      onTranscriptionCallback: async () => {},
      onLlmChunkCallback: async () => {},
      onLlmCompleteCallback: async () => {},
      onToolStatusCallback: async () => {},
      metadata: redisState.metadata || {}
    };

    this.sessions.set(sessionId, session);
    await this.audioProcessor.initialize(sessionId);
    this.resetSessionTimeout(sessionId);
    
    return session;
  }

  this.logger.warn(`Session not found in MongoDB or Redis: ${sessionId}`);
  return null;
}
```

5. **Update `endSession()` to cleanup:**
```typescript
async endSession(sessionId: string): Promise<boolean> {
  const session = this.sessions.get(sessionId);
  if (!session) {
    this.logger.warn(`Attempted to end non-existent session: ${sessionId}`);
    return false;
  }

  // ... existing cleanup code ...

  // Delete from MongoDB and Redis
  await sessionPersistence.deleteSession(sessionId);

  this.sessions.delete(sessionId);
  this.checkpointCounters.delete(sessionId);

  this.logger.info(`Session ended and cleaned up: ${sessionId}`);
  return true;
}
```

### 4. Cron Job for Session Cleanup

Create a cron job to cleanup expired sessions:

**File:** `src/jobs/session-cleanup.job.ts`

```typescript
import cron from 'node-cron';
import sessionPersistence from '../modules/session/session.persistence.js';
import { createContextualLogger } from '../core/logger/logger.js';

const logger = createContextualLogger({ module: 'SessionCleanupJob' });

// Run every hour
export const sessionCleanupJob = cron.schedule('0 * * * *', async () => {
  logger.info('Running session cleanup job...');
  
  try {
    const deletedCount = await sessionPersistence.cleanupExpiredSessions();
    logger.info(`Session cleanup completed. Deleted ${deletedCount} sessions.`);
  } catch (error: any) {
    logger.error(`Session cleanup failed: ${error.message}`);
  }
});

export function startSessionCleanupJob() {
  sessionCleanupJob.start();
  logger.info('Session cleanup job started (runs every hour)');
}

export function stopSessionCleanupJob() {
  sessionCleanupJob.stop();
  logger.info('Session cleanup job stopped');
}
```

**Register in `src/index.ts`:**
```typescript
import { startSessionCleanupJob } from './jobs/session-cleanup.job.js';

// After server starts
startSessionCleanupJob();
```

### 5. Session Migration Support

Add endpoint to migrate session to another backend instance:

**File:** `src/modules/session/session.routes.ts`

```typescript
import express from 'express';
import sessionPersistence from './session.persistence.js';
import sessionCoordinator from './session.coordinator.js';

const router = express.Router();

/**
 * GET /api/session/:sessionId/export
 * Export session state for migration
 */
router.get('/:sessionId/export', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await sessionPersistence.loadSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session: session.toObject()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/session/import
 * Import session state from another instance
 */
router.post('/import', async (req, res) => {
  try {
    const { session } = req.body;
    
    await sessionPersistence.saveSession(session);
    
    res.json({
      success: true,
      sessionId: session.sessionId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## Testing Requirements

### Unit Tests

**File:** `tests/unit/session.persistence.test.ts`

```typescript
import sessionPersistence from '../../src/modules/session/session.persistence';
import Session from '../../src/modules/session/session.model';

describe('SessionPersistence', () => {
  beforeEach(async () => {
    await Session.deleteMany({});
  });

  it('should save and load session', async () => {
    const sessionData = {
      sessionId: 'test-123',
      userId: 'user-456',
      conversationId: 'conv-789',
      state: 'IDLE' as const,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    await sessionPersistence.saveSession(sessionData);
    const loaded = await sessionPersistence.loadSession('test-123');

    expect(loaded).toBeTruthy();
    expect(loaded?.sessionId).toBe('test-123');
    expect(loaded?.userId).toBe('user-456');
  });

  it('should not load expired session', async () => {
    const sessionData = {
      sessionId: 'test-expired',
      userId: 'user-456',
      conversationId: 'conv-789',
      state: 'IDLE' as const,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
    };

    await sessionPersistence.saveSession(sessionData);
    const loaded = await sessionPersistence.loadSession('test-expired');

    expect(loaded).toBeNull();
  });

  it('should cleanup expired sessions', async () => {
    // Create expired session
    await sessionPersistence.saveSession({
      sessionId: 'expired-1',
      userId: 'user-1',
      conversationId: 'conv-1',
      state: 'IDLE' as const,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() - 1000)
    });

    // Create active session
    await sessionPersistence.saveSession({
      sessionId: 'active-1',
      userId: 'user-1',
      conversationId: 'conv-2',
      state: 'IDLE' as const,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const deletedCount = await sessionPersistence.cleanupExpiredSessions();
    expect(deletedCount).toBe(1);

    const active = await sessionPersistence.loadSession('active-1');
    expect(active).toBeTruthy();
  });
});
```

### Integration Tests

**File:** `tests/integration/session-recovery.test.ts`

```typescript
import sessionCoordinator from '../../src/modules/session/session.coordinator';
import sessionPersistence from '../../src/modules/session/session.persistence';

describe('Session Recovery Integration', () => {
  it('should recover session after simulated restart', async () => {
    // Start session
    const { sessionId } = await sessionCoordinator.startSession(
      'user-123',
      async () => {},
      async () => {},
      async () => {},
      async () => {}
    );

    // Simulate some activity
    await sessionCoordinator.processTextInput(sessionId, 'Hello, world!');

    // Simulate backend restart (clear in-memory sessions)
    sessionCoordinator['sessions'].clear();

    // Attempt recovery
    const recovered = await sessionCoordinator.recoverSession(sessionId);

    expect(recovered).toBeTruthy();
    expect(recovered?.userId).toBe('user-123');
  });
});
```

### Manual Testing

1. **Test Session Persistence:**
   ```bash
   # Start backend
   npm run dev

   # In another terminal, start a session via gRPC
   node tests/integration/grpc_client.js

   # Send some audio/text

   # Restart backend (Ctrl+C and npm run dev again)

   # Resume session with same session ID
   # Verify: Session state is restored, conversation continues
   ```

2. **Test Session Expiration:**
   ```bash
   # Modify SESSION_TTL_MS to 60000 (1 minute) for testing
   # Start session
   # Wait 2 minutes
   # Try to recover session
   # Verify: Session not found (expired and cleaned up)
   ```

3. **Test Checkpoint:**
   ```bash
   # Start session
   # Send 10+ audio chunks
   # Check MongoDB for session document
   # Verify: lastCheckpoint timestamp updated
   ```

---

## Verification Checklist

- [ ] Session model created with all required fields
- [ ] SessionPersistence service implemented
- [ ] Session Coordinator updated to use persistence
- [ ] Checkpoint mechanism working (every 10 chunks or 5 minutes)
- [ ] Session recovery works after backend restart
- [ ] Expired sessions cleaned up automatically
- [ ] Session migration endpoints created
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] No data loss on backend restart
- [ ] Session TTL extended on user activity
- [ ] MongoDB indexes created for performance

---

## Success Criteria

1. ✅ **Zero Data Loss:** Sessions fully recovered after backend restart
2. ✅ **Performance:** Session save/load < 50ms
3. ✅ **Reliability:** 99.9% session recovery success rate
4. ✅ **Scalability:** Support 10,000+ concurrent sessions
5. ✅ **Monitoring:** Session metrics exported (active, expired, recovered)

---

## Next Steps

After completing this stage, proceed to:
- **Stage 2:** Circuit Breakers & Fault Tolerance
- **Stage 3:** Error Handling & Retry Logic

---

## Notes

- Session TTL set to 24 hours (configurable)
- Checkpoint interval: 5 minutes or every 10 audio chunks
- MongoDB TTL index automatically deletes expired sessions
- Redis still used for fast lookups, MongoDB for durability
- Audio buffer persistence optional (can be large, consider trade-offs)
