# STAGE 6: TESTING & OPTIMIZATION

**Duration:** 3 weeks  
**Priority:** HIGH  
**Dependencies:** All previous stages

---

## 🎯 OBJECTIVE

Achieve 80%+ test coverage, optimize performance, reduce bundle size, and complete all documentation. Ensure production-ready quality.

---

## 📋 TASKS

### Task 6.1: Increase Test Coverage to 80%+
**Effort:** 1 week

**Current Coverage:** ~30-40%  
**Target Coverage:** 80%+

**Implementation:**

**Unit Tests:**
```typescript
// Example: useConversationStore.test.ts
describe('useConversationStore', () => {
  it('should add message to conversation', () => {
    const store = useConversationStore.getState();
    store.addMessage({ type: 'user', message: 'Hello' });
    expect(store.messages).toHaveLength(1);
  });

  it('should handle message branching', () => {
    // Test branching logic
  });

  it('should validate message tree', () => {
    // Test tree validation
  });
});
```

**Coverage Goals:**
- Stores: 90%+
- Services: 85%+
- Utils: 95%+
- Components: 70%+
- Hooks: 80%+

**Verification:**
```bash
cd react && npm run test:coverage
cd ../gnani-rnd-backend && npm run test:coverage
```

---

### Task 6.2: Add Integration Tests for All Features
**Effort:** 1 week

**Implementation:**

**API Integration Tests:**
```typescript
// tests/integration/conversation.test.ts
describe('Conversation API', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Setup test user
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com', password: 'password' });
    accessToken = response.body.accessToken;
  });

  it('should create conversation', async () => {
    const response = await request(app)
      .post('/api/v1/conversations')
      .set('x-auth-token', accessToken)
      .send({ systemPrompt: 'Test' });

    expect(response.status).toBe(201);
    expect(response.body.conversationId).toBeDefined();
  });

  it('should fetch conversations', async () => {
    const response = await request(app)
      .get('/api/v1/conversations')
      .set('x-auth-token', accessToken);

    expect(response.status).toBe(200);
    expect(response.body.conversations).toBeInstanceOf(Array);
  });

  // ... more tests
});
```

**Test Coverage:**
- All API endpoints
- All database operations
- All cache operations
- All queue operations
- All external service integrations

**Verification:**
```bash
npm run test:integration
```

---

### Task 6.3: Add E2E Tests for Critical Flows
**Effort:** 4 days

**Implementation:**

**E2E Tests with Playwright:**
```typescript
// e2e/conversation-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Conversation Flow', () => {
  test('should create and send message', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/chat');

    // Create new conversation
    await page.click('[data-testid="new-conversation"]');

    // Send message
    await page.fill('[data-testid="message-input"]', 'Hello, Gnani!');
    await page.click('[data-testid="send-button"]');

    // Verify response
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible();
  });

  test('should edit message', async ({ page }) => {
    // ... test edit flow
  });

  test('should regenerate response', async ({ page }) => {
    // ... test regenerate flow
  });
});
```

**Critical Flows to Test:**
1. Login/Register
2. Create conversation
3. Send message
4. Edit message
5. Regenerate response
6. Delete message
7. Folder organization
8. Advanced search
9. Share conversation
10. Voice mode

**Verification:**
```bash
npm run test:e2e
```

---

### Task 6.4: Performance Profiling and Optimization
**Effort:** 3 days

**Implementation:**

**Frontend Profiling:**
```typescript
// Add performance marks
performance.mark('message-send-start');
await sendMessage(text);
performance.mark('message-send-end');

performance.measure('message-send', 'message-send-start', 'message-send-end');

const measure = performance.getEntriesByName('message-send')[0];
console.log(`Message send took ${measure.duration}ms`);
```

**Backend Profiling:**
```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.perf('Request completed', {
      method: req.method,
      path: req.path,
      duration,
      status: res.statusCode
    });

    if (duration > 1000) {
      logger.warn('Slow request detected', { method: req.method, path: req.path, duration });
    }
  });

  next();
});
```

**Optimization Targets:**
- API response time < 200ms (p95)
- LLM first token < 500ms
- Page load < 2s
- Bundle size < 500KB (gzipped)
- Memory usage < 200MB (frontend)
- Memory usage < 500MB (backend)

**Verification:**
- Run Lighthouse audit (score > 90)
- Use Chrome DevTools Performance tab
- Monitor production metrics

---

### Task 6.5: Bundle Size Optimization
**Effort:** 2 days

**Implementation:**

**Analyze Bundle:**
```bash
npm run build
npx vite-bundle-visualizer
```

**Optimizations:**
1. Code splitting by route
2. Lazy load heavy components
3. Tree-shake unused code
4. Compress images
5. Use dynamic imports

**Example:**
```typescript
// Before
import { HeavyComponent } from './HeavyComponent';

// After
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

**Targets:**
- Main bundle < 200KB
- Vendor bundle < 300KB
- Total (gzipped) < 500KB

**Verification:**
```bash
npm run build
ls -lh dist/assets/*.js
```

---

### Task 6.6: Memory Usage Optimization
**Effort:** 2 days

**Implementation:**

**Frontend:**
- Fix memory leaks (event listeners, timers)
- Implement virtual scrolling for long lists
- Clear unused data from stores
- Optimize image loading

**Backend:**
- Implement streaming for large responses
- Clear old cache entries
- Optimize database queries
- Use connection pooling

**Monitoring:**
```typescript
// Frontend
setInterval(() => {
  if (performance.memory) {
    console.log('Memory:', {
      used: performance.memory.usedJSHeapSize / 1024 / 1024,
      total: performance.memory.totalJSHeapSize / 1024 / 1024,
      limit: performance.memory.jsHeapSizeLimit / 1024 / 1024
    });
  }
}, 60000);

// Backend
setInterval(() => {
  const usage = process.memoryUsage();
  logger.info('Memory usage', {
    rss: usage.rss / 1024 / 1024,
    heapUsed: usage.heapUsed / 1024 / 1024,
    heapTotal: usage.heapTotal / 1024 / 1024
  });
}, 60000);
```

**Verification:**
- Run app for 24 hours
- Monitor memory usage
- Verify no memory leaks
- Check memory stays under limits

---

### Task 6.7: Database Query Optimization
**Effort:** 2 days

**Implementation:**

**Add Indexes:**
```typescript
// Ensure indexes exist
await Message.collection.createIndex({ conversationId: 1, timestamp: 1 });
await Conversation.collection.createIndex({ userId: 1, updatedAt: -1 });
await Memory.collection.createIndex({ userId: 1, timestamp: -1 });
```

**Optimize Queries:**
```typescript
// Before
const messages = await Message.find({ conversationId }).lean();

// After (with projection)
const messages = await Message.find({ conversationId })
  .select('_id role content timestamp')
  .lean();

// Use aggregation for complex queries
const stats = await Message.aggregate([
  { $match: { conversationId } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
```

**Verification:**
- Use MongoDB explain() to analyze queries
- Monitor slow query log
- Check query execution time < 100ms

---

### Task 6.8: API Response Time Optimization
**Effort:** 2 days

**Implementation:**

**Optimizations:**
1. Add caching headers
2. Enable compression
3. Optimize database queries
4. Use connection pooling
5. Implement request batching

**Example:**
```typescript
// Add caching headers
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  next();
});

// Enable compression
import compression from 'compression';
app.use(compression());
```

**Targets:**
- GET requests < 100ms (p95)
- POST requests < 200ms (p95)
- LLM streaming first token < 500ms

**Verification:**
- Use Apache Bench for load testing
- Monitor response times in production
- Check Prometheus metrics

---

### Task 6.9: Add Performance Benchmarks
**Effort:** 2 days

**Implementation:**

**Benchmark Suite:**
```typescript
// benchmarks/conversation.bench.ts
import { bench, describe } from 'vitest';

describe('Conversation Operations', () => {
  bench('create conversation', async () => {
    await conversationService.create(userId, 'Test');
  });

  bench('fetch 100 conversations', async () => {
    await conversationService.getConversations(userId, { limit: 100 });
  });

  bench('add message to conversation', async () => {
    await conversationService.addMessage(conversationId, {
      role: 'user',
      content: 'Test message'
    });
  });
});
```

**Run Benchmarks:**
```bash
npm run test:benchmark
```

**Targets:**
- Create conversation < 50ms
- Fetch conversations < 100ms
- Add message < 30ms
- Search < 200ms

**Verification:**
- Run benchmarks before/after optimizations
- Track performance over time
- Set up CI to run benchmarks

---

### Task 6.10: Complete Documentation
**Effort:** 3 days

**Implementation:**

**API Documentation:**
```typescript
/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 */
```

**Architecture Documentation:**
```markdown
# Architecture Overview

## System Components

### Frontend (React + Electron)
- React 19 with TypeScript
- Zustand for state management
- TailwindCSS for styling
- Electron for desktop app

### Backend (Node.js)
- Express 5 for REST API
- gRPC for real-time streaming
- MongoDB for data storage
- Redis for caching
- BullMQ for job queues

### AI Pipeline
- Whisper.cpp for STT
- Ollama/LocalAI for LLM
- ChromaDB for vector storage
- Silero VAD for voice detection

## Data Flow
1. User speaks → VAD detects speech
2. Audio sent to Whisper.cpp → Text
3. Text sent to LLM → Response
4. Response sent to TTS → Audio
5. Audio played to user

## State Machine
[Include XState diagram]
```

**User Documentation:**
```markdown
# User Guide

## Getting Started
1. Install Gnani
2. Create account
3. Start conversation

## Features
- Voice mode
- Text mode
- Folder organization
- Advanced search
- Conversation sharing

## Keyboard Shortcuts
- Cmd+Shift+Space: Activate mic
- Cmd+K: Search
- Cmd+N: New conversation
```

**Deployment Guide:**
```markdown
# Deployment Guide

## Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+
- Whisper.cpp binary

## Environment Variables
[List all required env vars]

## Deployment Steps
1. Clone repository
2. Install dependencies
3. Configure environment
4. Build application
5. Start services
6. Verify health checks
```

**Verification:**
- All APIs documented in Swagger
- Architecture diagrams created
- User guide complete
- Deployment guide tested

---

## ✅ STAGE 6 VERIFICATION CHECKLIST

### Testing
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] All critical flows tested

### Performance
- [ ] API response time < 200ms (p95)
- [ ] Bundle size < 500KB (gzipped)
- [ ] Memory usage stable
- [ ] No memory leaks

### Optimization
- [ ] Database queries optimized
- [ ] Indexes created
- [ ] Caching implemented
- [ ] Compression enabled

### Documentation
- [ ] API docs complete
- [ ] Architecture docs complete
- [ ] User guide complete
- [ ] Deployment guide complete

### Production Readiness
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Alerts set up

---

## 🎯 FINAL VERIFICATION

### Pre-Production Checklist
- [ ] All 6 stages completed
- [ ] All tests passing (80%+ coverage)
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Monitoring dashboards working
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Launch Criteria
- [ ] No critical bugs
- [ ] No high-priority bugs
- [ ] Performance targets met
- [ ] User acceptance testing passed
- [ ] Load testing passed
- [ ] Security testing passed

---

**END OF STAGE 6**

---

**🎉 PHASE 4 IMPROVEMENT COMPLETE!**

All missing integrations implemented, all critical fixes applied, architecture improved, advanced features added, and production-ready quality achieved.
