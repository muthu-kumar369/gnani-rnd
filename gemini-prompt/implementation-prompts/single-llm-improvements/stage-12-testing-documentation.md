# Stage 12: Testing & Documentation

**Priority:** P1  
**Estimated Time:** 1 week  
**Dependencies:** All previous stages

---

## Objective

Achieve 80%+ test coverage and complete documentation for production deployment, including unit tests, integration tests, load tests, API documentation, deployment guides, and runbooks.

---

## Implementation

### 1. Unit Testing Setup

**File:** `jest.config.js`

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

**File:** `tests/setup.ts`

```typescript
import mongoose from 'mongoose';
import redis from '../src/config/redis.config.js';

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/gnani-test');
});

afterAll(async () => {
  // Cleanup
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await redis.quit();
});

afterEach(async () => {
  // Clear collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  // Clear Redis
  await redis.flushdb();
});
```

### 2. Unit Tests

**File:** `tests/unit/session.coordinator.test.ts`

```typescript
import sessionCoordinator from '../../src/modules/session/session.coordinator.js';

describe('SessionCoordinator', () => {
  it('should start session', async () => {
    const { sessionId, conversationId } = await sessionCoordinator.startSession(
      'user-123',
      async () => {},
      async () => {},
      async () => {},
      async () => {}
    );

    expect(sessionId).toBeDefined();
    expect(conversationId).toBeDefined();
  });

  it('should recover session from MongoDB', async () => {
    const { sessionId } = await sessionCoordinator.startSession('user-123', ...);
    
    // Clear in-memory sessions
    sessionCoordinator['sessions'].clear();
    
    // Recover
    const recovered = await sessionCoordinator.recoverSession(sessionId);
    expect(recovered).toBeTruthy();
    expect(recovered?.userId).toBe('user-123');
  });

  it('should handle concurrent sessions', async () => {
    const promises = Array(10).fill(null).map((_, i) =>
      sessionCoordinator.startSession(`user-${i}`, ...)
    );

    const results = await Promise.all(promises);
    expect(results.length).toBe(10);
    expect(new Set(results.map(r => r.sessionId)).size).toBe(10);
  });
});
```

### 3. Integration Tests

**File:** `tests/integration/audio-flow.test.ts`

```typescript
import fs from 'fs';
import path from 'path';

describe('Audio Flow Integration', () => {
  it('should process audio end-to-end', async () => {
    // Load test audio file
    const audioBuffer = fs.readFileSync(path.join(__dirname, '../fixtures/test-audio.wav'));
    
    // Start session
    const { sessionId } = await sessionCoordinator.startSession('user-123', ...);
    
    // Process audio chunks
    const chunkSize = 4000;
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      const chunk = audioBuffer.slice(i, i + chunkSize);
      await sessionCoordinator.processAudioChunk(sessionId, chunk, 16000);
    }
    
    // Finish stream
    await sessionCoordinator.finishAudioStream(sessionId);
    
    // Verify transcript was generated
    // Verify LLM response was generated
    // Verify message was saved to database
  });
});
```

### 4. Load Testing

**File:** `tests/load/k6-script.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be below 1%
  },
};

export default function () {
  const res = http.post('http://localhost:3000/api/conversation/message', JSON.stringify({
    conversationId: 'test-conv-123',
    text: 'Hello, how are you?'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 5. API Documentation

**File:** `src/docs/swagger.config.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gnani API',
      version: '1.0.0',
      description: 'AI Assistant API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec);
export const swaggerUiServe = swaggerUi.serve;
```

### 6. Deployment Guide

**File:** `DEPLOYMENT.md`

```markdown
# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (optional)
- MongoDB (v6.0+)
- Redis (v7.0+)

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `MONGODB_URI`
- `REDIS_HOST`
- `LLM_SERVER_URL`
- `JWT_SECRET`

## Docker Deployment
\`\`\`bash
# Build image
docker build -t gnani-backend:latest .

# Run with docker-compose
docker-compose up -d
\`\`\`

## Kubernetes Deployment
\`\`\`bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n gnani
\`\`\`

## Database Migrations
\`\`\`bash
npm run migrate
\`\`\`

## Monitoring Setup
1. Deploy Prometheus & Grafana
2. Import dashboards from `monitoring/grafana/dashboards/`
3. Configure alerts in `monitoring/prometheus/alerts.yml`
```

### 7. Runbook

**File:** `RUNBOOK.md`

```markdown
# Runbook

## Common Issues

### High Error Rate
**Symptoms:** Error rate >1%
**Diagnosis:** Check `/metrics` endpoint, review logs
**Resolution:**
1. Check circuit breaker states
2. Verify external dependencies (MongoDB, Redis, LLM)
3. Review recent deployments
4. Scale up if CPU/memory high

### LLM Latency High
**Symptoms:** p95 latency >10s
**Diagnosis:** Check Grafana LLM dashboard
**Resolution:**
1. Check LLM server health
2. Review cache hit rate
3. Check for slow database queries
4. Consider scaling LLM server

### Session Recovery Failures
**Symptoms:** Users losing context
**Diagnosis:** Check MongoDB connection, review session logs
**Resolution:**
1. Verify MongoDB is accessible
2. Check session TTL settings
3. Review session persistence logs
4. Manually recover sessions if needed

## Emergency Procedures

### Circuit Breaker Stuck Open
\`\`\`bash
curl -X POST http://localhost:3000/api/admin/circuit-breakers/mongodb/reset
\`\`\`

### Clear All Cache
\`\`\`bash
redis-cli FLUSHDB
\`\`\`

### Restart Service
\`\`\`bash
kubectl rollout restart deployment/gnani-backend
\`\`\`
```

---

## Verification Checklist

- [ ] 80%+ unit test coverage
- [ ] Integration tests passing
- [ ] Load tests completed (1000+ concurrent users)
- [ ] API documentation generated
- [ ] Deployment guide complete
- [ ] Runbook created
- [ ] All tests passing in CI/CD
- [ ] Performance benchmarks met

---

## Success Criteria

1. ✅ **Test Coverage:** 80%+ across all modules
2. ✅ **Load Test:** Handle 1000+ concurrent users
3. ✅ **Documentation:** Complete API docs, deployment guide, runbook
4. ✅ **CI/CD:** All tests passing automatically
5. ✅ **Performance:** All benchmarks met (latency, throughput, error rate)
