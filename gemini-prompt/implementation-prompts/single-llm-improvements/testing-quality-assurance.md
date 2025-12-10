# Testing & Quality Assurance Prompt

**Priority:** P2  
**Estimated Time:** 1 week  
**Dependencies:** All stages 1-12 complete

---

## Objective

Comprehensive testing strategy for the Gnani backend to achieve production-grade quality assurance, including load testing, integration testing, performance benchmarking, and continuous monitoring.

---

## 1. Load Testing with k6

### Setup

```bash
# Install k6
choco install k6  # Windows
brew install k6   # macOS
```

### Test Scenarios

#### Scenario 1: Baseline Load Test

**File:** `tests/load/baseline.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  // Health check
  const healthRes = http.get('http://localhost:3000/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

#### Scenario 2: Conversation Load Test

**File:** `tests/load/conversation.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 200 },  // Ramp up to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 500 },  // Spike to 500 users
    { duration: '5m', target: 200 },  // Back to 200
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% < 2s
    http_req_failed: ['rate<0.05'],     // Error rate < 5%
  },
};

export default function () {
  const payload = JSON.stringify({
    conversationId: `conv-${__VU}`,
    text: 'What is the weather today?',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/api/conversation/message', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(Math.random() * 3 + 2); // Random sleep 2-5s
}
```

#### Scenario 3: Stress Test

**File:** `tests/load/stress.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // Ramp up to 500
    { duration: '5m', target: 1000 },  // Ramp up to 1000
    { duration: '5m', target: 1500 },  // Ramp up to 1500
    { duration: '5m', target: 2000 },  // Ramp up to 2000 (find breaking point)
    { duration: '10m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

### Running Load Tests

```bash
# Baseline test
k6 run tests/load/baseline.js

# Conversation test
k6 run tests/load/conversation.js

# Stress test
k6 run tests/load/stress.js

# With output to InfluxDB (for visualization)
k6 run --out influxdb=http://localhost:8086/k6 tests/load/baseline.js
```

---

## 2. Integration Testing

### Additional Integration Tests

**File:** `tests/integration/session-flow.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/server.js';

describe('Session Flow Integration', () => {
  it('should create session, send message, get response', async () => {
    // 1. Create session
    const sessionRes = await request(app)
      .post('/api/session/start')
      .send({ userId: 'test-user' });
    
    expect(sessionRes.status).toBe(200);
    const { sessionId, conversationId } = sessionRes.body;

    // 2. Send message
    const messageRes = await request(app)
      .post('/api/conversation/message')
      .send({
        conversationId,
        text: 'Hello, how are you?'
      });
    
    expect(messageRes.status).toBe(200);
    expect(messageRes.body).toHaveProperty('response');

    // 3. Get conversation history
    const historyRes = await request(app)
      .get(`/api/conversation/${conversationId}/messages`);
    
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.messages).toHaveLength(2); // User + Assistant
  });
});
```

**File:** `tests/integration/error-handling.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/server.js';

describe('Error Handling Integration', () => {
  it('should handle invalid conversation ID', async () => {
    const res = await request(app)
      .post('/api/conversation/message')
      .send({
        conversationId: 'invalid-id',
        text: 'Hello'
      });
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle rate limiting', async () => {
    // Send 100 requests rapidly
    const promises = Array(100).fill(null).map(() =>
      request(app).get('/health')
    );

    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## 3. Performance Benchmarking

### Metrics to Track

**File:** `tests/performance/benchmarks.ts`

```typescript
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  it('should process audio chunk in <50ms', async () => {
    const audioBuffer = Buffer.alloc(4000); // 250ms of audio
    
    const start = performance.now();
    await audioProcessor.processChunk(audioBuffer);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
  });

  it('should build context in <100ms', async () => {
    const start = performance.now();
    await contextBuilder.build('test-conversation', 'Hello');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  it('should cache lookup in <10ms', async () => {
    await cacheService.set('test-key', 'test-value');
    
    const start = performance.now();
    await cacheService.get('test-key');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10);
  });
});
```

---

## 4. Frontend Error Reporting

### Setup Error Tracking

**File:** `electron/error-reporter.js`

```javascript
class ErrorReporter {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
  }

  async reportError(error, context) {
    try {
      await fetch(`${this.backendUrl}/api/errors/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: process.platform
        })
      });
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }
}

export default new ErrorReporter('http://localhost:3000');
```

**Backend Endpoint:** `src/routes/error.routes.ts`

```typescript
router.post('/errors/report', async (req, res) => {
  const { message, stack, context, timestamp, userAgent, platform } = req.body;
  
  logger.error('Frontend error reported', {
    message,
    stack,
    context,
    timestamp,
    userAgent,
    platform
  });
  
  await auditService.logEvent('FRONTEND_ERROR', context.userId, null, {
    message,
    stack,
    userAgent,
    platform
  }, 'error');
  
  res.json({ success: true });
});
```

---

## 5. Continuous Monitoring

### Health Polling

**File:** `electron/health-monitor.js`

```javascript
class HealthMonitor {
  constructor(backendUrl, interval = 30000) {
    this.backendUrl = backendUrl;
    this.interval = interval;
    this.isHealthy = true;
  }

  start() {
    this.checkHealth();
    this.intervalId = setInterval(() => this.checkHealth(), this.interval);
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      const wasHealthy = this.isHealthy;
      this.isHealthy = response.ok;
      
      if (!this.isHealthy && wasHealthy) {
        this.onUnhealthy();
      } else if (this.isHealthy && !wasHealthy) {
        this.onRecovered();
      }
    } catch (error) {
      if (this.isHealthy) {
        this.isHealthy = false;
        this.onUnhealthy();
      }
    }
  }

  onUnhealthy() {
    console.error('Backend is unhealthy');
    // Show notification to user
    // Attempt reconnection
  }

  onRecovered() {
    console.log('Backend recovered');
    // Show recovery notification
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export default HealthMonitor;
```

---

## 6. Test Coverage Goals

### Coverage Targets

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All critical flows
- **Load Tests:** 1000+ concurrent users
- **Performance:** All benchmarks met

### Running All Tests

```bash
# Unit tests with coverage
npm run test:coverage

# Integration tests
npm run test:integration

# Load tests
npm run test:load

# Performance benchmarks
npm run test:performance
```

---

## 7. Verification Checklist

- [ ] Load tests pass (1000+ concurrent users)
- [ ] Integration tests pass (all critical flows)
- [ ] Performance benchmarks met
- [ ] Frontend error reporting working
- [ ] Health monitoring active
- [ ] Test coverage ≥80%
- [ ] No memory leaks detected
- [ ] No performance regressions

---

## Success Criteria

1. ✅ **Load Test:** Handle 1000+ concurrent users with <1% error rate
2. ✅ **Performance:** p95 latency <500ms for API calls
3. ✅ **Coverage:** 80%+ test coverage
4. ✅ **Monitoring:** Frontend health polling active
5. ✅ **Error Tracking:** Frontend errors reported to backend

---

## Timeline

- **Week 1:** Load testing setup and execution
- **Week 2:** Integration tests and performance benchmarks
- **Week 3:** Frontend error reporting and health monitoring
- **Week 4:** Coverage improvements and final verification

---

## Notes

- Run load tests in staging environment first
- Monitor resource usage during load tests
- Use Grafana to visualize load test results
- Document any performance bottlenecks found
- Create tickets for any issues discovered
