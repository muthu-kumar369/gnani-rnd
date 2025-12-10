# Stage 1.2: Testing Infrastructure

**Duration:** 2 weeks  
**Goal:** Establish comprehensive testing infrastructure for frontend and backend with 70% coverage target

---

## Context

Currently, Gnani has **zero test coverage**, making it risky to refactor or add new features. This stage adds:
- **Frontend:** Vitest + React Testing Library
- **Backend:** Jest + Supertest
- **Integration:** gRPC client tests
- **Target:** 70% code coverage

---

## Objectives

1. Set up Vitest for frontend testing
2. Set up Jest for backend testing
3. Write unit tests for critical components
4. Write integration tests for gRPC
5. Set up code coverage reporting
6. Add CI/CD test automation

---

## Implementation Tasks

### Task 1: Frontend Testing Setup (Vitest)

**File:** `gnani-rnd/react/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**File:** `gnani-rnd/react/src/tests/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron APIs
global.window = global.window || {};
global.window.gnani = {
  wake: {
    startWakeWord: vi.fn(),
    stopWakeWord: vi.fn()
  },
  stream: {
    on: vi.fn(),
    sendAudioFrame: vi.fn(),
    startStream: vi.fn(),
    stopStream: vi.fn(),
    sendText: vi.fn()
  },
  send: vi.fn()
};

global.window.electron = {
  ipcRenderer: {
    on: vi.fn(),
    removeAllListeners: vi.fn()
  }
};
```

**Update `package.json`:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^23.0.0"
  }
}
```

---

### Task 2: Backend Testing Setup (Jest)

**File:** `gnani-rnd-backend/jest.config.js`

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/server.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

**Update `package.json`:**

```json
{
  "scripts": {
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "test:coverage": "NODE_OPTIONS=--experimental-vm-modules jest --coverage"
  },
  "devDependencies": {
    "@jest/globals": "^29.7.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0"
  }
}
```

---

### Task 3: Frontend Unit Tests

**File:** `gnani-rnd/react/src/state/GnaniStateMachine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import GnaniStateMachine from './GnaniStateMachine';

describe('GnaniStateMachine', () => {
  let stateMachine: GnaniStateMachine;
  
  beforeEach(() => {
    stateMachine = new GnaniStateMachine();
  });
  
  it('should initialize in idle state', () => {
    expect(stateMachine.getState()).toBe('idle');
  });
  
  it('should transition from idle to listening on wake-word', () => {
    const result = stateMachine.transition('wake-word-detected');
    expect(result).toBe(true);
    expect(stateMachine.getState()).toBe('listening');
  });
  
  it('should transition from listening to thinking on vad-end', () => {
    stateMachine.transition('wake-word-detected');
    stateMachine.transition('vad-end');
    expect(stateMachine.getState()).toBe('thinking');
  });
  
  it('should transition from thinking to speaking on tts-start', () => {
    stateMachine.transition('wake-word-detected');
    stateMachine.transition('vad-end');
    stateMachine.transition('tts-start');
    expect(stateMachine.getState()).toBe('speaking');
  });
  
  it('should transition from speaking to idle on tts-complete', () => {
    stateMachine.transition('wake-word-detected');
    stateMachine.transition('vad-end');
    stateMachine.transition('tts-start');
    stateMachine.transition('tts-complete');
    expect(stateMachine.getState()).toBe('idle');
  });
  
  it('should reject invalid transitions', () => {
    const result = stateMachine.transition('tts-start'); // Can't start TTS from idle
    expect(result).toBe(false);
    expect(stateMachine.getState()).toBe('idle');
  });
  
  it('should handle barge-in from speaking to listening', () => {
    stateMachine.transition('wake-word-detected');
    stateMachine.transition('vad-end');
    stateMachine.transition('tts-start');
    stateMachine.transition('barge-in');
    expect(stateMachine.getState()).toBe('listening');
  });
  
  it('should emit stateChange events', (done) => {
    stateMachine.on('stateChange', (event) => {
      expect(event.from).toBe('idle');
      expect(event.to).toBe('listening');
      done();
    });
    stateMachine.transition('wake-word-detected');
  });
});
```

**File:** `gnani-rnd/react/src/store/useGnaniStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGnaniStore } from './useGnaniStore';

describe('useGnaniStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useGnaniStore());
    act(() => {
      result.current._init();
    });
  });
  
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useGnaniStore());
    expect(result.current.state).toBe('idle');
    expect(result.current.isIdle).toBe(true);
  });
  
  it('should update state on transition', () => {
    const { result } = renderHook(() => useGnaniStore());
    act(() => {
      result.current.transition('wake-word-detected');
    });
    expect(result.current.state).toBe('listening');
    expect(result.current.isListening).toBe(true);
  });
});
```

**File:** `gnani-rnd/react/src/utils/streamingTTS.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import StreamingTTS from './streamingTTS';

describe('StreamingTTS', () => {
  let tts: StreamingTTS;
  
  beforeEach(() => {
    tts = new StreamingTTS();
    // Mock SpeechSynthesis
    global.window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [])
    } as any;
  });
  
  it('should queue complete sentences', () => {
    tts.setStreamActive(true);
    tts.addTextChunk('Hello');
    tts.addTextChunk(' world');
    tts.addTextChunk('.');
    
    expect(tts.getState().queueLength).toBeGreaterThan(0);
  });
  
  it('should flush buffer on timeout', (done) => {
    tts.setStreamActive(true);
    tts.addTextChunk('Incomplete sentence');
    
    setTimeout(() => {
      expect(tts.getState().queueLength).toBeGreaterThan(0);
      done();
    }, 250);
  });
  
  it('should stop playback', () => {
    tts.setStreamActive(true);
    tts.addTextChunk('Test.');
    tts.stop();
    
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
```

---

### Task 4: Backend Unit Tests

**File:** `gnani-rnd-backend/tests/unit/llm/llm.manager.test.ts`

(Already created in Stage 1.1)

**File:** `gnani-rnd-backend/tests/unit/session/session.manager.test.ts`

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import SessionManager from '../../../src/modules/session/session.manager.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  
  beforeEach(() => {
    sessionManager = new SessionManager();
  });
  
  it('should create a new session', async () => {
    const session = await sessionManager.createSession('user123');
    expect(session.sessionId).toBeDefined();
    expect(session.userId).toBe('user123');
  });
  
  it('should get session by ID', async () => {
    const created = await sessionManager.createSession('user123');
    const retrieved = await sessionManager.getSession(created.sessionId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe(created.sessionId);
  });
  
  it('should process audio chunks', async () => {
    const session = await sessionManager.createSession('user123');
    const audioChunk = Buffer.from('test audio data');
    
    await sessionManager.processAudioChunk(session.sessionId, audioChunk);
    // Verify audio was processed
  });
});
```

**File:** `gnani-rnd-backend/tests/unit/memory/memory.manager.test.ts`

```typescript
describe('MemoryManager', () => {
  it('should store short-term memory', async () => {
    const memory = await memoryManager.storeShortTerm(sessionId, 'test message');
    expect(memory).toBeDefined();
  });
  
  it('should retrieve relevant memories', async () => {
    await memoryManager.storeShortTerm(sessionId, 'I like pizza');
    const memories = await memoryManager.retrieve(sessionId, 'What do I like?');
    expect(memories.length).toBeGreaterThan(0);
  });
});
```

---

### Task 5: Integration Tests

**File:** `gnani-rnd-backend/tests/integration/grpc.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';

describe('gRPC Integration', () => {
  let client: any;
  
  beforeAll(() => {
    const PROTO_PATH = path.join(__dirname, '../../src/proto/audio_stream.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH);
    const proto = grpc.loadPackageDefinition(packageDefinition);
    client = new proto.AudioStreamService('localhost:50051', grpc.credentials.createInsecure());
  });
  
  it('should handle audio stream', (done) => {
    const call = client.audioStream();
    
    call.on('data', (response: any) => {
      expect(response).toBeDefined();
      if (response.stt_result) {
        expect(response.stt_result.text).toBeDefined();
      }
    });
    
    call.on('end', () => {
      done();
    });
    
    // Send test audio
    call.write({ audio_chunk: Buffer.from('test') });
    call.end();
  });
});
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-testing.sh`

```bash
#!/bin/bash

echo "Setting up Testing Infrastructure..."

# Backend setup
cd gnani-rnd-backend
echo "Installing backend test dependencies..."
npm install --save-dev @jest/globals @types/jest jest ts-jest supertest

# Frontend setup
cd ../react
echo "Installing frontend test dependencies..."
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 jsdom

# Create test directories
mkdir -p tests/unit/llm
mkdir -p tests/unit/session
mkdir -p tests/unit/memory
mkdir -p tests/integration

cd ../react
mkdir -p src/tests

echo "Running initial tests..."
cd ../gnani-rnd-backend
npm test

cd ../react
npm test

echo "✅ Testing infrastructure setup complete!"
```

---

## Verification Steps

1. **Run setup script:**
   ```bash
   ./scripts/setup-testing.sh
   ```

2. **Run frontend tests:**
   ```bash
   cd react
   npm test
   npm run test:coverage
   ```

3. **Run backend tests:**
   ```bash
   cd gnani-rnd-backend
   npm test
   npm run test:coverage
   ```

4. **Check coverage reports:**
   - Frontend: `react/coverage/index.html`
   - Backend: `gnani-rnd-backend/coverage/index.html`

---

## Success Criteria

- [ ] Vitest configured for frontend
- [ ] Jest configured for backend
- [ ] State machine tests (100% coverage)
- [ ] Zustand store tests (100% coverage)
- [ ] StreamingTTS tests (80% coverage)
- [ ] LLM Manager tests (100% coverage)
- [ ] Session Manager tests (70% coverage)
- [ ] gRPC integration tests passing
- [ ] Overall coverage >70%
- [ ] All tests passing in CI/CD

---

## Next Stage

After completing this stage, proceed to [Stage 2.1 - Whisper Optimization](./stage-2.1-whisper-optimization.md)
