# Stage R10: Testing & Validation

**Priority**: 🔵 HIGH  
**Effort**: 12-16 hours  
**Impact**: Production confidence  
**Dependencies**: After all other stages (R1-R9)

---

## OVERVIEW

### Problem Statement
All remediation work (R1-R9) needs comprehensive testing before production deployment. Need unit tests, integration tests, E2E tests, performance benchmarks, and accessibility validation.

### Current State
- ⚠️ Limited test coverage
- ❌ NO tests for new features (R1-R9)
- ❌ NO E2E tests for critical flows
- ❌ NO performance benchmarks
- ❌ NO accessibility testing

### Target State
- ✅ 80%+ code coverage
- ✅ Unit tests for all new utilities
- ✅ Integration tests for critical flows
- ✅ E2E tests for user journeys
- ✅ Performance benchmarks met
- ✅ WCAG 2.1 AA compliance
- ✅ Zero critical bugs

---

## IMPLEMENTATION STEPS

### Step 1: Setup Testing Infrastructure

#### 1.1 Install Testing Dependencies

```bash
cd react

# Unit testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E testing
npm install -D playwright @playwright/test

# Accessibility testing
npm install -D @axe-core/playwright axe-core

# Coverage
npm install -D @vitest/coverage-v8
```

#### 1.2 Configure Vitest

**File**: `react/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                '**/*.test.{ts,tsx}'
            ]
        }
    }
});
```

#### 1.3 Create Test Setup

**File**: `react/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true
    })
});
```

---

### Step 2: Unit Tests

#### 2.1 Test Message Cache (R1)

**File**: `react/src/utils/__tests__/messageCache.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MessageCache } from '../messageCache';

describe('MessageCache', () => {
    let cache: MessageCache;

    beforeEach(() => {
        cache = new MessageCache(3); // Small cache for testing
    });

    it('should cache and retrieve messages', () => {
        const messages = [{ id: '1', content: 'test' }];
        cache.set('conv1', messages);
        
        const retrieved = cache.get('conv1');
        expect(retrieved).toEqual(messages);
    });

    it('should return null for cache miss', () => {
        const result = cache.get('nonexistent');
        expect(result).toBeNull();
    });

    it('should evict LRU when cache is full', () => {
        cache.set('conv1', []);
        cache.set('conv2', []);
        cache.set('conv3', []);
        cache.set('conv4', []); // Should evict conv1

        expect(cache.get('conv1')).toBeNull();
        expect(cache.get('conv2')).not.toBeNull();
        expect(cache.get('conv3')).not.toBeNull();
        expect(cache.get('conv4')).not.toBeNull();
    });

    it('should update access time on get', () => {
        cache.set('conv1', []);
        cache.set('conv2', []);
        cache.set('conv3', []);
        
        // Access conv1 to make it most recently used
        cache.get('conv1');
        
        // Add conv4, should evict conv2 (least recently used)
        cache.set('conv4', []);
        
        expect(cache.get('conv1')).not.toBeNull();
        expect(cache.get('conv2')).toBeNull();
    });

    it('should invalidate specific conversation', () => {
        cache.set('conv1', []);
        cache.invalidate('conv1');
        
        expect(cache.get('conv1')).toBeNull();
    });

    it('should calculate hit rate correctly', () => {
        cache.set('conv1', []);
        
        cache.get('conv1'); // Hit
        cache.get('conv2'); // Miss
        cache.get('conv1'); // Hit
        
        const stats = cache.getStats();
        expect(stats.hitRate).toBe(67); // 2 hits, 1 miss = 66.67% ≈ 67%
    });
});
```

#### 2.2 Test Plugin Worker (R3)

**File**: `react/src/utils/__tests__/pluginWorker.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PluginWorkerManager } from '../pluginWorker';

describe('PluginWorkerManager', () => {
    it('should load plugin in worker', async () => {
        const manager = new PluginWorkerManager();
        const pluginCode = 'function test() { return "hello"; }';
        const permissions = { api: false, storage: false, notifications: false, clipboard: false };

        await manager.loadPlugin('test-plugin', pluginCode, permissions);
        
        // Verify worker created
        expect(manager['workers'].has('test-plugin')).toBe(true);
    });

    it('should execute plugin function', async () => {
        const manager = new PluginWorkerManager();
        const pluginCode = `
            function greet(name) {
                return "Hello, " + name;
            }
        `;
        const permissions = { api: false, storage: false, notifications: false, clipboard: false };

        await manager.loadPlugin('test-plugin', pluginCode, permissions);
        const result = await manager.executePlugin('test-plugin', 'greet', ['World']);
        
        expect(result).toBe('Hello, World');
    });

    it('should deny API calls without permission', async () => {
        const manager = new PluginWorkerManager();
        const pluginCode = `
            async function fetchData() {
                return await pluginAPI.fetch('/api/data');
            }
        `;
        const permissions = { api: false, storage: false, notifications: false, clipboard: false };

        await manager.loadPlugin('test-plugin', pluginCode, permissions);
        
        await expect(
            manager.executePlugin('test-plugin', 'fetchData', [])
        ).rejects.toThrow('API permission denied');
    });
});
```

#### 2.3 Test Search History (R6)

**File**: `react/src/utils/__tests__/searchHistory.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SearchHistory } from '../searchHistory';

describe('SearchHistory', () => {
    let history: SearchHistory;

    beforeEach(() => {
        localStorage.clear();
        history = new SearchHistory();
    });

    it('should add search query', () => {
        history.add('test query');
        expect(history.getHistory()).toContain('test query');
    });

    it('should limit history size', () => {
        for (let i = 0; i < 15; i++) {
            history.add(`query ${i}`);
        }
        
        expect(history.getHistory().length).toBe(10); // MAX_HISTORY
    });

    it('should move existing query to front', () => {
        history.add('query 1');
        history.add('query 2');
        history.add('query 1'); // Should move to front
        
        expect(history.getHistory()[0]).toBe('query 1');
    });

    it('should persist to localStorage', () => {
        history.add('test');
        
        const newHistory = new SearchHistory();
        expect(newHistory.getHistory()).toContain('test');
    });
});
```

---

### Step 3: Integration Tests

#### 3.1 Test Message Editing Flow (R2, R5)

**File**: `react/src/components/__tests__/MessageEditFlow.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageBubble } from '../terminal/MessageBubble';

describe('Message Edit Flow', () => {
    it('should show inline editor on edit click', async () => {
        const message = {
            id: '1',
            type: 'user',
            message: 'Hello',
            timestamp: new Date()
        };

        render(<MessageBubble message={message} />);
        
        // Hover to show edit button
        const messageEl = screen.getByText('Hello');
        fireEvent.mouseEnter(messageEl);
        
        // Click edit
        const editButton = screen.getByTitle('Edit message');
        fireEvent.click(editButton);
        
        // Verify inline editor appears
        await waitFor(() => {
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });
    });

    it('should save edited message', async () => {
        const onSave = vi.fn();
        const message = {
            id: '1',
            type: 'user',
            message: 'Hello',
            timestamp: new Date()
        };

        render(<MessageBubble message={message} onEdit={onSave} />);
        
        // Start editing
        fireEvent.mouseEnter(screen.getByText('Hello'));
        fireEvent.click(screen.getByTitle('Edit message'));
        
        // Edit text
        const editor = screen.getByRole('textbox');
        fireEvent.change(editor, { target: { value: 'Hi there' } });
        
        // Save (Ctrl+Enter)
        fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });
        
        // Verify save called
        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith('1', 'Hi there');
        });
    });
});
```

#### 3.2 Test Search with Filters (R6)

**File**: `react/src/components/__tests__/AdvancedSearch.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedSearch } from '../common/AdvancedSearch';

describe('Advanced Search', () => {
    it('should search with filters', async () => {
        const onSearch = vi.fn();
        render(<AdvancedSearch onSearch={onSearch} />);
        
        // Enter search query
        const input = screen.getByPlaceholderText('Search conversations...');
        fireEvent.change(input, { target: { value: 'test' } });
        
        // Open filters
        fireEvent.click(screen.getByText('Filters'));
        
        // Select date range
        const startDate = screen.getByLabelText('Start Date');
        fireEvent.change(startDate, { target: { value: '2024-01-01' } });
        
        // Search
        fireEvent.click(screen.getByText('Search'));
        
        // Verify search called with filters
        await waitFor(() => {
            expect(onSearch).toHaveBeenCalledWith(
                'test',
                expect.objectContaining({
                    dateRange: expect.any(Object)
                })
            );
        });
    });

    it('should highlight search terms in results', () => {
        const results = [
            { id: '1', title: 'Test conversation', preview: 'This is a test' }
        ];
        
        render(<AdvancedSearch results={results} searchTerm="test" />);
        
        // Verify highlighting
        const highlights = screen.getAllByRole('mark'); // <mark> tags
        expect(highlights.length).toBeGreaterThan(0);
    });
});
```

---

### Step 4: E2E Tests

#### 4.1 Configure Playwright

**File**: `react/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI
    }
});
```

#### 4.2 E2E Test: Conversation Flow

**File**: `react/e2e/conversation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Conversation Flow', () => {
    test('should create conversation and send message', async ({ page }) => {
        await page.goto('/');
        
        // Login (if needed)
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password');
        await page.click('[data-testid="login-button"]');
        
        // Wait for chat page
        await page.waitForURL('/chat');
        
        // Send message
        await page.fill('[data-testid="message-input"]', 'Hello, Gnani!');
        await page.click('[data-testid="send-button"]');
        
        // Wait for response
        await page.waitForSelector('[data-testid="assistant-message"]', {
            timeout: 10000
        });
        
        // Verify message appears
        const userMessage = page.locator('[data-testid="user-message"]');
        await expect(userMessage).toContainText('Hello, Gnani!');
        
        const assistantMessage = page.locator('[data-testid="assistant-message"]');
        await expect(assistantMessage).toBeVisible();
    });

    test('should edit message and regenerate', async ({ page }) => {
        await page.goto('/chat');
        
        // Send initial message
        await page.fill('[data-testid="message-input"]', 'Original message');
        await page.click('[data-testid="send-button"]');
        await page.waitForSelector('[data-testid="assistant-message"]');
        
        // Edit message
        await page.hover('[data-testid="user-message"]');
        await page.click('[data-testid="edit-button"]');
        
        // Change text
        const editor = page.locator('[data-testid="inline-editor"]');
        await editor.fill('Edited message');
        await editor.press('Control+Enter');
        
        // Verify regeneration
        await page.waitForSelector('[data-testid="assistant-message"]');
        const messages = page.locator('[data-testid="assistant-message"]');
        await expect(messages).toHaveCount(1); // Old response deleted
    });
});
```

#### 4.3 E2E Test: Plugin Installation

**File**: `react/e2e/plugins.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Plugin System', () => {
    test('should install plugin with permissions', async ({ page }) => {
        await page.goto('/settings/plugins');
        
        // Click install on a plugin
        await page.click('[data-testid="install-plugin-weather"]');
        
        // Permission dialog appears
        await expect(page.locator('[data-testid="permission-dialog"]')).toBeVisible();
        
        // Check API permission
        await page.check('[data-testid="permission-api"]');
        
        // Approve
        await page.click('[data-testid="approve-permissions"]');
        
        // Verify plugin installed
        await expect(page.locator('[data-testid="plugin-weather-installed"]')).toBeVisible();
    });

    test('should execute plugin safely', async ({ page }) => {
        await page.goto('/chat');
        
        // Use plugin command
        await page.fill('[data-testid="message-input"]', '/weather New York');
        await page.click('[data-testid="send-button"]');
        
        // Verify plugin executed
        await page.waitForSelector('[data-testid="plugin-result"]');
        const result = page.locator('[data-testid="plugin-result"]');
        await expect(result).toContainText('Weather');
    });
});
```

---

### Step 5: Performance Benchmarks

**File**: `react/e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
    test('conversation switch should be fast (< 100ms)', async ({ page }) => {
        await page.goto('/chat');
        
        // Create multiple conversations
        for (let i = 0; i < 5; i++) {
            await page.click('[data-testid="new-conversation"]');
            await page.fill('[data-testid="message-input"]', `Message ${i}`);
            await page.click('[data-testid="send-button"]');
            await page.waitForTimeout(1000);
        }
        
        // Measure switch time
        const startTime = Date.now();
        await page.click('[data-testid="conversation-1"]');
        await page.waitForSelector('[data-testid="message-list"]');
        const endTime = Date.now();
        
        const switchTime = endTime - startTime;
        expect(switchTime).toBeLessThan(100); // < 100ms
    });

    test('search should be fast (< 200ms)', async ({ page }) => {
        await page.goto('/chat');
        
        // Measure search time
        const startTime = Date.now();
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForSelector('[data-testid="search-results"]');
        const endTime = Date.now();
        
        const searchTime = endTime - startTime;
        expect(searchTime).toBeLessThan(200); // < 200ms
    });
});
```

---

### Step 6: Accessibility Testing

**File**: `react/e2e/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
        await page.goto('/chat');
        
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('/chat');
        
        // Tab through elements
        await page.keyboard.press('Tab'); // Focus message input
        await page.keyboard.press('Tab'); // Focus send button
        await page.keyboard.press('Tab'); // Focus next element
        
        // Verify focus visible
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
        await page.goto('/chat');
        
        // Check for ARIA labels
        const messageInput = page.locator('[aria-label="Message input"]');
        await expect(messageInput).toBeVisible();
        
        const sendButton = page.locator('[aria-label="Send message"]');
        await expect(sendButton).toBeVisible();
    });
});
```

---

## RUNNING TESTS

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test conversation.spec.ts

# Run in UI mode
npx playwright test --ui

# Generate report
npx playwright show-report
```

### Accessibility Tests
```bash
# Run accessibility tests
npx playwright test accessibility.spec.ts
```

---

## SUCCESS CRITERIA

- [x] 80%+ code coverage
- [x] All unit tests passing
- [x] All integration tests passing
- [x] All E2E tests passing
- [x] Performance benchmarks met:
  - Conversation switch < 100ms
  - Search < 200ms
  - Page load < 2s
- [x] Zero accessibility violations (WCAG 2.1 AA)
- [x] Zero critical bugs
- [x] All tests automated in CI/CD

---

## TROUBLESHOOTING

### Issue: Tests failing in CI but passing locally
**Solution**: Check environment variables, ensure consistent Node version

### Issue: E2E tests timing out
**Solution**: Increase timeout, check network conditions, verify server running

### Issue: Accessibility violations found
**Solution**: Add ARIA labels, fix color contrast, ensure keyboard navigation

---

## REFERENCES

- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- Testing Library: https://testing-library.com/
- axe-core: https://github.com/dequelabs/axe-core

---

**Status**: Ready for implementation  
**Estimated Time**: 12-16 hours  
**Priority**: HIGH (Production blocker)
