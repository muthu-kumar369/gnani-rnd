# STAGE 4: ARCHITECTURE IMPROVEMENTS

**Duration:** 3 weeks  
**Priority:** MEDIUM  
**Dependencies:** Stages 1, 2, 3

---

## 🎯 OBJECTIVE

Refactor architecture for better maintainability, scalability, and debuggability. Migrate complex state management to XState, extract business logic from stores, split large files, and implement proper monitoring.

---

## 📋 TASKS

### Task 4.1: Migrate State Machine to XState
**Files:** `useGnaniUIState.ts` → NEW `gnaniStateMachine.ts`  
**Effort:** 3 days

**Implementation:**
```typescript
import { createMachine, assign } from 'xstate';

export const gnaniMachine = createMachine({
  id: 'gnani',
  initial: 'idle',
  context: {
    isMicActive: false,
    isWakeWordTriggered: false,
    latestSTT: null,
    latestLLM: null,
  },
  states: {
    idle: {
      on: {
        WAKE_WORD_DETECTED: 'wakeWordListening',
        MIC_ACTIVATED: 'micRecording'
      }
    },
    wakeWordListening: {
      on: {
        AUDIO_START: 'streaming',
        TIMEOUT: 'idle'
      }
    },
    micRecording: {
      on: {
        STREAM_CONNECTED: 'streaming',
        MIC_STOPPED: 'idle'
      }
    },
    streaming: {
      on: {
        STT_PARTIAL: { actions: 'updatePartialSTT' },
        STT_FINAL: 'thinking',
        STREAM_ERROR: 'error'
      }
    },
    thinking: {
      on: {
        LLM_CHUNK: { actions: 'updateLLMChunk' },
        TTS_STARTED: 'responding',
        TIMEOUT: 'error'
      }
    },
    responding: {
      on: {
        TTS_ENDED: 'idle',
        BARGE_IN: 'streaming'
      }
    },
    error: {
      on: {
        RESET: 'idle'
      }
    }
  }
});
```

**Verification:**
- Visualize state machine with XState visualizer
- Test all state transitions
- Verify no invalid transitions possible
- Check state history for debugging

---

### Task 4.2: Extract Business Logic from Stores to Services
**Files:** Split `useConversationStore.ts` into multiple files  
**Effort:** 5 days

**New Structure:**
```
src/services/
  ├── conversation/
  │   ├── ConversationService.ts       # API calls
  │   ├── MessageTreeService.ts        # Tree operations
  │   ├── BranchingService.ts          # Branch navigation
  │   └── index.ts
  ├── message/
  │   ├── MessageService.ts
  │   ├── MessageValidation.ts
  │   └── index.ts
  └── index.ts

src/store/
  └── useConversationStore.ts          # State only, delegates to services
```

**Implementation:**
```typescript
// services/conversation/ConversationService.ts
export class ConversationService {
  async fetchConversations(page: number = 1) {
    return apiClient.get('/conversations', { params: { page } });
  }

  async createConversation(systemPrompt?: string) {
    return apiClient.post('/conversations', { systemPrompt });
  }

  async deleteConversation(id: string) {
    return apiClient.delete(`/conversations/${id}`);
  }
}

// store/useConversationStore.ts (simplified)
import { ConversationService } from '../services/conversation';

const conversationService = new ConversationService();

export const useConversationStore = create((set, get) => ({
  conversations: [],

  fetchConversations: async () => {
    const data = await conversationService.fetchConversations();
    set({ conversations: data.conversations });
  },
}));
```

**Verification:**
- All store logic moved to services
- Stores only manage state
- Services are testable in isolation
- No business logic in components

---

### Task 4.3: Split Large Files
**Files:** Split 888-line `useConversationStore.ts`, 415-line `useGnaniUIState.ts`, etc.  
**Effort:** 3 days

**Targets:**
1. `useConversationStore.ts` (888 lines) → 5 files
2. `useGnaniUIState.ts` (415 lines) → 3 files
3. `useIPC.ts` (11,446 bytes) → 6 files
4. `llm.service.ts` (large) → 4 files

**Example Split:**
```
useConversationStore.ts (888 lines)
  ↓
├── stores/conversation/state.ts           # State definition
├── stores/conversation/actions.ts         # Actions
├── stores/conversation/selectors.ts       # Selectors
├── stores/conversation/persistence.ts     # Persistence logic
└── stores/conversation/index.ts           # Main store
```

**Verification:**
- Each file < 300 lines
- Clear separation of concerns
- No circular dependencies
- All imports working

---

### Task 4.4: Implement Cleanup Verification
**Files:** All hooks with useEffect  
**Effort:** 2 days

**Implementation:**
```typescript
// Create cleanup tracker
class CleanupTracker {
  private cleanups = new Map<string, () => void>();

  register(id: string, cleanup: () => void) {
    this.cleanups.set(id, cleanup);
  }

  verify() {
    // Check all cleanups were called
    if (this.cleanups.size > 0) {
      console.warn('Uncleaned resources:', Array.from(this.cleanups.keys()));
    }
  }

  cleanup(id: string) {
    const cleanup = this.cleanups.get(id);
    if (cleanup) {
      cleanup();
      this.cleanups.delete(id);
    }
  }
}

// Use in hooks
useEffect(() => {
  const id = `effect-${Math.random()}`;
  cleanupTracker.register(id, () => {
    // Cleanup logic
  });

  return () => cleanupTracker.cleanup(id);
}, []);
```

**Verification:**
- Run app for 1 hour
- Check cleanup tracker
- Verify no uncleaned resources
- Monitor memory usage

---

### Task 4.5: Add Resource Tracking and Memory Leak Detection
**Files:** NEW `utils/resourceTracker.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class ResourceTracker {
  private resources = new Map<string, any>();

  track(type: string, resource: any) {
    const id = `${type}-${Date.now()}`;
    this.resources.set(id, {
      type,
      resource,
      createdAt: Date.now(),
      stack: new Error().stack
    });
    return id;
  }

  release(id: string) {
    this.resources.delete(id);
  }

  getLeaks() {
    const now = Date.now();
    const leaks = [];

    for (const [id, data] of this.resources) {
      const age = now - data.createdAt;
      if (age > 60000) { // 1 minute
        leaks.push({ id, ...data, age });
      }
    }

    return leaks;
  }
}
```

**Verification:**
- Track all event listeners
- Track all timers
- Track all subscriptions
- Report leaks after 1 hour

---

### Task 4.6: Implement Comprehensive Logging
**Files:** All services  
**Effort:** 2 days

**Implementation:**
```typescript
// Structured logging
logger.info('User action', {
  action: 'message_sent',
  userId: user.id,
  conversationId: conv.id,
  messageLength: message.length,
  timestamp: Date.now()
});

// Performance logging
const start = Date.now();
const result = await operation();
logger.perf('Operation completed', {
  operation: 'llm_generate',
  duration: Date.now() - start,
  success: true
});

// Error logging with context
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { /* all relevant data */ }
  });
}
```

**Verification:**
- All operations logged
- Logs are structured (JSON)
- Logs include context
- Log levels appropriate

---

### Task 4.7: Add Monitoring Dashboards
**Files:** NEW `monitoring/` directory  
**Effort:** 3 days

**Implementation:**
- Prometheus metrics collection
- Grafana dashboards
- Alert rules
- Performance monitoring
- Error rate tracking

**Dashboards:**
1. System Health (CPU, Memory, Disk)
2. API Performance (latency, throughput)
3. LLM Metrics (tokens, cost, latency)
4. Error Rates
5. User Activity

**Verification:**
- Dashboards show real-time data
- Alerts trigger correctly
- Metrics are accurate
- Historical data preserved

---

### Task 4.8: Implement Circuit Breaker for External Services
**Files:** All external API calls  
**Effort:** 2 days

**Implementation:**
```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      setTimeout(() => {
        this.state = 'half-open';
      }, this.timeout);
    }
  }
}
```

**Verification:**
- Trigger 5 failures
- Verify circuit opens
- Wait 1 minute
- Verify circuit half-opens
- Successful call closes circuit

---

### Task 4.9: Add Graceful Degradation
**Files:** All feature modules  
**Effort:** 2 days

**Implementation:**
```typescript
// Feature flags for graceful degradation
const features = {
  advancedSearch: {
    enabled: true,
    fallback: 'basicSearch'
  },
  hybridSearch: {
    enabled: true,
    fallback: 'textSearch'
  },
  vectorMemory: {
    enabled: true,
    fallback: 'simpleMemory'
  }
};

// Use with fallback
async function search(query: string) {
  if (features.hybridSearch.enabled) {
    try {
      return await hybridSearch(query);
    } catch (error) {
      logger.warn('Hybrid search failed, falling back');
      return await textSearch(query);
    }
  }
  return await textSearch(query);
}
```

**Verification:**
- Disable ChromaDB
- Verify app still works (degraded)
- Disable Redis
- Verify app still works
- Check user sees degradation notice

---

### Task 4.10: Implement Proper Error Boundaries
**Files:** All major components  
**Effort:** 1 day

**Implementation:**
```typescript
// Granular error boundaries
<ErrorBoundary name=\"ConversationList\" fallback={<ConversationListError />}>
  <ConversationList />
</ErrorBoundary>

<ErrorBoundary name=\"MessageList\" fallback={<MessageListError />}>
  <MessageList />
</ErrorBoundary>

// Error boundary with recovery
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Component error', {
      component: this.props.name,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <p>Something went wrong</p>
          <button onClick={this.retry}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Verification:**
- Trigger error in component
- Verify error boundary catches
- Verify fallback UI shows
- Test retry functionality
- Check error logged

---

## ✅ STAGE 4 VERIFICATION CHECKLIST

### Architecture
- [ ] XState machine visualized
- [ ] Services separated from stores
- [ ] All files < 300 lines
- [ ] No circular dependencies

### Monitoring
- [ ] Dashboards showing metrics
- [ ] Alerts configured
- [ ] Logs structured
- [ ] Performance tracked

### Reliability
- [ ] Circuit breakers working
- [ ] Graceful degradation tested
- [ ] Error boundaries catching errors
- [ ] Resource leaks detected

---

**END OF STAGE 4**
