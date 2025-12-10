# Implementation Prompts - Quick Reference Guide

## How to Use These Prompts

Each stage prompt is a **complete, self-contained implementation guide** that can be given to an LLM (like Claude, ChatGPT, or Gemini) to implement that specific feature.

### Workflow

1. **Select a Stage**: Choose based on priority and dependencies
2. **Read the Prompt**: Understand current state and goals
3. **Copy Entire Prompt**: Give the full markdown file to your LLM
4. **Implement**: Follow the step-by-step instructions
5. **Test**: Use provided testing instructions
6. **Verify**: Check against success criteria
7. **Move to Next Stage**: Repeat process

---

## Stage Priority Matrix

### 🔴 Critical (Do First)
- **Stage 5**: Terminal Primary Interface - Makes chat the default view
- **Stage 15**: Error Boundary - Prevents app crashes
- **Stage 9**: State Refactor - Simplifies architecture

### 🟡 High Priority (Do Second)
- **Stage 1**: Inline Editing - Core UX feature
- **Stage 2**: Regeneration UX - Core UX feature
- **Stage 11**: Message Caching - Major performance boost
- **Stage 6**: Loading States - Polish UX

### 🟢 Medium Priority (Do Third)
- **Stage 3**: Message Branching - Advanced feature
- **Stage 4**: Conversation Search - Usability
- **Stage 7**: Quick Actions - Convenience
- **Stage 8**: Code Splitting - Performance

### 🔵 Low Priority (Do Last)
- **Stage 20-30**: Production features, analytics, advanced features

---

## Dependencies Graph

```
Stage 15 (Error Boundary) ─┐
                           ├─> Stage 5 (Terminal Primary)
Stage 9 (State Refactor) ──┘

Stage 5 ──> Stage 1 (Inline Editing)
         └> Stage 2 (Regeneration)
         └> Stage 6 (Loading States)

Stage 2 ──> Stage 3 (Branching)

Stage 9 ──> Stage 11 (Caching)
         └> Stage 8 (Code Splitting)
```

---

## Estimated Timeline

### Week 1-2: Foundation
- Stage 15: Error Boundary (8h)
- Stage 9: State Refactor (16h)
- Stage 5: Terminal Primary (12h)
- **Total**: 36 hours

### Week 3-4: Core UX
- Stage 1: Inline Editing (6h)
- Stage 2: Regeneration UX (6h)
- Stage 6: Loading States (8h)
- Stage 7: Quick Actions (4h)
- **Total**: 24 hours

### Week 5-6: Performance
- Stage 11: Message Caching (6h)
- Stage 8: Code Splitting (8h)
- Stage 12: Database Optimization (8h)
- Stage 13: Redis Caching (6h)
- **Total**: 28 hours

### Week 7-8: Polish & Production
- Stage 3: Branching (10h)
- Stage 4: Search (8h)
- Stage 16-19: Error Handling (16h)
- **Total**: 34 hours

### Week 9+: Advanced Features
- Stages 20-30 as needed

---

## Success Metrics

After completing critical stages (1-15):

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Page Load | 3-5s | <2s | Chrome DevTools |
| Conversation Switch | 500-2000ms | <100ms | Performance.now() |
| Message Send | Variable | <500ms | Network tab |
| Error Rate | Unknown | <0.1% | Error tracking |
| Cache Hit Rate | 0% | >80% | Cache metrics |
| Bundle Size | Unknown | <500KB | Webpack analyzer |

---

## Testing Checklist

Before marking a stage complete:

- [ ] All code compiles without errors
- [ ] All tests pass (if tests exist)
- [ ] Manual testing completed per instructions
- [ ] Success criteria all met
- [ ] No console errors
- [ ] Performance metrics improved
- [ ] Code reviewed (if team)
- [ ] Documentation updated

---

## Common Issues & Solutions

### Issue: "Too many re-renders"
- **Solution**: Check useEffect dependencies, use useCallback/useMemo
- **Related Stages**: 9, 10

### Issue: "State not persisting"
- **Solution**: Verify Zustand persist configuration
- **Related Stages**: 9

### Issue: "Cache not invalidating"
- **Solution**: Call invalidateCache on mutations
- **Related Stages**: 11

### Issue: "Error boundary not catching errors"
- **Solution**: Ensure async errors use try/catch
- **Related Stages**: 15

---

## LLM Prompt Template

When giving a stage to an LLM, use this template:

```
I'm implementing improvements to the Gnani AI assistant project.

PROJECT CONTEXT:
- Frontend: React + Vite + TypeScript + Zustand
- Backend: Node.js + Express + MongoDB + Redis
- Location: D:\learning\hey\gnani-rnd

TASK:
Please implement the following stage:

[PASTE ENTIRE STAGE MARKDOWN HERE]

REQUIREMENTS:
1. Follow all implementation steps exactly
2. Provide complete, working code
3. Include error handling
4. Add comments for complex logic
5. Ensure code matches existing style

Please start with Step 1 and work through each step systematically.
```

---

## Progress Tracking

Create a checklist to track progress:

```markdown
## Stage Completion Tracker

### Phase 1: Foundation (Week 1-2)
- [ ] Stage 15: Error Boundary
- [ ] Stage 9: State Refactor
- [ ] Stage 5: Terminal Primary

### Phase 2: Core UX (Week 3-4)
- [ ] Stage 1: Inline Editing
- [ ] Stage 2: Regeneration UX
- [ ] Stage 6: Loading States
- [ ] Stage 7: Quick Actions

### Phase 3: Performance (Week 5-6)
- [ ] Stage 11: Message Caching
- [ ] Stage 8: Code Splitting
- [ ] Stage 12: Database Optimization
- [ ] Stage 13: Redis Caching

### Phase 4: Polish (Week 7-8)
- [ ] Stage 3: Branching
- [ ] Stage 4: Search
- [ ] Stage 16-19: Error Handling

### Phase 5: Advanced (Week 9+)
- [ ] Stages 20-30 as needed
```

---

## Getting Help

If stuck on a stage:

1. **Re-read the prompt** - Often the answer is there
2. **Check dependencies** - Ensure prerequisite stages are complete
3. **Review existing code** - Look at similar patterns in codebase
4. **Consult documentation** - React, Zustand, etc.
5. **Ask specific questions** - Provide context and error messages

---

## Contributing New Stages

To add a new stage:

1. Follow the template from existing stages
2. Include all sections (Overview, Steps, Testing, Success Criteria)
3. Provide complete code examples
4. Add to README.md
5. Update dependencies graph
6. Estimate time accurately

---

**Remember**: Each stage is designed to be implemented independently. You don't need to do them all at once. Start with the critical stages and build from there!
