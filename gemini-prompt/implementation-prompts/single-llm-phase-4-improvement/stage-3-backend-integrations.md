# STAGE 3: BACKEND SERVICE INTEGRATIONS

**Duration:** 2 weeks  
**Priority:** HIGH  
**Dependencies:** Stage 1

---

## 🎯 OBJECTIVE

Integrate all backend services that are implemented but not connected to the main application flow. Enable multi-step planning, hybrid search, session replay, and other advanced backend features.

---

## 📋 TASKS

### Task 3.1: Integrate Multi-step Planner into LLM Flow
**Files:** `llm.service.ts`, `multi-step-planner.service.ts`  
**Effort:** 2 days

**Implementation:**
- Detect when user query requires multiple steps
- Use planner to break down complex tasks
- Execute steps sequentially with LLM
- Track progress and dependencies
- Return structured results

**Verification:**
- Test with complex query: "Research topic X and create summary"
- Verify planner breaks into steps
- Check each step executes correctly

---

### Task 3.2: Connect Hybrid Search to Search Endpoints
**Files:** `hybrid-search.service.ts`, `search.routes.ts`  
**Effort:** 1 day

**Implementation:**
- Add hybrid search endpoint
- Combine BM25 + vector search results
- Implement result reranking
- Add relevance scoring

**Verification:**
- Search for "authentication" - should find related terms
- Compare with basic search results
- Verify semantic matches

---

### Task 3.3: Implement Session Replay UI
**Files:** NEW `SessionReplayViewer.tsx`, `session-replay.service.ts`  
**Effort:** 2 days

**Implementation:**
- Create replay viewer component
- Fetch session data from backend
- Display timeline of events
- Add playback controls
- Show state transitions

**Verification:**
- Record a session
- Open replay viewer
- Verify all events shown
- Test playback controls

---

### Task 3.4: Plugin System - Implement or Remove
**Decision:** Remove plugin UI for now  
**Effort:** 4 hours

**Implementation:**
- Remove `PluginMarketplace.tsx`
- Remove `PluginCard.tsx`
- Remove `PluginPermissionDialog.tsx`
- Remove plugin routes
- Clean up imports

**Verification:**
- App builds without errors
- No broken imports
- No dead code warnings

---

### Task 3.5: Implement LLM Provider Failover
**Files:** `llm.manager.ts`, `llm.service.ts`  
**Effort:** 1 day

**Implementation:**
```typescript
class LLMManager {
  private providers: LLMProvider[] = [];
  private currentProviderIndex = 0;

  async generateWithFailover(prompt: string) {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const provider = this.providers[this.currentProviderIndex];
        const response = await provider.generate(prompt);
        return response;
      } catch (error) {
        logger.warn(`Provider ${this.currentProviderIndex} failed, trying next`);
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;

        if (i === this.providers.length - 1) {
          throw new Error('All LLM providers failed');
        }
      }
    }
  }
}
```

**Verification:**
- Stop primary LLM provider
- Send request
- Verify failover to secondary
- Check logs for failover message

---

### Task 3.6: Add Tool Execution Timeout
**Files:** `tool.service.ts`, `parallel-executor.service.ts`  
**Effort:** 4 hours

**Implementation:**
```typescript
async executeTool(tool: Tool, params: any, timeout: number = 30000) {
  return Promise.race([
    tool.execute(params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
    )
  ]);
}
```

**Verification:**
- Create slow tool (sleeps 40s)
- Set timeout to 30s
- Verify timeout error
- Check tool is cancelled

---

### Task 3.7: Implement Memory Pruning with Importance Scoring
**Files:** `long-term-memory.service.ts`, NEW `memory-scorer.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class MemoryScorer {
  scoreMemory(memory: Memory): number {
    let score = 0;

    // Recency (0-30 points)
    const ageInDays = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - ageInDays);

    // Frequency (0-30 points)
    score += Math.min(30, memory.accessCount * 3);

    // Relevance (0-40 points)
    score += memory.relevanceScore * 40;

    return score;
  }

  async pruneMemories(userId: string, maxMemories: number = 1000) {
    const memories = await Memory.find({ userId });

    if (memories.length <= maxMemories) return;

    // Score all memories
    const scored = memories.map(m => ({
      memory: m,
      score: this.scoreMemory(m)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Keep top N, delete rest
    const toDelete = scored.slice(maxMemories).map(s => s.memory._id);
    await Memory.deleteMany({ _id: { $in: toDelete } });

    logger.info(`Pruned ${toDelete.length} low-importance memories`);
  }
}
```

**Verification:**
- Create 1500 memories
- Run pruning (max 1000)
- Verify 500 deleted
- Check high-importance memories kept

---

### Task 3.8: Add Analytics Data Retention Policies
**Files:** `analytics.service.ts`, NEW `analytics-cleanup.job.ts`  
**Effort:** 1 day

**Implementation:**
```typescript
// analytics-cleanup.job.ts
import cron from 'node-cron';

export const analyticsCleanupJob = {
  start: () => {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      const retentionDays = 90; // Keep 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete old events
      const result = await AnalyticsEvent.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info(`Deleted ${result.deletedCount} old analytics events`);

      // Aggregate old data before deletion
      await aggregateOldData(cutoffDate);
    });
  }
};
```

**Verification:**
- Create events older than 90 days
- Run cleanup job
- Verify old events deleted
- Check aggregated data preserved

---

### Task 3.9: Implement Request Deduplication
**Files:** `api/client.ts` (already done in Stage 1)  
**Status:** ✅ Completed in Stage 1, Task 1.2

---

### Task 3.10: Add Proper Error Recovery for All Services
**Files:** All service files  
**Effort:** 2 days

**Implementation:**
- Add try-catch to all async operations
- Implement retry logic for transient failures
- Add circuit breakers for external services
- Log all errors with context
- Return user-friendly error messages

**Pattern:**
```typescript
async function serviceMethod() {
  try {
    // Operation
  } catch (error) {
    logger.error('Service operation failed', {
      error: error.message,
      stack: error.stack,
      context: { /* relevant data */ }
    });

    // Retry if transient
    if (isTransientError(error)) {
      return retry(serviceMethod, { maxAttempts: 3 });
    }

    // Throw user-friendly error
    throw new ServiceError('Operation failed', { cause: error });
  }
}
```

**Verification:**
- Trigger various error conditions
- Verify errors logged properly
- Check retry logic works
- Verify user sees friendly messages

---

## ✅ STAGE 3 VERIFICATION CHECKLIST

### Unit Tests
- [ ] Multi-step planner tests
- [ ] Hybrid search tests
- [ ] Memory scoring tests
- [ ] Tool timeout tests
- [ ] Provider failover tests

### Integration Tests
- [ ] End-to-end multi-step planning
- [ ] Hybrid search with real data
- [ ] Session replay playback
- [ ] Memory pruning job
- [ ] Analytics cleanup job

### Manual Testing
- [ ] Complex query uses planner
- [ ] Hybrid search finds relevant results
- [ ] Session replay shows all events
- [ ] Provider failover works
- [ ] Tool timeout cancels execution

---

**END OF STAGE 3**
