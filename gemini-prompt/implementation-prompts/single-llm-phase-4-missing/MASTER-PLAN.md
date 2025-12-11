# PHASE 4 MISSING IMPLEMENTATION - MASTER PLAN

**Generated:** December 11, 2025  
**Based on:** Deep Code Verification Report  
**Scope:** Complete remaining 35 tasks from Phase 4 (excluding testing/optimization)

---

## 🎯 OVERVIEW

This plan addresses the **35 missing/incomplete tasks** identified in the code verification. Focus is on **integration** rather than new features - many components exist but aren't connected.

### Current Status
- **Implemented:** 25/60 tasks (42%)
- **Remaining:** 35 tasks (58%)
- **Excluded:** Stage 6 (Testing & Optimization) - per user request

### Key Issues
1. **Integration Gap:** Features built but not connected to UI/flow
2. **API Client:** Created but not used in stores
3. **UI Components:** Built but no routes/navigation
4. **Architecture:** Refactoring not started

---

## 📋 STAGE BREAKDOWN

### **Stage 1: Critical Integration Fixes** (Week 1)
**Priority:** CRITICAL  
**Effort:** 1 week  
**Tasks:** 7

**Objectives:**
1. Integrate API Client into all stores
2. Apply file validation middleware to routes
3. Verify and fix Whisper.cpp empty transcripts
4. Complete cache eviction implementation
5. Enhance health check endpoint
6. Fix remaining VAD/TTS race conditions
7. Complete configuration centralization

**Impact:** HIGH - Fixes critical reliability and performance issues

---

### **Stage 2: UI Integration Completion** (Week 2-3)
**Priority:** HIGH  
**Effort:** 2 weeks  
**Tasks:** 9

**Objectives:**
1. Connect Advanced Search UI with routes
2. Wire up Undo Toast completely
3. Complete Share Modal integration
4. Add Streaming Progress indicators
5. Integrate Timeout Indicator
6. Decide on Terminal View (complete or remove)
7. Add conversation search in sidebar
8. Add sorting options for conversations
9. Implement pagination (conversations & messages)

**Impact:** HIGH - Makes existing features accessible to users

---

### **Stage 3: Backend Service Integration** (Week 4-5)
**Priority:** MEDIUM  
**Effort:** 2 weeks  
**Tasks:** 10

**Objectives:**
1. Integrate Multi-step Planner into LLM flow
2. Connect Hybrid Search to frontend
3. Implement Session Replay UI
4. Complete or remove Plugin System
5. Add LLM provider automatic failover
6. Implement tool execution timeout
7. Add memory pruning with importance scoring
8. Implement analytics data retention
9. Verify request deduplication works
10. Add comprehensive error recovery

**Impact:** MEDIUM - Enhances functionality and reliability

---

### **Stage 4: Architecture Refactoring** (Week 6-8)
**Priority:** MEDIUM  
**Effort:** 3 weeks  
**Tasks:** 9

**Objectives:**
1. Migrate useGnaniUIState to XState
2. Extract business logic from stores to services
3. Split large files (useConversationStore, useIPC, llm.service)
4. Implement cleanup verification
5. Add resource tracking and leak detection
6. Implement comprehensive logging
7. Add monitoring dashboards
8. Implement circuit breakers for all services
9. Add graceful degradation patterns

**Impact:** MEDIUM - Improves maintainability and debugging

---

## 📊 EFFORT ESTIMATION

| Stage | Tasks | Weeks | Priority | Dependencies |
|-------|-------|-------|----------|--------------|
| Stage 1 | 7 | 1 | CRITICAL | None |
| Stage 2 | 9 | 2 | HIGH | Stage 1 |
| Stage 3 | 10 | 2 | MEDIUM | Stage 1 |
| Stage 4 | 9 | 3 | MEDIUM | All previous |
| **TOTAL** | **35** | **8** | - | - |

---

## 🎯 SUCCESS CRITERIA

### Stage 1
- ✅ All stores use API client (no direct fetch)
- ✅ File uploads validated and size-limited
- ✅ Whisper.cpp returns valid transcripts
- ✅ Health check verifies all services

### Stage 2
- ✅ Advanced Search accessible from UI
- ✅ Undo/redo works for all message actions
- ✅ Conversations paginated (20 per page)
- ✅ Share modal fully functional

### Stage 3
- ✅ Multi-step planner used for complex queries
- ✅ Hybrid search integrated in search UI
- ✅ Session replay accessible from UI
- ✅ LLM failover works automatically

### Stage 4
- ✅ State machine uses XState
- ✅ No file over 500 lines
- ✅ Business logic in service layer
- ✅ Circuit breakers protect all external calls

---

## 🚀 QUICK START

1. **Review verification report** to understand gaps
2. **Start with Stage 1** - critical fixes first
3. **Follow prompts sequentially** - each stage builds on previous
4. **Test after each task** - verify integration works
5. **Update task.md** - track progress

---

## 📝 NOTES

- **No new features** - only integration and refactoring
- **Testing excluded** - per user request (no test setup)
- **Focus on integration** - connect existing components
- **Incremental approach** - complete one stage before next

---

## 🔗 RELATED DOCUMENTS

- **Verification Report:** `verification_report.md`
- **Original Plan:** `../single-llm-phase-4-improvement/MASTER-PLAN.md`
- **Analysis Report:** `../../react/GNANI_COMPLETE_ANALYSIS_REPORT.md`
