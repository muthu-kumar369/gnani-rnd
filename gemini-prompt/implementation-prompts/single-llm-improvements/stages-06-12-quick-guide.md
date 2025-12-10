# Stages 6-12: Quick Implementation Guides

This file contains concise implementation guides for the remaining stages. Each stage follows the same structure as stages 1-5 but in a more compact format.

---

## Stage 6: Metrics & Dashboards

**Priority:** P0 | **Time:** 1 week

### Objective
Set up Prometheus metrics and Grafana dashboards for comprehensive system monitoring.

### Key Metrics to Implement

```typescript
// src/core/monitoring/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code']
});

// LLM metrics
export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'LLM request duration',
  labelNames: ['model', 'operation']
});

export const llmTokensUsed = new Counter({
  name: 'llm_tokens_total',
  help: 'Total LLM tokens used',
  labelNames: ['model', 'type'] // type: prompt, completion
});

export const llmCacheHitRate = new Counter({
  name: 'llm_cache_hits_total',
  help: 'LLM cache hits',
  labelNames: ['hit'] // hit: true, false
});

// Audio metrics
export const audioProcessingDuration = new Histogram({
  name: 'audio_processing_duration_seconds',
  help: 'Audio processing duration',
  labelNames: ['operation'] // operation: vad, stt, preprocessing
});

// Session metrics
export const activeSessions = new Gauge({
  name: 'active_sessions',
  help: 'Number of active sessions'
});

// Error metrics
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total errors',
  labelNames: ['code', 'category', 'severity']
});
```

### Grafana Dashboards

Create 4 dashboards:
1. **System Health:** CPU, memory, disk, network
2. **API Performance:** Request rate, latency, errors
3. **LLM Performance:** Token usage, cache hits, latency
4. **User Experience:** Session duration, message count, error rate

### Verification
- [ ] Prometheus scraping metrics endpoint
- [ ] All key metrics exported
- [ ] Grafana dashboards created
- [ ] Alerts configured for critical metrics

---

## Stage 7: Database Optimization

**Priority:** P1 | **Time:** 1 week

### Objective
Optimize database performance through indexing, connection pooling, and query optimization.

### Implementation

**1. Add Indexes**

```typescript
// In conversation.model.ts
ConversationSchema.index({ userId: 1, updatedAt: -1 });
ConversationSchema.index({ conversationId: 1 }, { unique: true });

// In conversation-message.model.ts
ConversationMessageSchema.index({ conversationId: 1, timestamp: -1 });
ConversationMessageSchema.index({ userId: 1, timestamp: -1 });
ConversationMessageSchema.index({ generationId: 1 });
ConversationMessageSchema.index({ parentId: 1 });
```

**2. Connection Pooling**

```typescript
// src/config/database.config.ts
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000
});
```

**3. Query Optimization**

```typescript
// Use lean() for read-only queries
const conversations = await Conversation.find({ userId }).lean();

// Use select() to limit fields
const messages = await ConversationMessage.find({ conversationId })
  .select('role content timestamp')
  .lean();

// Use aggregation for complex queries
const stats = await ConversationMessage.aggregate([
  { $match: { userId } },
  { $group: { _id: '$conversationId', count: { $sum: 1 } } }
]);
```

### Verification
- [ ] All indexes created
- [ ] Connection pool configured
- [ ] Slow queries identified and optimized
- [ ] Query performance improved by >50%

---

## Stage 8: Caching & Performance

**Priority:** P1 | **Time:** 1 week

### Objective
Implement multi-layer caching strategy to reduce latency and database load.

### Caching Layers

**1. Application Cache (Redis)**

```typescript
// src/core/cache/cache.service.ts
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

**2. Cache Strategy**

- **LLM Responses:** 1 hour TTL
- **Vector Search Results:** 5 minutes TTL
- **User Preferences:** 1 day TTL
- **Conversation Metadata:** 30 minutes TTL

**3. Cache Invalidation**

```typescript
// On message update
await cacheService.invalidate(`conversation:${conversationId}:*`);

// On user preference update
await cacheService.invalidate(`user:${userId}:preferences`);
```

### Verification
- [ ] Multi-layer caching implemented
- [ ] Cache hit rate >60%
- [ ] Cache invalidation working correctly
- [ ] Latency reduced by >30%

---

## Stage 9: Security & Rate Limiting

**Priority:** P0 | **Time:** 1 week

### Objective
Implement production-grade security measures including rate limiting, input validation, and audit logging.

### Implementation

**1. Rate Limiting**

```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  store: new RedisStore({ client: redis }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
  }
});

export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 LLM requests per minute
  store: new RedisStore({ client: redis })
});
```

**2. Input Validation**

```typescript
// src/middleware/validation.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateTextInput = [
  body('text').isString().trim().isLength({ min: 1, max: 5000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

**3. Audit Logging**

```typescript
// src/core/logger/audit.service.ts
class AuditService {
  logEvent(
    eventType: string,
    userId: string | null,
    sessionId: string | null,
    data: any,
    result: 'success' | 'failure' | 'warning'
  ): void {
    logger.info('AUDIT_EVENT', {
      eventType,
      userId,
      sessionId,
      data,
      result,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Verification
- [ ] Rate limiting enforced on all endpoints
- [ ] Input validation on all user inputs
- [ ] Audit logging for sensitive operations
- [ ] Security headers configured (Helmet.js)

---

## Stage 10: Audio Pipeline Enhancement

**Priority:** P1 | **Time:** 1 week

### Objective
Enhance audio quality and reliability with preprocessing, adaptive VAD, and quality monitoring.

### Implementation

**1. Audio Preprocessing**

```javascript
// electron/mic/audioPreprocessor.js
const { AudioWorkletNode } = require('audio-worklet');

class AudioPreprocessor {
  constructor() {
    this.aecEnabled = true;
    this.nsEnabled = true;
    this.agcEnabled = true;
  }

  async process(audioBuffer) {
    let processed = audioBuffer;

    if (this.aecEnabled) {
      processed = await this.applyAEC(processed);
    }

    if (this.nsEnabled) {
      processed = await this.applyNoiseSuppression(processed);
    }

    if (this.agcEnabled) {
      processed = await this.applyGainControl(processed);
    }

    return processed;
  }

  async applyAEC(buffer) {
    // Use WebRTC AEC implementation
    // Or RNNoise for noise suppression
    return buffer;
  }

  async applyNoiseSuppression(buffer) {
    // Apply noise gate and spectral subtraction
    return buffer;
  }

  async applyGainControl(buffer) {
    // Normalize audio levels
    return buffer;
  }
}
```

**2. Adaptive VAD**

```javascript
// electron/vad/vadManager.js
class VadManager {
  constructor() {
    this.sensitivity = 0.5; // Default
    this.adaptiveMode = true;
  }

  adjustSensitivity(snr) {
    if (!this.adaptiveMode) return;

    // Adjust based on signal-to-noise ratio
    if (snr > 20) {
      this.sensitivity = 0.7; // High quality, more sensitive
    } else if (snr > 10) {
      this.sensitivity = 0.5; // Medium quality
    } else {
      this.sensitivity = 0.3; // Low quality, less sensitive
    }
  }
}
```

**3. Quality Monitoring**

```javascript
// Monitor SNR, clipping, and audio levels
class AudioQualityMonitor {
  calculateSNR(audioBuffer) {
    // Calculate signal-to-noise ratio
    return snr;
  }

  detectClipping(audioBuffer) {
    // Detect if audio is clipping
    return isClipping;
  }

  measureLevel(audioBuffer) {
    // Measure RMS level
    return rmsLevel;
  }
}
```

### Verification
- [ ] Audio preprocessing working (AEC/NS/AGC)
- [ ] Adaptive VAD adjusting to environment
- [ ] Quality metrics tracked
- [ ] Barge-in latency <100ms

---

## Stage 11: State Machine Implementation

**Priority:** P1 | **Time:** 1 week

### Objective
Implement deterministic state machine for assistant behavior to eliminate race conditions and improve reliability.

### States

```typescript
// src/core/state-machine/assistant-states.ts
export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  THINKING = 'THINKING',
  GENERATING = 'GENERATING',
  SPEAKING = 'SPEAKING',
  TOOL_EXECUTING = 'TOOL_EXECUTING',
  ERROR = 'ERROR'
}

export enum AssistantEvent {
  ACTIVATE = 'ACTIVATE',
  SPEECH_START = 'SPEECH_START',
  SPEECH_END = 'SPEECH_END',
  TRANSCRIPT_READY = 'TRANSCRIPT_READY',
  CONTEXT_READY = 'CONTEXT_READY',
  LLM_START = 'LLM_START',
  LLM_COMPLETE = 'LLM_COMPLETE',
  TTS_START = 'TTS_START',
  TTS_COMPLETE = 'TTS_COMPLETE',
  TOOL_START = 'TOOL_START',
  TOOL_COMPLETE = 'TOOL_COMPLETE',
  ERROR = 'ERROR',
  CANCEL = 'CANCEL',
  RESET = 'RESET'
}
```

### State Machine

```typescript
// src/core/state-machine/assistant.machine.ts
class AssistantStateMachine {
  private state: AssistantState = AssistantState.IDLE;
  private transitions: Map<string, AssistantState>;

  constructor() {
    this.defineTransitions();
  }

  private defineTransitions() {
    this.transitions = new Map([
      ['IDLE:ACTIVATE', AssistantState.LISTENING],
      ['LISTENING:SPEECH_END', AssistantState.PROCESSING],
      ['PROCESSING:TRANSCRIPT_READY', AssistantState.THINKING],
      ['THINKING:CONTEXT_READY', AssistantState.GENERATING],
      ['GENERATING:LLM_COMPLETE', AssistantState.SPEAKING],
      ['GENERATING:TOOL_START', AssistantState.TOOL_EXECUTING],
      ['TOOL_EXECUTING:TOOL_COMPLETE', AssistantState.GENERATING],
      ['SPEAKING:TTS_COMPLETE', AssistantState.IDLE],
      // Cancel transitions
      ['LISTENING:CANCEL', AssistantState.IDLE],
      ['GENERATING:CANCEL', AssistantState.IDLE],
      // Error transitions
      ['*:ERROR', AssistantState.ERROR],
      ['ERROR:RESET', AssistantState.IDLE]
    ]);
  }

  transition(event: AssistantEvent): boolean {
    const key = `${this.state}:${event}`;
    const wildcardKey = `*:${event}`;
    
    const nextState = this.transitions.get(key) || this.transitions.get(wildcardKey);
    
    if (nextState) {
      this.onExit(this.state);
      this.state = nextState;
      this.onEnter(nextState);
      return true;
    }

    logger.warn(`Invalid transition: ${this.state} -> ${event}`);
    return false;
  }

  private onEnter(state: AssistantState) {
    logger.info(`Entering state: ${state}`);
    // Emit state change event
    this.emit('stateChange', state);
  }

  private onExit(state: AssistantState) {
    logger.info(`Exiting state: ${state}`);
  }

  getState(): AssistantState {
    return this.state;
  }
}
```

### Verification
- [ ] State machine implemented
- [ ] All transitions defined
- [ ] Invalid transitions prevented
- [ ] State changes logged
- [ ] Frontend synced with state

---

## Stage 12: Testing & Documentation

**Priority:** P1 | **Time:** 1 week

### Objective
Achieve 80%+ test coverage and complete documentation for production deployment.

### Testing Strategy

**1. Unit Tests**

```typescript
// tests/unit/session.test.ts
describe('SessionCoordinator', () => {
  it('should start session', async () => {
    const { sessionId } = await coordinator.startSession('user-123', ...);
    expect(sessionId).toBeDefined();
  });

  it('should recover session', async () => {
    const session = await coordinator.recoverSession('session-123');
    expect(session).toBeTruthy();
  });
});
```

**2. Integration Tests**

```typescript
// tests/integration/audio-flow.test.ts
describe('Audio Flow Integration', () => {
  it('should process audio end-to-end', async () => {
    const audioBuffer = fs.readFileSync('test-audio.wav');
    const result = await processAudio(audioBuffer);
    expect(result.transcript).toBeDefined();
    expect(result.response).toBeDefined();
  });
});
```

**3. Load Tests**

```bash
# Use k6 for load testing
k6 run --vus 100 --duration 30s load-test.js
```

### Documentation

**1. API Documentation**

Generate OpenAPI/Swagger docs:

```typescript
// src/docs/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gnani API',
      version: '1.0.0'
    }
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
```

**2. Deployment Guide**

Create `DEPLOYMENT.md`:
- Docker setup
- Kubernetes manifests
- Environment variables
- Database migrations
- Monitoring setup

**3. Runbook**

Create `RUNBOOK.md`:
- Common issues and solutions
- How to restart services
- How to check logs
- How to reset circuit breakers
- Emergency procedures

### Verification
- [ ] 80%+ unit test coverage
- [ ] Integration tests passing
- [ ] Load tests completed (1000+ concurrent users)
- [ ] API documentation generated
- [ ] Deployment guide complete
- [ ] Runbook created

---

## Success Criteria (All Stages)

After completing all 12 stages:

✅ **Stability**
- 99.9% uptime over 30 days
- Zero data loss on restart
- All errors recoverable

✅ **Performance**
- <200ms p95 latency (text)
- <500ms p95 latency (audio)
- <100ms TTFT
- 1000+ concurrent users

✅ **Reliability**
- Circuit breakers on all deps
- Retry logic with backoff
- Graceful degradation

✅ **Monitoring**
- Prometheus metrics
- Grafana dashboards
- Distributed tracing
- Alerting configured

✅ **Security**
- Rate limiting enforced
- Input validation
- Audit logging
- Secrets in vault

✅ **Testing**
- 80%+ coverage
- Integration tests
- Load tests
- Chaos tests

✅ **Documentation**
- API docs
- Deployment guide
- Runbook
- Architecture diagrams
