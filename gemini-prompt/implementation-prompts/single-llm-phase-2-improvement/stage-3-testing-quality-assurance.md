# Stage 3: Testing & Quality Assurance

**Priority:** P1 (Critical for UX)  
**Duration:** 10 days  
**Dependencies:** Stages 1-2 (for testing monitoring and security features)  
**Current Completion:** 40%

---

## Context & Background

### Current State Analysis

**✅ What Exists:**
- Jest test framework configured (`jest.config.js`)
- Some unit tests in `tests/` directory
- Test utilities and helpers
- Frontend tests in `react/src/tests/`

**❌ What's Missing:**
- **80% test coverage target** (currently ~40%)
- Integration tests
- Load testing (1000+ concurrent users)
- E2E tests for critical flows
- Performance benchmarks
- Chaos testing
- Test automation in CI/CD

### Why This Matters

Without comprehensive testing:
- **No confidence** in code changes
- **Regressions** go undetected
- **Performance degradation** not caught early
- **Production bugs** discovered by users
- **Scalability limits** unknown

---

## Objectives

### Primary Goals

1. **Unit Test Coverage** - Achieve 80% code coverage
2. **Integration Testing** - Test service interactions
3. **Load Testing** - Validate 1000+ concurrent users
4. **E2E Testing** - Test critical user flows
5. **Performance Benchmarking** - Establish baselines
6. **Test Automation** - Run tests in CI/CD

### Success Criteria

- [ ] 80%+ unit test coverage
- [ ] Integration tests for all critical paths
- [ ] Load test passing at 1000+ concurrent users
- [ ] E2E tests for 10+ critical flows
- [ ] Performance benchmarks documented
- [ ] All tests running in CI/CD
- [ ] Test documentation complete

---

## Technical Requirements

### 1. Unit Testing (Days 1-4)

#### Coverage Target: 80%

**Priority Modules for Testing:**

**Core Services (P0):**
- `src/modules/llm/llm.service.ts`
- `src/modules/session/session.coordinator.ts`
- `src/modules/memory/memory.manager.ts`
- `src/modules/vector/vector.manager.ts`
- `src/modules/tool/tool.service.ts`
- `src/core/state-machine/assistant.machine.ts`

**Utilities (P1):**
- `src/core/reliability/circuit-breaker.ts`
- `src/core/cache/cache.service.ts`
- `src/core/monitoring/metrics.ts`
- `src/core/security/pii-detector.service.ts`
- `src/core/validation/schemas.ts`

**API Layer (P2):**
- `src/routes/*.routes.ts`
- `src/controllers/*.controller.ts`
- `src/middleware/*.middleware.ts`

#### Test Structure

```typescript
// tests/modules/llm/llm.service.test.ts
import { LLMService } from '@/modules/llm/llm.service';
import { OllamaProvider } from '@/core/llm/ollama.provider';
import { CacheService } from '@/core/cache/cache.service';
import { CircuitBreaker } from '@/core/reliability/circuit-breaker';

describe('LLMService', () => {
  let llmService: LLMService;
  let mockOllamaProvider: jest.Mocked<OllamaProvider>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  beforeEach(() => {
    // Create mocks
    mockOllamaProvider = {
      generateResponse: jest.fn(),
      streamResponse: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    mockCircuitBreaker = {
      execute: jest.fn((fn) => fn()),
    } as any;

    // Create service instance
    llmService = new LLMService(
      mockOllamaProvider,
      mockCacheService,
      mockCircuitBreaker
    );
  });

  describe('generateResponse', () => {
    it('should return cached response if available', async () => {
      const cachedResponse = { content: 'cached' };
      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await llmService.generateResponse({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama3.1',
      });

      expect(result).toEqual(cachedResponse);
      expect(mockOllamaProvider.generateResponse).not.toHaveBeenCalled();
    });

    it('should call provider if cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const providerResponse = { content: 'fresh' };
      mockOllamaProvider.generateResponse.mockResolvedValue(providerResponse);

      const result = await llmService.generateResponse({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama3.1',
      });

      expect(result).toEqual(providerResponse);
      expect(mockOllamaProvider.generateResponse).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should handle circuit breaker open state', async () => {
      mockCircuitBreaker.execute.mockRejectedValue(
        new Error('Circuit breaker open')
      );

      await expect(
        llmService.generateResponse({
          messages: [{ role: 'user', content: 'test' }],
          model: 'llama3.1',
        })
      ).rejects.toThrow('Circuit breaker open');
    });

    it('should retry on transient failures', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockOllamaProvider.generateResponse
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ content: 'success' });

      const result = await llmService.generateResponse({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama3.1',
      });

      expect(result.content).toBe('success');
      expect(mockOllamaProvider.generateResponse).toHaveBeenCalledTimes(2);
    });
  });

  describe('streamResponse', () => {
    it('should stream tokens with stabilization buffer', async () => {
      const mockStream = async function* () {
        yield { content: 'Hello' };
        yield { content: ' world' };
        yield { content: '!' };
      };

      mockOllamaProvider.streamResponse.mockReturnValue(mockStream());

      const chunks: string[] = [];
      for await (const chunk of llmService.streamResponse({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama3.1',
      })) {
        chunks.push(chunk.content);
      }

      expect(chunks).toEqual(['Hello', ' world', '!']);
    });
  });
});
```

#### Test Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report
npm run test:coverage:html

# View coverage report
open coverage/index.html
```

#### Coverage Configuration

Update `jest.config.js`:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/index.ts',
    '!src/**/*.test.ts',
  ],
};
```

---

### 2. Integration Testing (Days 5-6)

#### Test Service Interactions

Create `tests/integration/` directory structure:

```
tests/integration/
├── session-flow.test.ts
├── llm-memory-integration.test.ts
├── tool-execution.test.ts
├── audio-pipeline.test.ts
└── helpers/
    ├── test-server.ts
    └── test-data.ts
```

#### Example: Session Flow Integration Test

```typescript
// tests/integration/session-flow.test.ts
import { startTestServer, stopTestServer } from './helpers/test-server';
import { createTestUser, createTestSession } from './helpers/test-data';
import request from 'supertest';

describe('Session Flow Integration', () => {
  let server: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    server = await startTestServer();
    const user = await createTestUser();
    userId = user.id;
    authToken = user.token;
  });

  afterAll(async () => {
    await stopTestServer(server);
  });

  it('should complete full session lifecycle', async () => {
    // 1. Create session
    const createResponse = await request(server)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId })
      .expect(201);

    const sessionId = createResponse.body.sessionId;

    // 2. Send message
    const messageResponse = await request(server)
      .post(`/api/v1/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'What is the weather?',
        role: 'user',
      })
      .expect(200);

    expect(messageResponse.body).toHaveProperty('response');

    // 3. Verify memory was created
    const memoryResponse = await request(server)
      .get(`/api/v1/sessions/${sessionId}/memory`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(memoryResponse.body.messages.length).toBeGreaterThan(0);

    // 4. End session
    await request(server)
      .delete(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // 5. Verify session is ended
    await request(server)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should recover session from Redis', async () => {
    // Create session
    const session = await createTestSession(userId);

    // Simulate server restart
    await stopTestServer(server);
    server = await startTestServer();

    // Verify session can be recovered
    const response = await request(server)
      .get(`/api/v1/sessions/${session.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(session.id);
  });
});
```

#### Database Integration Tests

```typescript
// tests/integration/database.test.ts
import { MongoClient } from 'mongodb';
import { ConversationService } from '@/modules/conversation/conversation.service';

describe('Database Integration', () => {
  let mongoClient: MongoClient;
  let conversationService: ConversationService;

  beforeAll(async () => {
    mongoClient = await MongoClient.connect(process.env.MONGODB_TEST_URI);
    conversationService = new ConversationService(mongoClient.db());
  });

  afterAll(async () => {
    await mongoClient.close();
  });

  beforeEach(async () => {
    // Clear test database
    await mongoClient.db().dropDatabase();
  });

  it('should create and retrieve conversation', async () => {
    const conversation = await conversationService.create({
      userId: 'test-user',
      title: 'Test Conversation',
    });

    const retrieved = await conversationService.findById(conversation.id);

    expect(retrieved).toMatchObject({
      id: conversation.id,
      userId: 'test-user',
      title: 'Test Conversation',
    });
  });

  it('should handle concurrent writes', async () => {
    const conversation = await conversationService.create({
      userId: 'test-user',
      title: 'Test',
    });

    // Simulate concurrent message additions
    const promises = Array.from({ length: 10 }, (_, i) =>
      conversationService.addMessage(conversation.id, {
        role: 'user',
        content: `Message ${i}`,
      })
    );

    await Promise.all(promises);

    const updated = await conversationService.findById(conversation.id);
    expect(updated.messages.length).toBe(10);
  });
});
```

---

### 3. Load Testing (Days 7-8)

#### Tools: k6 (Recommended)

Install k6:
```bash
# Windows
choco install k6

# macOS
brew install k6

# Linux
sudo apt-get install k6
```

#### Load Test Scripts

Create `tests/load/` directory:

```javascript
// tests/load/session-creation.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.01'],             // Error rate must be below 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // 1. Create session
  const createRes = http.post(
    `${BASE_URL}/api/v1/sessions`,
    JSON.stringify({
      userId: `user-${__VU}-${__ITER}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    }
  );

  check(createRes, {
    'session created': (r) => r.status === 201,
    'has session ID': (r) => r.json('sessionId') !== undefined,
  }) || errorRate.add(1);

  const sessionId = createRes.json('sessionId');

  sleep(1);

  // 2. Send message
  const messageRes = http.post(
    `${BASE_URL}/api/v1/sessions/${sessionId}/messages`,
    JSON.stringify({
      content: 'Hello, how are you?',
      role: 'user',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    }
  );

  check(messageRes, {
    'message sent': (r) => r.status === 200,
    'has response': (r) => r.json('response') !== undefined,
  }) || errorRate.add(1);

  sleep(2);

  // 3. End session
  const endRes = http.del(
    `${BASE_URL}/api/v1/sessions/${sessionId}`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    }
  );

  check(endRes, {
    'session ended': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
```

#### gRPC Load Testing

```javascript
// tests/load/grpc-audio-stream.js
import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';

const client = new grpc.Client();
client.load(['../proto'], 'session.proto');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  client.connect('localhost:50051', { plaintext: true });

  const stream = new grpc.Stream(client, 'gnani.SessionService/StreamAudio');

  stream.on('data', (chunk) => {
    check(chunk, {
      'has transcript': (c) => c.transcript !== undefined,
    });
  });

  // Send audio chunks
  for (let i = 0; i < 10; i++) {
    stream.write({
      sessionId: `session-${__VU}`,
      audioData: new Uint8Array(1024).fill(i),
      sampleRate: 16000,
    });
    sleep(0.1);
  }

  stream.end();
  client.close();
  sleep(1);
}
```

#### Run Load Tests

```bash
# Run session creation load test
k6 run tests/load/session-creation.js

# Run with custom parameters
k6 run --vus 1000 --duration 10m tests/load/session-creation.js

# Run and export results
k6 run --out json=results.json tests/load/session-creation.js
```

#### Load Test Success Criteria

- [ ] 1000 concurrent users supported
- [ ] p95 latency < 500ms under load
- [ ] Error rate < 1%
- [ ] No memory leaks
- [ ] No connection pool exhaustion
- [ ] Graceful degradation under extreme load

---

### 4. E2E Testing (Day 9)

#### Tools: Playwright (for Electron app)

Install Playwright:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

#### E2E Test Structure

```
tests/e2e/
├── specs/
│   ├── conversation.spec.ts
│   ├── voice-assistant.spec.ts
│   ├── settings.spec.ts
│   └── tool-execution.spec.ts
├── fixtures/
│   ├── test-audio.wav
│   └── test-data.json
└── helpers/
    └── electron-helpers.ts
```

#### Example: Voice Assistant E2E Test

```typescript
// tests/e2e/specs/voice-assistant.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Voice Assistant Flow', () => {
  let electronApp: any;
  let window: any;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['electron/main.js'],
    });
    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should complete voice interaction', async () => {
    // 1. Click microphone button
    await window.click('[data-testid="mic-button"]');

    // 2. Verify listening state
    await expect(window.locator('[data-testid="status"]')).toHaveText('Listening...');

    // 3. Simulate audio input (via IPC)
    await electronApp.evaluate(async ({ ipcMain }) => {
      // Trigger audio processing
      ipcMain.emit('audio:chunk', {
        data: Buffer.from('...'),
        sampleRate: 16000,
      });
    });

    // 4. Wait for transcript
    await expect(window.locator('[data-testid="transcript"]'))
      .toContainText('Hello', { timeout: 5000 });

    // 5. Wait for response
    await expect(window.locator('[data-testid="response"]'))
      .not.toBeEmpty({ timeout: 10000 });

    // 6. Verify audio playback
    const audioElement = await window.locator('audio');
    await expect(audioElement).toHaveAttribute('src');
  });

  test('should handle barge-in', async () => {
    // Start conversation
    await window.click('[data-testid="mic-button"]');
    
    // Wait for assistant to start speaking
    await expect(window.locator('[data-testid="status"]'))
      .toHaveText('Speaking...');

    // Interrupt with new input
    await window.click('[data-testid="mic-button"]');

    // Verify previous response was cancelled
    await expect(window.locator('[data-testid="status"]'))
      .toHaveText('Listening...');
  });
});
```

---

### 5. Performance Benchmarking (Day 10)

#### Benchmark Suite

Create `tests/benchmarks/`:

```typescript
// tests/benchmarks/llm-performance.bench.ts
import { LLMService } from '@/modules/llm/llm.service';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
}

async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  return {
    operation: name,
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

describe('LLM Performance Benchmarks', () => {
  let llmService: LLMService;

  beforeAll(() => {
    llmService = new LLMService(/* ... */);
  });

  it('should benchmark response generation', async () => {
    const result = await benchmark(
      'LLM Response Generation',
      async () => {
        await llmService.generateResponse({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'llama3.1',
        });
      },
      50
    );

    console.table(result);

    // Assert performance targets
    expect(result.p95).toBeLessThan(3000); // p95 < 3s
    expect(result.avgTime).toBeLessThan(2000); // avg < 2s
  });

  it('should benchmark streaming', async () => {
    const result = await benchmark(
      'LLM Streaming (TTFT)',
      async () => {
        const stream = llmService.streamResponse({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'llama3.1',
        });

        // Measure time to first token
        await stream.next();
      },
      50
    );

    console.table(result);

    expect(result.p95).toBeLessThan(500); // TTFT p95 < 500ms
  });
});
```

#### Baseline Performance Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| LLM Response (text) | 1s | 2s | 3s |
| LLM Streaming (TTFT) | 200ms | 500ms | 1s |
| Vector Search | 50ms | 100ms | 200ms |
| Session Creation | 50ms | 100ms | 150ms |
| Context Building | 100ms | 200ms | 300ms |
| Tool Execution (avg) | 500ms | 1s | 2s |
| Whisper Transcription | 500ms | 1s | 2s |

---

## Implementation Checklist

### Days 1-4: Unit Testing
- [ ] Set up test coverage reporting
- [ ] Write tests for LLM service
- [ ] Write tests for session coordinator
- [ ] Write tests for memory manager
- [ ] Write tests for vector manager
- [ ] Write tests for tool service
- [ ] Write tests for state machine
- [ ] Write tests for utilities
- [ ] Achieve 80% coverage

### Days 5-6: Integration Testing
- [ ] Set up integration test environment
- [ ] Write session flow tests
- [ ] Write LLM-memory integration tests
- [ ] Write tool execution tests
- [ ] Write database integration tests
- [ ] Write cache integration tests

### Days 7-8: Load Testing
- [ ] Install k6
- [ ] Write HTTP load tests
- [ ] Write gRPC load tests
- [ ] Run baseline load tests
- [ ] Identify bottlenecks
- [ ] Optimize and re-test
- [ ] Document results

### Day 9: E2E Testing
- [ ] Install Playwright
- [ ] Write voice assistant E2E tests
- [ ] Write conversation E2E tests
- [ ] Write settings E2E tests
- [ ] Write tool execution E2E tests
- [ ] Run all E2E tests

### Day 10: Performance Benchmarking
- [ ] Create benchmark suite
- [ ] Run LLM benchmarks
- [ ] Run vector search benchmarks
- [ ] Run session benchmarks
- [ ] Document baseline performance
- [ ] Create performance regression tests

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
      redis:
        image: redis:latest
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  load-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/setup-k6-action@v1
      - run: k6 run tests/load/session-creation.js

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## Success Metrics

- [ ] 80%+ unit test coverage achieved
- [ ] All integration tests passing
- [ ] Load test passing at 1000+ concurrent users
- [ ] All E2E tests passing
- [ ] Performance benchmarks meet targets
- [ ] All tests running in CI/CD
- [ ] Test documentation complete
- [ ] Zero flaky tests

---

**Estimated Effort:** 10 days  
**Complexity:** High  
**Risk:** Low (testing doesn't affect production code)
