# Single-LLM Foundation Implementation Plan

**Overview:** This folder contains detailed implementation prompts for building a production-grade single-LLM version of GNANI over 3 months.

## Implementation Structure

### Month 1: Foundation Hardening (Weeks 1-4)
- **Stage 1.1:** Audio Pipeline Fixes
- **Stage 1.2:** Session Manager Refactoring
- **Stage 1.3:** Unit Testing Infrastructure

### Month 2: Production Features (Weeks 5-8)
- **Stage 2.1:** Error Handling & Recovery
- **Stage 2.2:** Monitoring & Observability
- **Stage 2.3:** Health Checks & Graceful Shutdown

### Month 3: Performance & Polish (Weeks 9-12)
- **Stage 3.1:** Whisper.cpp Integration
- **Stage 3.2:** LLM & Tool Caching
- **Stage 3.3:** Production Deployment & Load Testing

## How to Use These Prompts

1. **Read the Stage Overview** - Understand the goals and deliverables
2. **Review Prerequisites** - Ensure previous stages are complete
3. **Follow Implementation Steps** - Execute in order
4. **Run Setup Scripts** - Use provided shell scripts for system dependencies
5. **Verify Completion** - Check all acceptance criteria

## File Structure

```
single-llm-foundation/
├── README.md (this file)
├── month-1/
│   ├── stage-1.1-audio-pipeline-fixes.md
│   ├── stage-1.2-session-manager-refactoring.md
│   └── stage-1.3-unit-testing.md
├── month-2/
│   ├── stage-2.1-error-handling.md
│   ├── stage-2.2-monitoring.md
│   └── stage-2.3-health-checks.md
├── month-3/
│   ├── stage-3.1-whisper-cpp.md
│   ├── stage-3.2-caching.md
│   └── stage-3.3-production-deployment.md
└── scripts/
    ├── setup-whisper-cpp.sh
    ├── setup-monitoring.sh
    └── setup-testing.sh
```

## Progress Tracking

- [ ] Month 1: Foundation Hardening
  - [ ] Stage 1.1: Audio Pipeline Fixes
  - [ ] Stage 1.2: Session Manager Refactoring
  - [ ] Stage 1.3: Unit Testing Infrastructure
- [ ] Month 2: Production Features
  - [ ] Stage 2.1: Error Handling & Recovery
  - [ ] Stage 2.2: Monitoring & Observability
  - [ ] Stage 2.3: Health Checks & Graceful Shutdown
- [ ] Month 3: Performance & Polish
  - [ ] Stage 3.1: Whisper.cpp Integration
  - [ ] Stage 3.2: LLM & Tool Caching
  - [ ] Stage 3.3: Production Deployment & Load Testing

## Success Criteria

By the end of 3 months, GNANI will have:
- ✅ Stable audio pipeline (no crashes)
- ✅ Modular session management (6 services)
- ✅ 80% test coverage
- ✅ Comprehensive error handling
- ✅ Production monitoring (Grafana dashboards)
- ✅ <100ms STT latency (whisper.cpp)
- ✅ <200ms LLM first token
- ✅ Load tested (100 concurrent users)
- ✅ Production-ready deployment

---

**Start with:** `month-1/stage-1.1-audio-pipeline-fixes.md`
