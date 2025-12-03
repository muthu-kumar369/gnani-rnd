# GNANI - Single-LLM Foundation Report
**Production-Grade Architecture & Implementation Plan**

**Date:** December 3, 2025  
**Version:** 1.0  
**Classification:** Internal - Technical Architecture Document

---

## Executive Summary

This document provides a comprehensive analysis and implementation plan for building a **rock-solid, production-grade single-LLM version** of GNANI that is fully future-proof for multi-agent evolution.

### Current State: 70/100 (Functional but needs hardening)

**Strengths:**
- ✅ Working gRPC streaming (327 lines)
- ✅ Deterministic state machine
- ✅ 4-layer memory system
- ✅ Plugin-based tools

**Critical Issues:**
- ❌ Audio pipeline instability
- ❌ Session handling gaps
- ❌ Tool execution reliability issues
- ❌ Missing error recovery
- ❌ No production monitoring

### Goal: 95/100 Production-Ready Single-LLM System

**Timeline:** 3 months to production-grade single-LLM foundation

---

## 1. Project Analysis

### 1.1 Frontend Architecture (Electron + React)

**Current Structure:**

```
electron/
├── main.js (535 lines)          # Main process
├── modules/
│   ├── grpc-client.js           # gRPC streaming client
│   ├── mic-capture.js           # Audio capture
│   ├── vad-manager.js           # Voice Activity Detection
│   ├── tts-player.js            # Text-to-Speech
│   └── os-awareness.js          # System monitoring
└── utils/

react/src/
├── components/gnani/
│   └── GnaniCore.tsx (613 lines) # Main UI component
├── store/
│   ├── useGnaniStore.ts         # State machine
│   ├── useConversationStore.ts  # Messages (314 lines)
│   └── useUserStore.ts          # Auth
└── hooks/
    └── useIPC.ts                # Electron IPC
```

**State Machine (GnaniCore):**

```
IDLE → LISTENING → PROCESSING → SPEAKING → IDLE
  ↑                                           │
  └───────────── (barge-in) ─────────────────┘
```

**Critical Issues Found:**

1. **Audio Pipeline Instability:**
   - VAD sometimes misses speech end
   - Audio buffer overflow on long recordings
   - No reconnection logic for gRPC stream failures

2. **State Machine Race Conditions:**
   - Barge-in can trigger during PROCESSING
   - TTS playback conflicts with new recording
   - No queue for overlapping user inputs

3. **Error Handling Gaps:**
   - gRPC disconnections crash the app
   - No retry logic for failed LLM requests
   - Missing error boundaries in React components

### 1.2 Backend Architecture (Node.js + gRPC)

**Current Structure:**

```
src/
├── grpc.ts (327 lines)          # gRPC server
├── modules/
│   ├── session/
│   │   └── session.manager.ts (480 lines)
│   ├── memory/
│   │   └── session-memory.service.ts (240 lines)
│   ├── llm/
│   │   ├── llm.manager.ts (108 lines)
│   │   └── ollama.provider.ts
│   ├── tools/
│   │   └── tool.registry.ts (158 lines)
│   └── asr/
│       └── whisper.service.ts (206 lines)
└── core/
    ├── logger/
    ├── monitoring/
    └── reliability/
```

**Data Flow:**

```
[Audio Stream] → [gRPC] → [Session Manager]
                              ↓
                         [Whisper STT]
                              ↓
                         [Transcript]
                              ↓
                    [Memory + Context Retrieval]
                              ↓
                         [LLM (Ollama)]
                              ↓
                    [Tool Execution (if needed)]
                              ↓
                    [Stream Response] → [gRPC] → [Frontend]
```

**Critical Issues Found:**

1. **Session Manager Complexity:**
   - 480 lines doing too much (audio, STT, LLM, tools)
   - Tight coupling between components
   - Hard to test and debug

2. **Whisper Integration:**
   - Python subprocess overhead (~100ms)
   - No request batching
   - Crashes on malformed audio

3. **Tool Execution:**
   - No timeout handling
   - Circuit breaker not tested
   - Results not cached

4. **Memory System:**
   - Redis caching works but no eviction strategy
   - Vector search slow (ChromaDB)
   - No conversation summarization

### 1.3 Audio Streaming Analysis

**Current Flow:**

```
[Microphone] → [VAD] → [PCM Buffer] → [gRPC Bidirectional Stream]
                ↓                              ↓
         [Speech Detection]              [Session Manager]
                                              ↓
                                         [Whisper STT]
                                              ↓
                                         [Transcript]
```

**Performance Metrics:**
- VAD Latency: ~50ms ✅
- Audio Buffer: 16KB chunks ✅
- gRPC Streaming: Works ✅
- STT Latency: ~500ms ⚠️ (can be improved)

**Issues:**

1. **VAD False Positives:**
   - Background noise triggers recording
   - No adaptive threshold

2. **Audio Buffer Management:**
   - No overflow protection
   - Memory leak on long sessions

3. **gRPC Stream Reliability:**
   - No automatic reconnection
   - Lost audio chunks on network hiccups

### 1.4 Tool Invocation Analysis

**Current System:**

```typescript
// Tool Registry (158 lines)
class ToolRegistry {
  private tools: Map<string, ITool>;
  private circuitBreaker: CircuitBreaker;
  
  async executeTool(name, params, onProgress) {
    // Circuit breaker wraps execution
    // Progress callbacks work
    // But: no timeout, no caching, no retry
  }
}
```

**Issues:**

1. **No Timeout:** Tools can hang indefinitely
2. **No Result Caching:** Same tool calls repeat
3. **Error Recovery:** Circuit breaker opens but doesn't retry
4. **Progress Tracking:** Works but not persisted

### 1.5 Memory & RAG Analysis

**4-Layer System:**

1. **Short-Term (Redis):** Last 10 messages, 1hr TTL ✅
2. **Working Memory (Redis):** Session state ✅
3. **Long-Term (MongoDB):** Full history ✅
4. **Vector (ChromaDB):** Semantic search ⚠️

**Issues:**

1. **Vector Search Slow:** ChromaDB takes 200-500ms
2. **No Summarization:** Long conversations not compressed
3. **Context Window:** No intelligent truncation for LLM

---

## 2. What Needs to Be Implemented

### 2.1 Audio Pipeline Fixes

**Priority: 🔴 Critical**

**Issues to Fix:**

1. **VAD Improvements:**
   ```typescript
   class ImprovedVAD {
     private adaptiveThreshold: number;
     private noiseProfile: Float32Array;
     
     // Add noise profiling
     calibrateNoise(samples: Float32Array): void;
     
     // Adaptive threshold based on environment
     detectSpeech(samples: Float32Array): boolean;
   }
   ```

2. **Audio Buffer Protection:**
   ```typescript
   class AudioBuffer {
     private maxSize = 10 * 1024 * 1024; // 10MB limit
     
     append(chunk: Buffer): void {
       if (this.size + chunk.length > this.maxSize) {
         this.flush(); // Auto-flush on overflow
       }
       this.buffer.push(chunk);
     }
   }
   ```

3. **gRPC Reconnection:**
   ```typescript
   class ResilientGRPCClient {
     private reconnectAttempts = 0;
     private maxReconnects = 5;
     
     async connect(): Promise<void> {
       try {
         await this.grpcClient.connect();
         this.reconnectAttempts = 0;
       } catch (error) {
         if (this.reconnectAttempts < this.maxReconnects) {
           await this.exponentialBackoff();
           await this.connect();
         }
       }
     }
   }
   ```

### 2.2 Session Manager Refactoring

**Priority: 🔴 Critical**

**Current Problem:** 480-line monolith

**Solution:** Split into focused services

```
session/
├── session.coordinator.ts      # Orchestrates flow
├── audio.processor.ts          # Audio handling
├── transcript.processor.ts     # STT integration
├── context.builder.ts          # Memory + RAG
├── llm.executor.ts             # LLM calls
└── tool.executor.ts            # Tool execution
```

**New Architecture:**

```typescript
class SessionCoordinator {
  constructor(
    private audioProcessor: AudioProcessor,
    private transcriptProcessor: TranscriptProcessor,
    private contextBuilder: ContextBuilder,
    private llmExecutor: LLMExecutor,
    private toolExecutor: ToolExecutor
  ) {}
  
  async processAudioChunk(sessionId: string, chunk: Buffer) {
    await this.audioProcessor.append(sessionId, chunk);
  }
  
  async processTranscript(sessionId: string, transcript: string) {
    const context = await this.contextBuilder.build(sessionId, transcript);
    const response = await this.llmExecutor.generate(context);
    return response;
  }
}
```

### 2.3 Tool Layer Stabilization

**Priority: 🟡 High**

**Improvements Needed:**

1. **Add Timeouts:**
   ```typescript
   async executeTool(name: string, params: any): Promise<any> {
     return Promise.race([
       this.tool.execute(params),
       this.timeout(30000) // 30s max
     ]);
   }
   ```

2. **Result Caching:**
   ```typescript
   class ToolCache {
     async get(toolName: string, params: any): Promise<any> {
       const key = this.hash(toolName, params);
       return await redis.get(`tool:${key}`);
     }
     
     async set(toolName: string, params: any, result: any): Promise<void> {
       const key = this.hash(toolName, params);
       await redis.setex(`tool:${key}`, 3600, JSON.stringify(result));
     }
   }
   ```

3. **Retry Logic:**
   ```typescript
   async executeWithRetry(tool: ITool, params: any, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await tool.execute(params);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await this.delay(Math.pow(2, i) * 1000);
       }
     }
   }
   ```

### 2.4 Error Handling & Recovery

**Priority: 🔴 Critical**

**Frontend Error Boundaries:**

```typescript
// Already exists but needs improvement
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Add: Send to error tracking service
    errorTracker.captureException(error, { errorInfo });
    
    // Add: Attempt recovery
    this.attemptRecovery(error);
  }
  
  attemptRecovery(error: Error) {
    if (error.message.includes('gRPC')) {
      // Reconnect gRPC
      window.electron.grpc.reconnect();
    }
  }
}
```

**Backend Error Handling:**

```typescript
class ErrorHandler {
  handle(error: Error, context: string): void {
    logger.error(error.message, { context, stack: error.stack });
    
    // Categorize error
    if (error instanceof LLMError) {
      this.handleLLMError(error);
    } else if (error instanceof ToolError) {
      this.handleToolError(error);
    }
    
    // Send to monitoring
    metrics.increment('errors', { type: error.constructor.name });
  }
}
```

### 2.5 Production Monitoring

**Priority: 🟡 High**

**Metrics to Track:**

```typescript
// Already have Prometheus, need to add:
class Metrics {
  // Audio pipeline
  trackAudioLatency(duration: number): void;
  trackVADAccuracy(truePositive: boolean): void;
  
  // LLM performance
  trackLLMLatency(duration: number): void;
  trackLLMTokens(count: number): void;
  
  // Tool execution
  trackToolSuccess(toolName: string): void;
  trackToolFailure(toolName: string, error: string): void;
  
  // Session health
  trackActiveSessions(count: number): void;
  trackSessionDuration(duration: number): void;
}
```

**Logging Improvements:**

```typescript
// Structured logging with correlation IDs
logger.info('Processing transcript', {
  sessionId,
  correlationId,  // Track entire request flow
  transcript: transcript.substring(0, 100),
  duration: Date.now() - startTime
});
```

---

## 3. Clean Architecture Plan

### 3.1 Backend Folder Structure

**Recommended Structure:**

```
gnani-rnd-backend/
├── src/
│   ├── api/                    # HTTP/gRPC endpoints
│   │   ├── grpc/
│   │   │   ├── server.ts
│   │   │   └── handlers/
│   │   └── http/
│   │       └── routes/
│   │
│   ├── domain/                 # Business logic (future-proof)
│   │   ├── session/
│   │   │   ├── session.coordinator.ts
│   │   │   ├── audio.processor.ts
│   │   │   ├── transcript.processor.ts
│   │   │   └── context.builder.ts
│   │   ├── llm/
│   │   │   ├── llm.interface.ts      # Abstract interface
│   │   │   ├── llm.executor.ts       # Single LLM logic
│   │   │   └── providers/
│   │   │       └── ollama.provider.ts
│   │   ├── tools/
│   │   │   ├── tool.interface.ts
│   │   │   ├── tool.executor.ts
│   │   │   ├── tool.cache.ts
│   │   │   └── plugins/
│   │   └── memory/
│   │       ├── memory.interface.ts
│   │       ├── short-term.service.ts
│   │       ├── long-term.service.ts
│   │       └── vector.service.ts
│   │
│   ├── infrastructure/         # External services
│   │   ├── database/
│   │   │   ├── mongodb.ts
│   │   │   └── redis.ts
│   │   ├── llm/
│   │   │   └── ollama-client.ts
│   │   ├── stt/
│   │   │   └── whisper-client.ts
│   │   └── vector/
│   │       └── chroma-client.ts
│   │
│   └── shared/                 # Common utilities
│       ├── logger/
│       ├── metrics/
│       ├── errors/
│       └── types/
```

### 3.2 Frontend Folder Structure

**Recommended Structure:**

```
react/src/
├── components/
│   ├── gnani/
│   │   ├── GnaniCore.tsx       # Main orchestrator
│   │   ├── AudioPipeline.tsx   # Audio handling
│   │   ├── StateMachine.tsx    # State logic
│   │   └── ResponseRenderer.tsx
│   ├── common/
│   └── terminal/
│
├── services/                   # Business logic
│   ├── audio/
│   │   ├── vad.service.ts
│   │   └── recorder.service.ts
│   ├── grpc/
│   │   └── streaming.service.ts
│   └── state/
│       └── state-machine.service.ts
│
├── store/                      # State management
│   ├── useGnaniStore.ts
│   ├── useConversationStore.ts
│   └── useUserStore.ts
│
└── hooks/                      # Reusable hooks
    ├── useIPC.ts
    ├── useAudio.ts
    └── useStateMachine.ts
```

### 3.3 Separation of Concerns

**Key Principles:**

1. **Domain Layer Independence:**
   - No direct database calls in domain logic
   - Use interfaces for external services
   - Business rules isolated from infrastructure

2. **Single Responsibility:**
   - Each service does ONE thing well
   - Session coordinator orchestrates, doesn't implement

3. **Dependency Injection:**
   ```typescript
   // Good: Testable, flexible
   class LLMExecutor {
     constructor(
       private provider: LLMProvider,
       private cache: CacheService,
       private metrics: MetricsService
     ) {}
   }
   
   // Bad: Hard-coded dependencies
   class LLMExecutor {
     private provider = new OllamaProvider();
     private cache = redis;
   }
   ```

### 3.4 Interface Definitions (Future-Proof)

**LLM Interface:**

```typescript
// This interface supports both single and multi-agent
interface LLMProvider {
  name: string;
  
  // Single LLM: Simple generation
  generate(prompt: string, options?: GenerateOptions): AsyncIterator<string>;
  
  // Future multi-agent: Agent-specific generation
  generateForAgent?(
    agentId: string,
    prompt: string,
    options?: GenerateOptions
  ): AsyncIterator<string>;
  
  isAvailable(): Promise<boolean>;
}
```

**Tool Interface:**

```typescript
// Supports both direct execution and agent delegation
interface ITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  
  // Current: Direct execution
  execute(params: any, onProgress?: ProgressCallback): Promise<any>;
  
  // Future: Agent can execute
  agentId?: string;  // Which agent handles this tool
}
```

**Memory Interface:**

```typescript
// Designed for multi-agent context sharing
interface MemoryService {
  // Current: Session-based
  getContext(sessionId: string): Promise<Context>;
  
  // Future: Agent-specific context
  getAgentContext?(sessionId: string, agentId: string): Promise<Context>;
  
  // Shared memory across agents
  getSharedMemory?(sessionId: string): Promise<SharedContext>;
}
```

---

## 4. Future-Proofing for Multi-Agent

### 4.1 Abstraction Patterns

**Message Bus Pattern:**

```typescript
// Single LLM: Direct call
class SingleLLMExecutor {
  async execute(prompt: string): Promise<string> {
    return await this.llm.generate(prompt);
  }
}

// Future Multi-Agent: Message-based
interface Message {
  id: string;
  from: string;      // 'user' or 'agent-id'
  to: string;        // 'orchestrator' or 'agent-id'
  type: 'TASK' | 'RESULT' | 'ERROR';
  payload: any;
}

class MessageBus {
  async send(message: Message): Promise<void>;
  async subscribe(agentId: string, handler: MessageHandler): void;
}
```

**Intent Pipeline:**

```typescript
// Current: Direct LLM call
async processIntent(transcript: string) {
  const response = await llm.generate(transcript);
  return response;
}

// Future-proof: Intent routing
interface Intent {
  type: 'CHAT' | 'CODE' | 'SEARCH' | 'SYSTEM';
  content: string;
  context: any;
}

class IntentRouter {
  // Single LLM: All intents go to one LLM
  async route(intent: Intent): Promise<string> {
    return await this.singleLLM.generate(intent.content);
  }
  
  // Future: Route to specialized agents
  async routeToAgent?(intent: Intent): Promise<string> {
    const agent = this.selectAgent(intent.type);
    return await agent.execute(intent);
  }
}
```

### 4.2 Modular Components

**Components That Must Be Modular:**

1. **LLM Execution Layer:**
   - Abstract interface ✅
   - Provider pattern ✅
   - Easy to swap implementations ✅

2. **Tool System:**
   - Plugin architecture ✅
   - Tools don't know who calls them ✅
   - Can be delegated to agents ✅

3. **Memory System:**
   - Layered architecture ✅
   - Can support agent-specific contexts ✅
   - Shared memory possible ✅

4. **Session Management:**
   - Needs refactoring ❌
   - Should support multi-agent workflows ❌

### 4.3 Messaging Pipeline Design

**Current (Single LLM):**

```
User Input → Session Manager → LLM → Response
```

**Future-Proof Design:**

```
User Input → Intent Parser → Message Bus → [Agent Router]
                                              ↓
                                         Single LLM (now)
                                         OR
                                         Agent Orchestrator (future)
                                              ↓
                                         Message Bus → Response
```

**Implementation:**

```typescript
// Start with simple pass-through
class MessageBus {
  async route(message: Message): Promise<Message> {
    // Single LLM mode
    if (this.mode === 'single') {
      const result = await this.singleLLM.execute(message.payload);
      return { ...message, type: 'RESULT', payload: result };
    }
    
    // Future: Multi-agent mode
    if (this.mode === 'multi-agent') {
      return await this.agentOrchestrator.route(message);
    }
  }
}
```

---

## 5. Performance & Scalability

### 5.1 Single LLM Optimization

**Caching Strategy:**

```typescript
class LLMCache {
  // Cache common queries
  private queryCache = new Map<string, string>();
  
  async get(prompt: string): Promise<string | null> {
    const hash = this.hash(prompt);
    return await redis.get(`llm:${hash}`);
  }
  
  async set(prompt: string, response: string, ttl = 3600): Promise<void> {
    const hash = this.hash(prompt);
    await redis.setex(`llm:${hash}`, ttl, response);
  }
}
```

**Request Batching:**

```typescript
class LLMBatcher {
  private queue: Request[] = [];
  private batchSize = 5;
  private flushInterval = 100; // ms
  
  async add(request: Request): Promise<string> {
    this.queue.push(request);
    
    if (this.queue.length >= this.batchSize) {
      return await this.flush();
    }
    
    // Auto-flush after interval
    setTimeout(() => this.flush(), this.flushInterval);
  }
  
  private async flush(): Promise<void> {
    const batch = this.queue.splice(0, this.batchSize);
    // Process batch together (if LLM supports it)
    await this.llm.generateBatch(batch);
  }
}
```

### 5.2 Audio Pipeline Optimization

**Whisper Optimization:**

```bash
# Replace Python Whisper with whisper.cpp
# 3x faster, lower memory

# Install
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# Use in Node.js via child_process
const whisper = spawn('./whisper.cpp/main', [
  '-m', 'models/ggml-base.en.bin',
  '-f', 'audio.wav'
]);
```

**Audio Compression:**

```typescript
// Use Opus codec instead of raw PCM
class AudioCompressor {
  compress(pcm: Buffer): Buffer {
    return opus.encode(pcm, {
      sampleRate: 16000,
      channels: 1,
      bitrate: 24000  // 50% smaller
    });
  }
}
```

### 5.3 Redis Usage Plan

**Current Usage:**
- Session state ✅
- Message cache ✅
- User data cache ✅

**Optimizations:**

1. **Connection Pooling:**
   ```typescript
   const redis = new Redis({
     host: 'localhost',
     port: 6379,
     maxRetriesPerRequest: 3,
     enableReadyCheck: true,
     lazyConnect: true
   });
   ```

2. **Pipeline Commands:**
   ```typescript
   const pipeline = redis.pipeline();
   pipeline.set('key1', 'value1');
   pipeline.set('key2', 'value2');
   pipeline.set('key3', 'value3');
   await pipeline.exec();  // 3x faster than individual calls
   ```

3. **Eviction Policy:**
   ```bash
   # redis.conf
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

### 5.4 Horizontal Scaling Potential

**Current:** Single server ❌

**Future-Proof Design:**

```
[Load Balancer]
      │
      ├─→ [API Server 1] ─┐
      ├─→ [API Server 2] ─┼─→ [Redis Cluster]
      └─→ [API Server 3] ─┘    [MongoDB Replica Set]
                               [Ollama GPU Server]
```

**Session Affinity:**

```typescript
// Use Redis for session state (already done ✅)
// Any server can handle any request
class SessionManager {
  async getSession(sessionId: string): Promise<Session> {
    // Load from Redis, not in-memory
    return await redis.get(`session:${sessionId}`);
  }
}
```

---

## 6. Production-Grade Requirements

### 6.1 Logging & Tracing

**Structured Logging:**

```typescript
// Already have Winston ✅
// Add correlation IDs

class Logger {
  info(message: string, meta: any) {
    winston.info(message, {
      ...meta,
      correlationId: this.getCorrelationId(),
      timestamp: new Date().toISOString()
    });
  }
}
```

**Distributed Tracing:**

```typescript
// Add OpenTelemetry
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('gnani-backend');

async function processRequest(sessionId: string) {
  const span = tracer.startSpan('process-request');
  
  try {
    await processAudio(sessionId);
    await generateResponse(sessionId);
  } finally {
    span.end();
  }
}
```

### 6.2 Graceful Restart & Reconnection

**Backend:**

```typescript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop accepting new requests
  server.close();
  
  // Wait for active requests to complete
  await waitForActiveRequests();
  
  // Close database connections
  await mongoose.disconnect();
  await redis.quit();
  
  process.exit(0);
});
```

**Frontend:**

```typescript
// Auto-reconnect gRPC on disconnect
class ResilientGRPCClient {
  private reconnectTimer: NodeJS.Timeout;
  
  onDisconnect() {
    logger.warn('gRPC disconnected, attempting reconnect');
    this.reconnectTimer = setInterval(() => {
      this.attemptReconnect();
    }, 5000);
  }
  
  async attemptReconnect() {
    try {
      await this.connect();
      clearInterval(this.reconnectTimer);
      logger.info('gRPC reconnected successfully');
    } catch (error) {
      logger.error('Reconnect failed', error);
    }
  }
}
```

### 6.3 Rate Limits & Protections

**Already Implemented:** ✅ express-rate-limit

**Add:**

```typescript
// Per-user rate limiting
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,  // 60 requests per minute
  keyGenerator: (req) => req.user.id
});

// LLM request limiting
const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,  // 20 LLM calls per minute per user
  keyGenerator: (req) => req.user.id
});
```

### 6.4 Unit Testing Plan

**Target Coverage: 80%**

**Priority Tests:**

1. **Session Manager:**
   ```typescript
   describe('SessionCoordinator', () => {
     it('should process audio chunks correctly');
     it('should handle STT failures gracefully');
     it('should timeout long-running LLM requests');
   });
   ```

2. **Tool Execution:**
   ```typescript
   describe('ToolExecutor', () => {
     it('should cache tool results');
     it('should retry on failure');
     it('should timeout after 30s');
   });
   ```

3. **Memory System:**
   ```typescript
   describe('MemoryService', () => {
     it('should retrieve recent messages');
     it('should perform vector search');
     it('should handle cache misses');
   });
   ```

---

## 7. Implementation Roadmap

### Month 1: Foundation Hardening

**Week 1-2: Audio Pipeline Fixes**
- [ ] Implement adaptive VAD
- [ ] Add audio buffer overflow protection
- [ ] Add gRPC reconnection logic
- [ ] Test with 1-hour continuous recording

**Week 3-4: Session Manager Refactoring**
- [ ] Split into 6 focused services
- [ ] Add dependency injection
- [ ] Write unit tests (target: 80% coverage)
- [ ] Integration tests for full flow

**Deliverables:**
- ✅ Stable audio pipeline (no crashes)
- ✅ Modular session management
- ✅ 80% test coverage

### Month 2: Production Features

**Week 1-2: Error Handling & Recovery**
- [ ] Frontend error boundaries
- [ ] Backend error categorization
- [ ] Automatic retry logic
- [ ] Graceful degradation

**Week 3-4: Monitoring & Observability**
- [ ] Add OpenTelemetry tracing
- [ ] Create Grafana dashboards
- [ ] Set up alerting (Prometheus)
- [ ] Add health check endpoints

**Deliverables:**
- ✅ Comprehensive error handling
- ✅ Production monitoring
- ✅ Real-time metrics

### Month 3: Performance & Polish

**Week 1-2: Performance Optimization**
- [ ] Replace Whisper with whisper.cpp
- [ ] Implement LLM response caching
- [ ] Add tool result caching
- [ ] Optimize vector search (consider Qdrant)

**Week 3-4: Production Readiness**
- [ ] Load testing (100 concurrent users)
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment scripts

**Deliverables:**
- ✅ <100ms STT latency
- ✅ <200ms LLM first token
- ✅ Production-ready deployment

---

## 8. Completion Checklist

### 🔴 Critical (Must Have)

- [ ] Audio pipeline never crashes
- [ ] gRPC auto-reconnects on failure
- [ ] Session manager is modular (6 services)
- [ ] Error boundaries in frontend
- [ ] Comprehensive error handling in backend
- [ ] 80% test coverage
- [ ] Production logging with correlation IDs
- [ ] Health check endpoints
- [ ] Graceful shutdown

### 🟡 High Priority (Should Have)

- [ ] Whisper.cpp integration (<100ms STT)
- [ ] LLM response caching
- [ ] Tool result caching
- [ ] OpenTelemetry tracing
- [ ] Grafana dashboards
- [ ] Rate limiting per user
- [ ] Load testing (100 users)

### 🟢 Medium Priority (Nice to Have)

- [ ] Adaptive VAD threshold
- [ ] Audio compression (Opus)
- [ ] Request batching
- [ ] Vector search optimization
- [ ] Conversation summarization
- [ ] Mobile app (React Native)

---

## 9. Architecture Diagrams

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON FRONTEND                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ GnaniCore    │  │ VAD Manager  │  │ gRPC Client  │ │
│  │ (State Mgmt) │  │ (Audio)      │  │ (Streaming)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (gRPC Bidirectional Stream)
┌─────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Session Manager (480 lines)              │  │
│  │  • Audio buffering                                │  │
│  │  • Whisper STT                                    │  │
│  │  • Memory retrieval                               │  │
│  │  • LLM generation                                 │  │
│  │  • Tool execution                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│         ┌────────────────┼────────────────┐            │
│         ▼                ▼                ▼            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │ MongoDB  │    │  Redis   │    │ ChromaDB │        │
│  └──────────┘    └──────────┘    └──────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Proposed Architecture (Single LLM, Future-Proof)

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON FRONTEND                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ GnaniCore    │  │ Audio        │  │ Resilient    │ │
│  │ (UI)         │  │ Pipeline     │  │ gRPC Client  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (gRPC with Auto-Reconnect)
┌─────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Session Coordinator (Orchestrator)       │  │
│  └──────────────────────────────────────────────────┘  │
│         │                │                │             │
│         ▼                ▼                ▼             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │  Audio   │    │Transcript│    │ Context  │        │
│  │Processor │    │Processor │    │ Builder  │        │
│  └──────────┘    └──────────┘    └──────────┘        │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         LLM Executor (Single LLM)                │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  LLM Interface (Future: Multi-Agent)       │ │  │
│  │  │  • generate(prompt)                         │ │  │
│  │  │  • generateForAgent(agentId, prompt) [TBD] │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│         ┌────────────────┼────────────────┐            │
│         ▼                ▼                ▼            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │ MongoDB  │    │  Redis   │    │ Qdrant   │        │
│  │(History) │    │ (Cache)  │    │ (Vector) │        │
│  └──────────┘    └──────────┘    └──────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Conclusion

This report provides a comprehensive plan to build a **production-grade, single-LLM version of GNANI** that is:

1. **Reliable:** No crashes, auto-recovery, comprehensive error handling
2. **Performant:** <100ms STT, <200ms LLM first token, efficient caching
3. **Scalable:** Stateless design, Redis-backed sessions, horizontal scaling ready
4. **Maintainable:** Modular architecture, 80% test coverage, clean separation of concerns
5. **Future-Proof:** Abstract interfaces, message bus pattern, agent-ready design

**Timeline:** 3 months to production-ready single-LLM system

**Next Steps:**
1. Review and approve this plan
2. Begin Month 1: Foundation Hardening
3. Set up monitoring and metrics
4. Start weekly progress reviews

---

**Document End**

*Prepared by: Senior AI Systems Architect*  
*Version: 1.0*  
*Date: December 3, 2025*
