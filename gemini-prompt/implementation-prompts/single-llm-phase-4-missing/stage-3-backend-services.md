# STAGE 3: BACKEND SERVICE INTEGRATION

**Duration:** 2 weeks  
**Priority:** MEDIUM  
**Dependencies:** Stage 1

---

## 🎯 OBJECTIVE

Integrate backend services that exist but aren't used in main flows. Connect advanced features to enhance functionality.

---

## 📋 TASKS

### Task 3.1: Integrate Multi-step Planner into LLM Flow
**Files:**
- `gnani-rnd-backend/src/modules/planner/multi-step-planner.service.ts` (EXISTS - not used)
- `gnani-rnd-backend/src/modules/llm/llm.service.ts`

**Issue:** Planner exists but not used in main LLM flow  
**Effort:** 1 day

**Implementation:**

```typescript
// llm.service.ts
import { multiStepPlanner } from '../planner/multi-step-planner.service.js';

async generateResponse(context: any, options: any) {
  // Detect if query needs planning
  const needsPlanning = this.detectComplexQuery(context.transcript);
  
  if (needsPlanning) {
    logger.info('Complex query detected, using multi-step planner');
    
    // Generate plan
    const plan = await multiStepPlanner.createPlan(context.transcript);
    
    // Execute plan steps
    const results = await multiStepPlanner.executePlan(plan);
    
    // Synthesize final response
    return this.synthesizeFromPlan(results, context);
  }
  
  // Simple query - direct LLM call
  return this.callLLM(context, options);
}

private detectComplexQuery(query: string): boolean {
  const complexIndicators = [
    'first.*then',
    'step by step',
    'multiple',
    'several things',
    'and also',
  ];
  
  return complexIndicators.some(pattern => 
    new RegExp(pattern, 'i').test(query)
  );
}
```

**Verification:**
1. Query: "First search for X, then summarize it" - should use planner
2. Query: "What is X?" - should not use planner
3. Check logs for plan execution
4. Verify multi-step results

---

### Task 3.2: Connect Hybrid Search to Frontend
**Files:**
- `gnani-rnd-backend/src/modules/search/hybrid-search.service.ts` (EXISTS)
- `gnani-rnd/react/src/pages/SearchPage.tsx`

**Issue:** Hybrid search service exists but no frontend connection  
**Effort:** 4 hours

**Implementation:**

```typescript
// SearchPage.tsx
const performSearch = async (query: string, useHybrid: boolean) => {
  const endpoint = useHybrid ? '/search/hybrid' : '/search/basic';
  
  const results = await api.post(endpoint, {
    query,
    filters,
    k: 20
  });
  
  setResults(results);
};

// Add toggle in UI
<label>
  <input
    type="checkbox"
    checked={useHybrid}
    onChange={(e) => setUseHybrid(e.target.checked)}
  />
  Use Hybrid Search (semantic + keyword)
</label>
```

---

### Task 3.3: Implement Session Replay UI
**Files:**
- `gnani-rnd-backend/src/modules/session/session-replay.service.ts` (EXISTS)
- NEW: `gnani-rnd/react/src/pages/SessionReplayPage.tsx`

**Issue:** Session replay backend exists but no UI  
**Effort:** 1 day

**Implementation:**

```typescript
// SessionReplayPage.tsx
export const SessionReplayPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const loadSessions = async () => {
    const data = await api.get('/sessions/replay/list');
    setSessions(data);
  };
  
  const loadSessionDetails = async (sessionId: string) => {
    const data = await api.get(`/sessions/replay/${sessionId}`);
    setSelectedSession(data);
  };
  
  return (
    <div className="session-replay">
      <div className="session-list">
        {sessions.map(session => (
          <div key={session.id} onClick={() => loadSessionDetails(session.id)}>
            {session.timestamp} - {session.userId}
          </div>
        ))}
      </div>
      
      {selectedSession && (
        <div className="session-details">
          <h2>Session Replay</h2>
          <SessionTimeline events={selectedSession.events} />
          <SessionPlayer events={selectedSession.events} />
        </div>
      )}
    </div>
  );
};
```

---

### Task 3.4: Add LLM Provider Automatic Failover
**Files:**
- `gnani-rnd-backend/src/modules/llm/llm.service.ts`

**Issue:** Multi-provider support but no automatic failover  
**Effort:** 4 hours

**Implementation:**

```typescript
// llm.service.ts
private providers = ['ollama', 'localai', 'vllm'];
private currentProviderIndex = 0;

async callLLM(context: any, options: any) {
  let lastError;
  
  for (let i = 0; i < this.providers.length; i++) {
    const provider = this.providers[this.currentProviderIndex];
    
    try {
      logger.info(`Attempting LLM call with ${provider}`);
      const response = await this.callProvider(provider, context, options);
      return response;
    } catch (error) {
      logger.warn(`Provider ${provider} failed`, error);
      lastError = error;
      
      // Try next provider
      this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    }
  }
  
  throw new Error(`All LLM providers failed: ${lastError.message}`);
}
```

---

### Task 3.5: Implement Tool Execution Timeout
**Files:**
- `gnani-rnd-backend/src/modules/tool/tool.service.ts`

**Issue:** Tools can run indefinitely  
**Effort:** 2 hours

**Implementation:**

```typescript
// tool.service.ts
async executeTool(toolName: string, params: any, timeout = 30000) {
  return Promise.race([
    this.runTool(toolName, params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
    )
  ]);
}
```

---

### Task 3.6: Add Memory Pruning with Importance Scoring
**Files:**
- `gnani-rnd-backend/src/modules/memory/services/memory-scorer.service.ts`

**Issue:** Basic memory pruning, no importance scoring  
**Effort:** 1 day

**Implementation:**

```typescript
// memory-scorer.service.ts
calculateImportance(memory: Memory): number {
  let score = 0;
  
  // Recency (0-30 points)
  const ageInDays = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 30 - ageInDays);
  
  // Frequency (0-25 points)
  score += Math.min(25, memory.accessCount * 5);
  
  // Relevance (0-25 points)
  score += memory.relevanceScore || 0;
  
  // User rating (0-20 points)
  score += memory.userRating || 0;
  
  return score;
}

async pruneMemories(userId: string, maxMemories: number) {
  const memories = await this.getAllMemories(userId);
  
  // Score all memories
  const scored = memories.map(m => ({
    ...m,
    importance: this.calculateImportance(m)
  }));
  
  // Sort by importance
  scored.sort((a, b) => b.importance - a.importance);
  
  // Keep top N, delete rest
  const toDelete = scored.slice(maxMemories);
  await this.deleteMemories(toDelete.map(m => m.id));
  
  return toDelete.length;
}
```

---

### Task 3.7: Implement Analytics Data Retention
**Files:**
- `gnani-rnd-backend/src/modules/analytics/analytics.service.ts`
- `gnani-rnd-backend/src/jobs/analytics-cleanup.job.ts`

**Issue:** Analytics data grows indefinitely  
**Effort:** 4 hours

**Implementation:**

```typescript
// analytics-cleanup.job.ts
async cleanup() {
  const retentionDays = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // Aggregate old data before deletion
  await this.aggregateOldData(cutoffDate);
  
  // Delete raw events
  const result = await Analytics.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  logger.info(`Deleted ${result.deletedCount} old analytics events`);
}
```

---

### Task 3.8: Verify Request Deduplication Works
**Files:**
- `gnani-rnd/react/src/api/client.ts`

**Issue:** Deduplication implemented but not verified  
**Effort:** 2 hours

**Implementation:**

Add tests and logging:
```typescript
// client.ts
private dedupeCache = new Map();

async request(config) {
  const key = this.getRequestKey(config);
  
  if (this.dedupeCache.has(key)) {
    logger.debug('Request deduplicated', { url: config.url });
    return this.dedupeCache.get(key);
  }
  
  const promise = this.executeRequest(config);
  this.dedupeCache.set(key, promise);
  
  promise.finally(() => {
    setTimeout(() => this.dedupeCache.delete(key), 1000);
  });
  
  return promise;
}
```

---

### Task 3.9: Add Comprehensive Error Recovery
**Files:**
- All service files

**Issue:** Error handling is basic  
**Effort:** 2 days

**Implementation:**

```typescript
// Add to all services
async executeWithRecovery(fn: Function, fallback?: Function) {
  try {
    return await fn();
  } catch (error) {
    logger.error('Operation failed, attempting recovery', error);
    
    if (fallback) {
      try {
        return await fallback();
      } catch (fallbackError) {
        logger.error('Fallback also failed', fallbackError);
      }
    }
    
    throw error;
  }
}
```

---

### Task 3.10: Complete or Remove Plugin System
**Files:**
- `gnani-rnd-backend/src/modules/plugin/*`
- `gnani-rnd/react/src/components/common/PluginMarketplace.tsx`

**Issue:** Plugin system partially implemented  
**Effort:** 2 days or 2 hours (remove)

**Decision Required:** Keep or remove?

**If Keep:**
- Complete backend plugin execution
- Wire up marketplace UI
- Add plugin installation flow

**If Remove:**
- Delete plugin backend modules
- Delete plugin UI components
- Remove plugin routes

---

## ✅ VERIFICATION CHECKLIST

- [ ] Multi-step planner used for complex queries
- [ ] Hybrid search accessible and working
- [ ] Session replay UI functional
- [ ] LLM failover works automatically
- [ ] Tools timeout after 30s
- [ ] Memory pruning based on importance
- [ ] Analytics data cleaned up after 90 days
- [ ] Request deduplication verified
- [ ] Error recovery tested
- [ ] Plugin system decision made

---

## 🚀 NEXT STEPS

After Stage 3 completion:
→ **Stage 4:** Architecture Refactoring
