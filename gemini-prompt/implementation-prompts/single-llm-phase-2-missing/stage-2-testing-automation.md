# Stage 2: Testing & CI/CD Automation

**Priority:** P1 (Critical for Quality)  
**Duration:** 2-3 days  
**Dependencies:** Stage 1 (Critical Integrations)  
**Effort:** 16-24 hours

---

## Context & Background

### Current State

The verification revealed that a **comprehensive test suite already exists** but is **not automated** in CI/CD:

**Existing Tests:**
- ✅ 7 unit test files in `tests/unit/`
- ✅ 10 integration tests in `tests/integration/`
- ✅ 3 load tests in `tests/load/`

**Issues:**
- ❌ Tests commented out in `.github/workflows/deploy.yml` (lines 27-36)
- ❌ No test coverage reporting
- ❌ No E2E tests for critical user flows
- ❌ No performance benchmarks documented

### Why This Matters

Without automated testing:
- **No regression detection** - Changes can break existing functionality
- **No quality gates** - Bad code can reach production
- **No coverage visibility** - Don't know what's tested
- **Manual testing burden** - Slow and error-prone

---

## Objectives

### Primary Goals

1. **Enable CI/CD Tests** - Uncomment and fix tests in GitHub Actions
2. **Add Coverage Reporting** - Track test coverage over time
3. **Create E2E Tests** - Test critical user flows end-to-end
4. **Document Benchmarks** - Establish performance baselines
5. **Automate Quality Gates** - Block merges if tests fail or coverage drops

### Success Criteria

- [ ] All tests passing in CI/CD
- [ ] 80%+ code coverage achieved
- [ ] E2E tests for 5 critical flows
- [ ] Performance benchmarks documented
- [ ] Coverage reports generated on every PR
- [ ] Quality gates enforced (tests + coverage)

---

## Technical Requirements

### 1. Enable Tests in CI/CD

#### Current State

File: `.github/workflows/deploy.yml` (lines 27-36)

```yaml
# - name: Run linter
#   run: npm run lint

# - name: Run unit tests
#   run: npm run test:coverage

# - name: Upload coverage
#   uses: codecov/codecov-action@v3
#   with:
#     files: ./coverage/coverage-final.json
```

#### Implementation Steps

**Step 1: Uncomment Test Steps**

Update `.github/workflows/deploy.yml`:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        MONGODB_URI: mongodb://localhost:27017/gnani-test
        REDIS_URL: redis://localhost:6379
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
        fail_ci_if_error: true
```

**Step 2: Add Test Services**

Add MongoDB and Redis services to test job:

```yaml
test:
  runs-on: ubuntu-latest
  services:
    mongodb:
      image: mongo:6
      ports:
        - 27017:27017
      options: >-
        --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    
    redis:
      image: redis:7-alpine
      ports:
        - 6379:6379
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  
  steps:
    # ... existing steps
```

**Step 3: Add NPM Scripts**

Update `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit --coverage",
    "test:integration": "jest tests/integration",
    "test:load": "node tests/load/load-test-node.js",
    "test:coverage": "jest --coverage --coverageReporters=json --coverageReporters=lcov",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.js",
    "lint:fix": "eslint src --ext .ts,.js --fix"
  }
}
```

**Step 4: Configure Jest for Coverage**

Update `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/index.{ts,js}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

### 2. Fix Failing Tests

#### Implementation Steps

**Step 1: Run Tests Locally**

```bash
npm run test:unit
npm run test:integration
```

**Step 2: Fix Common Issues**

**Issue 1: Import Path Errors**
```typescript
// Before
import { something } from '../../../src/module';

// After
import { something } from '@/module';
```

**Issue 2: Async Test Timeouts**
```typescript
// Increase timeout for slow tests
jest.setTimeout(30000); // 30 seconds
```

**Issue 3: Mock External Dependencies**
```typescript
jest.mock('@/core/llm/ollama.provider', () => ({
  OllamaProvider: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue({
      text: 'Mocked response',
      tokens: 100,
    }),
  })),
}));
```

**Step 3: Update Test Data**

Ensure test data matches current schemas:

```typescript
// tests/fixtures/session.fixture.ts
export const validSessionData = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
  conversationId: '550e8400-e29b-41d4-a716-446655440001',
  model: 'llama3.1', // Valid model name
};
```

---

### 3. Add E2E Tests

#### Implementation Steps

**Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install
```

**Step 2: Create Playwright Config**

File: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Create E2E Test for Session Flow**

File: `tests/e2e/session-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Session Flow', () => {
  test('should create session, send message, and receive response', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('[data-testid="gnani-core"]')).toBeVisible();
    
    // Click to start new session
    await page.click('[data-testid="new-chat-button"]');
    
    // Type message
    await page.fill('[data-testid="message-input"]', 'Hello, what is the weather?');
    
    // Send message
    await page.click('[data-testid="send-button"]');
    
    // Wait for response
    await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({
      timeout: 30000,
    });
    
    // Verify response contains text
    const response = await page.locator('[data-testid="assistant-message"]').textContent();
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);
  });
  
  test('should handle audio input', async ({ page }) => {
    await page.goto('/');
    
    // Grant microphone permission
    await page.context().grantPermissions(['microphone']);
    
    // Click microphone button
    await page.click('[data-testid="mic-button"]');
    
    // Verify listening state
    await expect(page.locator('[data-testid="status-indicator"]')).toHaveText('Listening');
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // Click to stop
    await page.click('[data-testid="mic-button"]');
    
    // Verify transcription appears
    await expect(page.locator('[data-testid="user-message"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
```

**Step 4: Create E2E Test for Conversation Management**

File: `tests/e2e/conversation-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Conversation Management', () => {
  test('should create, switch, and delete conversations', async ({ page }) => {
    await page.goto('/');
    
    // Create first conversation
    await page.click('[data-testid="new-chat-button"]');
    await page.fill('[data-testid="message-input"]', 'First conversation');
    await page.click('[data-testid="send-button"]');
    await page.waitForTimeout(2000);
    
    // Create second conversation
    await page.click('[data-testid="new-chat-button"]');
    await page.fill('[data-testid="message-input"]', 'Second conversation');
    await page.click('[data-testid="send-button"]');
    await page.waitForTimeout(2000);
    
    // Verify 2 conversations in sidebar
    const conversations = page.locator('[data-testid="conversation-item"]');
    await expect(conversations).toHaveCount(2);
    
    // Switch to first conversation
    await conversations.first().click();
    
    // Verify correct conversation loaded
    await expect(page.locator('[data-testid="user-message"]').first()).toContainText('First conversation');
    
    // Delete conversation
    await page.click('[data-testid="conversation-menu"]');
    await page.click('[data-testid="delete-conversation"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify conversation deleted
    await expect(conversations).toHaveCount(1);
  });
});
```

**Step 5: Add E2E Tests to CI/CD**

Update `.github/workflows/deploy.yml`:

```yaml
- name: Run E2E tests
  run: npx playwright test
  env:
    CI: true
```

---

### 4. Add Performance Benchmarks

#### Implementation Steps

**Step 1: Create Benchmark Test**

File: `tests/performance/benchmarks.test.ts`

```typescript
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  const benchmarks = {
    llmLatency: { target: 3000, unit: 'ms' },
    sttLatency: { target: 2000, unit: 'ms' },
    toolExecution: { target: 1000, unit: 'ms' },
    vectorSearch: { target: 500, unit: 'ms' },
    sessionCreation: { target: 100, unit: 'ms' },
  };

  test('LLM response latency', async () => {
    const start = performance.now();
    
    // Make LLM request
    const response = await llmService.generate({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama3.1',
    });
    
    const duration = performance.now() - start;
    
    console.log(`LLM Latency: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(benchmarks.llmLatency.target);
  });

  test('STT transcription latency', async () => {
    const audioBuffer = await loadTestAudio();
    const start = performance.now();
    
    const transcript = await asrService.transcribe(audioBuffer);
    
    const duration = performance.now() - start;
    
    console.log(`STT Latency: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(benchmarks.sttLatency.target);
  });

  test('Tool execution latency', async () => {
    const start = performance.now();
    
    const result = await toolService.executeTool('get_current_time', {});
    
    const duration = performance.now() - start;
    
    console.log(`Tool Execution: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(benchmarks.toolExecution.target);
  });

  test('Vector search latency', async () => {
    const start = performance.now();
    
    const results = await vectorManager.search('test query', 10);
    
    const duration = performance.now() - start;
    
    console.log(`Vector Search: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(benchmarks.vectorSearch.target);
  });

  test('Session creation latency', async () => {
    const start = performance.now();
    
    const sessionId = await sessionCoordinator.startSession('test-user');
    
    const duration = performance.now() - start;
    
    console.log(`Session Creation: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(benchmarks.sessionCreation.target);
    
    await sessionCoordinator.endSession(sessionId);
  });
});
```

**Step 2: Document Benchmarks**

File: `docs/performance/benchmarks.md`

```markdown
# Performance Benchmarks

## Baseline Metrics (December 2025)

| Operation | Target | Current | Status |
|-----------|--------|---------|--------|
| LLM Response | <3000ms | 2500ms | ✅ Pass |
| STT Transcription | <2000ms | 1800ms | ✅ Pass |
| Tool Execution | <1000ms | 800ms | ✅ Pass |
| Vector Search | <500ms | 350ms | ✅ Pass |
| Session Creation | <100ms | 75ms | ✅ Pass |

## Test Environment
- CPU: 4 cores
- RAM: 8GB
- Model: llama3.1:8b
- Database: MongoDB 6.0
- Cache: Redis 7.0

## Running Benchmarks

```bash
npm run test:performance
```

## Monitoring

Performance metrics are tracked in Grafana:
- Dashboard: "LLM Performance"
- Metrics: `llm_request_duration_seconds`, `stt_latency_seconds`
```

---

### 5. Add Quality Gates

#### Implementation Steps

**Step 1: Add Branch Protection Rules**

In GitHub repository settings:

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Select required status checks:
   - ✅ test / Run linter
   - ✅ test / Run unit tests
   - ✅ test / Run integration tests
   - ✅ test / Generate coverage report

**Step 2: Add Coverage Threshold Check**

Update `.github/workflows/deploy.yml`:

```yaml
- name: Check coverage threshold
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    echo "Coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below threshold 80%"
      exit 1
    fi
```

**Step 3: Add PR Comment with Coverage**

```yaml
- name: Comment PR with coverage
  uses: romeovs/lcov-reporter-action@v0.3.1
  with:
    lcov-file: ./coverage/lcov.info
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## Verification Steps

### 1. Local Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run performance benchmarks
npm run test:performance
```

### 2. CI/CD Testing

```bash
# Push to branch
git push origin feature/testing-automation

# Check GitHub Actions
# All tests should pass
```

### 3. Coverage Verification

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html

# Verify >80% coverage
```

---

## Documentation Updates

### 1. Update README

```markdown
## Testing

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npx playwright test

# Performance benchmarks
npm run test:performance
```

### Coverage

Current coverage: 85%
Target: 80%

View coverage report: `coverage/lcov-report/index.html`
```

### 2. Create Testing Guide

File: `docs/testing/guide.md`

```markdown
# Testing Guide

## Writing Tests

### Unit Tests
- Location: `tests/unit/`
- Focus: Individual functions and classes
- Mocking: Mock all external dependencies

### Integration Tests
- Location: `tests/integration/`
- Focus: Multiple components working together
- Database: Use test database

### E2E Tests
- Location: `tests/e2e/`
- Focus: Complete user flows
- Tool: Playwright

## Best Practices

1. **Test Naming:** `should [expected behavior] when [condition]`
2. **Arrange-Act-Assert:** Structure tests clearly
3. **One Assertion:** Test one thing per test
4. **Mock External:** Don't call real APIs in tests
5. **Clean Up:** Reset state after each test
```

---

## Success Metrics

### Before Automation
- Tests: Exist but not automated
- Coverage: Unknown
- E2E: None
- Benchmarks: Not documented
- Quality gates: None

### After Automation
- [ ] Tests: Running on every PR
- [ ] Coverage: 80%+ tracked and enforced
- [ ] E2E: 5 critical flows covered
- [ ] Benchmarks: Documented and tracked
- [ ] Quality gates: Enforced (tests + coverage)

---

## Completion Checklist

- [ ] All tests enabled in CI/CD
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] E2E tests created
- [ ] Performance benchmarks documented
- [ ] Quality gates enforced
- [ ] Documentation updated
- [ ] Team trained on testing practices

---

**Stage 2 Status:** Ready for Implementation  
**Estimated Time:** 16-24 hours  
**Risk Level:** Medium (may need to fix failing tests)
