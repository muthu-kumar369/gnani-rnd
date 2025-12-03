# Stage 3.3: Production Deployment & Load Testing

**Duration:** Week 12 (5 working days)  
**Priority:** 🔴 Critical  
**Dependencies:** All previous stages complete

---

## Overview

Final stage: Deploy to production, perform comprehensive load testing, validate all success metrics, and ensure the system is production-ready for 100 concurrent users.

## Goals

1. Production deployment with Docker
2. Load testing (100 concurrent users)
3. Performance validation (<100ms STT, <200ms LLM)
4. Security audit
5. Final acceptance testing

---

## Production Deployment

### Task 1: Docker Configuration

**File:** `gnani-rnd-backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install whisper.cpp dependencies
RUN apk add --no-cache \
    build-base \
    git \
    cmake

# Copy whisper.cpp setup script
COPY scripts/setup-whisper-cpp.sh /tmp/
RUN chmod +x /tmp/setup-whisper-cpp.sh && /tmp/setup-whisper-cpp.sh

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose ports
EXPOSE 3000 9464

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

**File:** `gnani-rnd-backend/docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  gnani-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gnani-backend
    ports:
      - "3000:3000"
      - "9464:9464"
      - "50051:50051"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/gnani
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - VECTOR_DB_HOST=chromadb
      - VECTOR_DB_PORT=8000
    depends_on:
      - mongo
      - redis
      - chromadb
    restart: unless-stopped
    networks:
      - gnani-network

  mongo:
    image: mongo:7
    container_name: gnani-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - gnani-network

  redis:
    image: redis:7-alpine
    container_name: gnani-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    networks:
      - gnani-network

  chromadb:
    image: chromadb/chroma:latest
    container_name: gnani-chromadb
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    restart: unless-stopped
    networks:
      - gnani-network

  prometheus:
    image: prom/prometheus:latest
    container_name: gnani-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: unless-stopped
    networks:
      - gnani-network

  grafana:
    image: grafana/grafana:latest
    container_name: gnani-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    restart: unless-stopped
    networks:
      - gnani-network

volumes:
  mongo-data:
  redis-data:
  chroma-data:
  prometheus-data:
  grafana-data:

networks:
  gnani-network:
    driver: bridge
```

### Task 2: Deployment Script

**File:** `gnani-rnd-backend/scripts/deploy-production.sh`

```bash
#!/bin/bash

echo "========================================="
echo "GNANI Production Deployment"
echo "========================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed."; exit 1; }

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
else
    echo "ERROR: .env.production file not found"
    exit 1
fi

# Build application
echo "Building application..."
npm run build

# Run tests
echo "Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "ERROR: Tests failed. Aborting deployment."
    exit 1
fi

# Build Docker images
echo "Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Stop old containers
echo "Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Health check
echo "Performing health check..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/ready > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

if ! curl -f http://localhost:3000/api/ready > /dev/null 2>&1; then
    echo "❌ ERROR: Backend failed to start"
    docker-compose -f docker-compose.prod.yml logs gnani-backend
    exit 1
fi

# Show running containers
echo ""
echo "========================================="
echo "Deployment successful!"
echo "========================================="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Services:"
echo "- Backend: http://localhost:3000"
echo "- Metrics: http://localhost:9464/metrics"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001"
echo ""
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
```

---

## Load Testing

### Task 3: Load Test Setup

**File:** `gnani-rnd-backend/tests/load/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    errors: ['rate<0.1'],               // Error rate under 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test 1: Health check
  let res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Start session
  res = http.post(`${BASE_URL}/api/session/start`, JSON.stringify({
    userId: `user-${__VU}`
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'session started': (r) => r.status === 200,
    'session has ID': (r) => r.json('sessionId') !== undefined,
  }) || errorRate.add(1);

  const sessionId = res.json('sessionId');

  sleep(1);

  // Test 3: Send text message
  res = http.post(`${BASE_URL}/api/chat`, JSON.stringify({
    sessionId,
    message: 'Hello, how are you?'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'chat response received': (r) => r.status === 200,
    'response has content': (r) => r.json('response') !== undefined,
  }) || errorRate.add(1);

  sleep(2);

  // Test 4: End session
  res = http.post(`${BASE_URL}/api/session/end`, JSON.stringify({
    sessionId
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'session ended': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
```

**Run Load Test:**

```bash
# Install k6
# macOS: brew install k6
# Linux: sudo apt-get install k6
# Windows: choco install k6

# Run load test
k6 run tests/load/load-test.js

# Generate HTML report
k6 run --out json=load-test-results.json tests/load/load-test.js
```

---

## Performance Validation

### Task 4: Performance Test Suite

**File:** `gnani-rnd-backend/tests/performance/performance.test.ts`

```typescript
import { performance } from 'perf_hooks';
import sessionCoordinator from '../../src/modules/session/session.coordinator';
import whisperService from '../../src/modules/asr/whisper.service';
import { llmManager } from '../../src/core/llm/llm.manager';

describe('Performance Tests', () => {
  it('STT latency should be < 100ms', async () => {
    const audioBuffer = generateTestAudio(1000); // 1 second
    
    const start = performance.now();
    await whisperService.transcribe('test-session', audioBuffer, 16000);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('LLM first token should be < 200ms', async () => {
    const prompt = 'Hello, how are you?';
    
    const start = performance.now();
    const generator = llmManager.generate(prompt);
    await generator.next(); // First token
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(200);
  });

  it('End-to-end latency should be < 2000ms', async () => {
    const sessionId = await sessionCoordinator.startSession('user123', jest.fn());
    const audioBuffer = generateTestAudio(1000);

    const start = performance.now();
    await sessionCoordinator.processAudioChunk(sessionId, audioBuffer, 16000);
    await sessionCoordinator.processTranscript(sessionId, 'Hello', true);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000);
  });

  it('Should handle 100 concurrent sessions', async () => {
    const sessions = [];

    // Start 100 sessions
    for (let i = 0; i < 100; i++) {
      const sessionId = await sessionCoordinator.startSession(`user${i}`, jest.fn());
      sessions.push(sessionId);
    }

    expect(sessions.length).toBe(100);

    // Cleanup
    for (const sessionId of sessions) {
      await sessionCoordinator.endSession(sessionId);
    }
  });
});
```

---

## Security Audit

### Task 5: Security Checklist

**File:** `gnani-rnd-backend/SECURITY_CHECKLIST.md`

```markdown
# Security Checklist

## Authentication & Authorization
- [ ] JWT tokens properly validated
- [ ] Token expiration enforced
- [ ] Refresh token rotation implemented
- [ ] Rate limiting on auth endpoints

## Input Validation
- [ ] All user inputs sanitized
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention
- [ ] Command injection prevention

## Data Protection
- [ ] Passwords hashed with bcrypt
- [ ] Sensitive data encrypted at rest
- [ ] TLS/SSL for all connections
- [ ] Environment variables for secrets

## API Security
- [ ] CORS properly configured
- [ ] Helmet.js middleware enabled
- [ ] Rate limiting on all endpoints
- [ ] Request size limits enforced

## Dependencies
- [ ] All dependencies up to date
- [ ] No known vulnerabilities (npm audit)
- [ ] Minimal dependencies used

## Logging & Monitoring
- [ ] No sensitive data in logs
- [ ] Failed auth attempts logged
- [ ] Suspicious activity alerts
- [ ] Log rotation configured

## Infrastructure
- [ ] Docker containers run as non-root
- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] Redis password protected
```

**Run Security Audit:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Generate security report
npm audit --json > security-report.json
```

---

## Final Acceptance Testing

### Task 6: Acceptance Test Suite

**File:** `gnani-rnd-backend/tests/acceptance/acceptance.test.ts`

```typescript
describe('Single-LLM Foundation - Acceptance Tests', () => {
  describe('Month 1: Foundation Hardening', () => {
    it('✅ Audio pipeline never crashes (1-hour test)', async () => {
      // Test continuous recording for 1 hour
      const duration = 60 * 60 * 1000;
      const result = await runContinuousRecording(duration);
      expect(result.crashed).toBe(false);
    });

    it('✅ Session manager is modular (6 services)', () => {
      expect(sessionCoordinator).toBeDefined();
      expect(audioProcessor).toBeDefined();
      expect(transcriptProcessor).toBeDefined();
      expect(contextBuilder).toBeDefined();
      expect(llmExecutor).toBeDefined();
      expect(toolExecutor).toBeDefined();
    });

    it('✅ 80% test coverage achieved', async () => {
      const coverage = await getCoverageReport();
      expect(coverage.lines).toBeGreaterThanOrEqual(80);
      expect(coverage.functions).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Month 2: Production Features', () => {
    it('✅ Error boundaries prevent UI crashes', async () => {
      // Trigger error and verify recovery
      const result = await triggerErrorAndRecover();
      expect(result.recovered).toBe(true);
    });

    it('✅ Monitoring dashboards operational', async () => {
      const prometheus = await fetch('http://localhost:9090/-/healthy');
      const grafana = await fetch('http://localhost:3001/api/health');
      expect(prometheus.ok).toBe(true);
      expect(grafana.ok).toBe(true);
    });

    it('✅ Graceful shutdown works', async () => {
      const result = await testGracefulShutdown();
      expect(result.allSessionsDrained).toBe(true);
      expect(result.shutdownTime).toBeLessThan(30000);
    });
  });

  describe('Month 3: Performance & Polish', () => {
    it('✅ STT latency < 100ms', async () => {
      const latency = await measureSTTLatency();
      expect(latency).toBeLessThan(100);
    });

    it('✅ LLM first token < 200ms', async () => {
      const latency = await measureLLMLatency();
      expect(latency).toBeLessThan(200);
    });

    it('✅ Cache hit rate > 30%', async () => {
      const stats = await llmCache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.3);
    });

    it('✅ Load tested (100 concurrent users)', async () => {
      const result = await runLoadTest(100);
      expect(result.errorRate).toBeLessThan(0.1);
      expect(result.p95Latency).toBeLessThan(500);
    });
  });
});
```

---

## Final Checklist

### Complete Implementation Checklist

```markdown
# Single-LLM Foundation - 100% Completion Checklist

## Month 1: Foundation Hardening ✅
- [x] Stage 1.1: Audio Pipeline Fixes
  - [x] Adaptive VAD implemented
  - [x] Buffer overflow protection
  - [x] gRPC auto-reconnection
  - [x] 1-hour recording test passed
- [x] Stage 1.2: Session Manager Refactoring
  - [x] 6 focused services created
  - [x] Dependency injection throughout
  - [x] 80% test coverage achieved
- [x] Stage 1.3: Unit Testing Infrastructure
  - [x] Jest configured
  - [x] All services tested
  - [x] CI/CD pipeline running

## Month 2: Production Features ✅
- [x] Stage 2.1: Error Handling & Recovery
  - [x] Error boundaries in frontend
  - [x] Error categorization in backend
  - [x] Retry logic with exponential backoff
  - [x] Graceful degradation
- [x] Stage 2.2: Monitoring & Observability
  - [x] OpenTelemetry tracing
  - [x] Prometheus metrics
  - [x] Grafana dashboards
  - [x] Alerting configured
- [x] Stage 2.3: Health Checks & Graceful Shutdown
  - [x] Health endpoints implemented
  - [x] Graceful shutdown working
  - [x] Zero-downtime deployment tested

## Month 3: Performance & Polish ✅
- [x] Stage 3.1: Whisper.cpp Integration
  - [x] Whisper.cpp installed
  - [x] STT latency < 100ms
  - [x] Accuracy maintained
- [x] Stage 3.2: LLM & Tool Caching
  - [x] LLM cache implemented
  - [x] Tool cache implemented
  - [x] Cache hit rate > 30%
- [x] Stage 3.3: Production Deployment & Load Testing
  - [x] Docker deployment working
  - [x] Load tested (100 users)
  - [x] Security audit passed
  - [x] All acceptance tests passing

## Final Metrics ✅
- [x] 0 crashes in 1-hour recording
- [x] 80% test coverage
- [x] <100ms STT latency
- [x] <200ms LLM first token
- [x] >30% cache hit rate
- [x] <10% error rate under load
- [x] 100 concurrent users supported
- [x] Zero-downtime deployment verified

## Production Ready ✅
- [x] All code reviewed
- [x] Documentation complete
- [x] Monitoring operational
- [x] Backups configured
- [x] Disaster recovery plan
- [x] Team trained
```

---

## Success Metrics

- ✅ All 9 stages completed
- ✅ 100% of acceptance tests passing
- ✅ Production deployment successful
- ✅ Load testing passed (100 concurrent users)
- ✅ Security audit passed
- ✅ Performance targets met
- ✅ Zero critical bugs

---

## Congratulations! 🎉

You have successfully completed the **Single-LLM Foundation** implementation. GNANI is now production-ready with:

- Rock-solid audio pipeline
- Modular, testable architecture
- Comprehensive error handling
- Production monitoring
- High performance (<100ms STT, <200ms LLM)
- Proven scalability (100 concurrent users)

**Next Steps:**
- Monitor production metrics
- Gather user feedback
- Plan for multi-agent evolution (see Future Development Master Plan)
