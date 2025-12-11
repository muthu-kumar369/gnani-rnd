# STAGE 4: ARCHITECTURE REFACTORING

**Duration:** 3 weeks  
**Priority:** MEDIUM  
**Dependencies:** All previous stages

---

## 🎯 OBJECTIVE

Improve code maintainability, debuggability, and scalability through architectural refactoring. Focus on reducing complexity and improving code organization.

---

## 📋 TASKS

### Task 4.1: Migrate useGnaniUIState to XState ⚡ HIGH IMPACT
**Files:**
- `gnani-rnd/react/src/hooks/useGnaniUIState.ts` (415 lines - complex)
- NEW: `gnani-rnd/react/src/machines/gnaniStateMachine.ts`

**Issue:** Manual state machine is complex and hard to debug  
**Impact:** Difficult to track state transitions, hard to add new states  
**Effort:** 3 days

**Implementation:**

**Step 1:** Install XState
```bash
npm install xstate @xstate/react
```

**Step 2:** Define state machine
```typescript
// machines/gnaniStateMachine.ts
import { createMachine, assign } from 'xstate';

export const gnaniMachine = createMachine({
  id: 'gnani',
  initial: 'idle',
  context: {
    transcript: '',
    response: '',
    error: null
  },
  states: {
    idle: {
      on: {
        WAKE_WORD_DETECTED: 'wakeWordListening',
        MIC_START: 'micRecording'
      }
    },
    wakeWordListening: {
      on: {
        WAKE_WORD_CONFIRMED: 'micRecording',
        TIMEOUT: 'idle'
      }
    },
    micRecording: {
      on: {
        AUDIO_CHUNK: {
          actions: 'processAudio'
        },
        SPEECH_END: 'streaming'
      }
    },
    streaming: {
      on: {
        TRANSCRIPT_RECEIVED: {
          target: 'receivingSTT',
          actions: assign({
            transcript: (_, event) => event.transcript
          })
        }
      }
    },
    receivingSTT: {
      on: {
        TRANSCRIPT_FINAL: 'thinking'
      }
    },
    thinking: {
      invoke: {
        src: 'buildContext',
        onDone: {
          target: 'responding'
        },
        onError: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.data
          })
        }
      }
    },
    responding: {
      on: {
        LLM_CHUNK: {
          actions: 'appendResponse'
        },
        LLM_COMPLETE: 'idle',
        BARGE_IN: 'micRecording'
      }
    },
    error: {
      on: {
        RETRY: 'idle',
        DISMISS: 'idle'
      }
    }
  }
});
```

**Step 3:** Use in component
```typescript
// hooks/useGnaniUIState.ts
import { useMachine } from '@xstate/react';
import { gnaniMachine } from '../machines/gnaniStateMachine';

export const useGnaniUIState = () => {
  const [state, send] = useMachine(gnaniMachine, {
    services: {
      buildContext: async (context) => {
        // Build LLM context
        return await buildContext(context.transcript);
      }
    },
    actions: {
      processAudio: (context, event) => {
        // Handle audio chunk
      },
      appendResponse: assign({
        response: (context, event) => context.response + event.chunk
      })
    }
  });
  
  return {
    currentState: state.value,
    transcript: state.context.transcript,
    response: state.context.response,
    send
  };
};
```

**Benefits:**
- Visual state machine diagram
- Impossible states prevented
- Easy to add new states
- Built-in state history
- Better debugging

**Verification:**
1. All state transitions work
2. XState visualizer shows correct flow
3. No impossible states
4. State history tracked

---

### Task 4.2: Extract Business Logic to Service Layer
**Files:**
- `gnani-rnd/react/src/store/useConversationStore.ts` (888 lines)
- NEW: `gnani-rnd/react/src/services/conversationService.ts`

**Issue:** Business logic in stores makes testing hard  
**Effort:** 2 days

**Implementation:**

**Step 1:** Create service layer
```typescript
// services/conversationService.ts
export class ConversationService {
  constructor(private api: APIClient) {}
  
  async createConversation(title: string, userId: string) {
    const response = await this.api.post('/conversations', {
      title,
      userId
    });
    return response.data;
  }
  
  async sendMessage(conversationId: string, content: string) {
    const response = await this.api.post(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  }
  
  async regenerateMessage(messageId: string) {
    const response = await this.api.post(
      `/conversations/messages/${messageId}/regenerate`
    );
    return response.data;
  }
  
  // ... all business logic here
}

export const conversationService = new ConversationService(api);
```

**Step 2:** Simplify store
```typescript
// store/useConversationStore.ts
import { conversationService } from '../services/conversationService';

const useConversationStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  
  // Store only manages state, delegates to service
  createConversation: async (title: string) => {
    const conversation = await conversationService.createConversation(
      title,
      get().userId
    );
    
    set({ currentConversation: conversation });
  },
  
  sendMessage: async (content: string) => {
    const message = await conversationService.sendMessage(
      get().currentConversation.id,
      content
    );
    
    set({
      messages: [...get().messages, message]
    });
  }
}));
```

**Benefits:**
- Testable business logic
- Reusable across stores
- Clearer separation of concerns

---

### Task 4.3: Split Large Files
**Files:**
- `gnani-rnd/react/src/store/useConversationStore.ts` (888 lines)
- `gnani-rnd/react/src/hooks/useIPC.ts` (11KB)
- `gnani-rnd-backend/src/modules/llm/llm.service.ts` (large)

**Issue:** Files too large, hard to navigate  
**Effort:** 2 days

**Implementation:**

**Split useConversationStore:**
```
store/conversation/
  ├── index.ts (main store)
  ├── conversationSlice.ts (conversation CRUD)
  ├── messageSlice.ts (message operations)
  ├── branchingSlice.ts (branching logic)
  └── types.ts (shared types)
```

**Split useIPC:**
```
hooks/ipc/
  ├── index.ts (main hook)
  ├── useSTTEvents.ts (STT events)
  ├── useLLMEvents.ts (LLM events)
  ├── useTTSEvents.ts (TTS events)
  ├── useWakeWordEvents.ts (wake word)
  └── useVADEvents.ts (VAD events)
```

**Split llm.service:**
```
modules/llm/
  ├── llm.service.ts (orchestrator)
  ├── providers/
  │   ├── ollama.provider.ts
  │   ├── localai.provider.ts
  │   └── vllm.provider.ts
  ├── streaming.service.ts
  └── tool-calling.service.ts
```

**Rule:** No file over 500 lines

---

### Task 4.4: Implement Cleanup Verification
**Files:**
- All components with useEffect

**Issue:** Memory leaks from improper cleanup  
**Effort:** 1 day

**Implementation:**

```typescript
// Add cleanup verification
useEffect(() => {
  const subscription = eventEmitter.on('event', handler);
  
  return () => {
    subscription.unsubscribe();
    
    // Verify cleanup
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if (eventEmitter.listenerCount('event') > 0) {
          console.warn('Event listener not cleaned up!');
        }
      }, 100);
    }
  };
}, []);
```

---

### Task 4.5: Add Resource Tracking
**Files:**
- NEW: `gnani-rnd/react/src/utils/resourceTracker.ts`

**Issue:** No visibility into resource usage  
**Effort:** 1 day

**Implementation:**

```typescript
// utils/resourceTracker.ts
class ResourceTracker {
  private resources = new Map();
  
  track(name: string, resource: any) {
    this.resources.set(name, {
      resource,
      timestamp: Date.now(),
      stack: new Error().stack
    });
  }
  
  release(name: string) {
    this.resources.delete(name);
  }
  
  getLeaks() {
    const now = Date.now();
    const leaks = [];
    
    for (const [name, data] of this.resources) {
      if (now - data.timestamp > 60000) { // 1 minute
        leaks.push({ name, ...data });
      }
    }
    
    return leaks;
  }
}

export const resourceTracker = new ResourceTracker();
```

---

### Task 4.6: Implement Comprehensive Logging
**Files:**
- All services

**Issue:** Inconsistent logging  
**Effort:** 2 days

**Implementation:**

```typescript
// Standardize logging
logger.info('Operation started', {
  operation: 'createConversation',
  userId,
  timestamp: Date.now()
});

logger.error('Operation failed', error, {
  operation: 'createConversation',
  userId,
  duration: Date.now() - startTime
});
```

---

### Task 4.7: Add Monitoring Dashboards
**Files:**
- NEW: `gnani-rnd/react/src/pages/MonitoringPage.tsx`

**Issue:** No visibility into system health  
**Effort:** 2 days

**Implementation:**

```typescript
// MonitoringPage.tsx
export const MonitoringPage = () => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await api.get('/metrics');
      setMetrics(data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h1>System Monitoring</h1>
      <MetricsChart data={metrics} />
      <CircuitBreakerStatus />
      <CacheStats />
      <ErrorRates />
    </div>
  );
};
```

---

### Task 4.8: Implement Circuit Breakers for All Services
**Files:**
- All external service calls

**Issue:** Circuit breaker exists but not used everywhere  
**Effort:** 1 day

**Implementation:**

```typescript
// Wrap all external calls
const result = await apiCircuitBreaker.execute(async () => {
  return await api.get('/external-service');
});
```

---

### Task 4.9: Add Graceful Degradation
**Files:**
- All services

**Issue:** Services fail completely on errors  
**Effort:** 2 days

**Implementation:**

```typescript
// Add fallbacks
async function getRecommendations() {
  try {
    return await mlService.getRecommendations();
  } catch (error) {
    logger.warn('ML recommendations failed, using fallback');
    return getBasicRecommendations();
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] State machine uses XState
- [ ] No file over 500 lines
- [ ] Business logic in service layer
- [ ] Cleanup verified in dev mode
- [ ] Resource tracking active
- [ ] Logging standardized
- [ ] Monitoring dashboard functional
- [ ] Circuit breakers on all external calls
- [ ] Graceful degradation implemented

---

## 🎉 COMPLETION

After Stage 4:
→ **Phase 4 Missing Implementation COMPLETE!**
