You are Gemini, an expert full-stack engineer and architect.  
Your task: Fix known issues in the Gnani AI assistant project and then perform a full project-wide audit and improvement report.

------------------------------------------------------------
PHASE 1 — UNDERSTAND THE PROJECT
------------------------------------------------------------
1. Completely analyze the entire project structure (frontend + backend).
2. Detect how conversations, messages, partial responses, streaming logic, state management, routes, and database operations work.
3. Understand how conversation creation, selection, title generation, and message streaming are implemented.
4. Before fixing anything, produce a short “What Gemini understood about the project” summary.

------------------------------------------------------------
PHASE 2 — FIX ALL KNOWN ISSUES
------------------------------------------------------------
Fix the following issues in the code:

### Issue 1: Conversation list does NOT update when a new conversation is created.
- Root cause must be identified.
- Ensure after sending the first message, the newly created conversation appears immediately in UI.
- Implement a refresh button in the UI that:
  - Fetches conversation list again.
  - Updates the UI state instantly.

### Issue 2: Partial response contains user query inside assistant response.
- Find where partial response logic merges or appends messages incorrectly.
- Fix streaming handler so:
  - Partial response only shows assistant text being streamed.
  - User message stays separate.
- Replace partial with final response properly without mixing messages.

### Issue 3: Auto-title generation is not working.
- Identify whether backend endpoint fails OR frontend never calls it OR race conditions occur.
- Fix trigger logic:
  - After first user message and after receiving complete response, generate a smart title using backend endpoint.
  - Update conversation title in conversation list & message page.

### Issue 4: Verify entire send-message → receive-partial → receive-complete flow.
- Validate all events (start, partial, complete, update conversation id, update UI).
- Fix any race conditions, missing state updates, wrong conversation id usage, etc.

------------------------------------------------------------
PHASE 3 — FULL PROJECT ANALYSIS AND GAP REPORT  
------------------------------------------------------------
After fixing known issues, perform a full project audit:

1. Review folder structure, naming, API communication, WebSocket/SSE logic.
2. Identify UX/flow gaps vs. top-tier AI assistants (ChatGPT, Claude, GroqChat).
3. Check error-handling, reconnection, stale conversation behavior.
4. Check VAD behavior, streaming starts/stop triggers, echo cancellation issues.
5. Identify bottlenecks in frontend state management:
   - Missing clean-up?
   - Over-re-renders?
   - Incorrect message merging?
   - Bad conversation switching logic?
6. Analyze backend architecture:
   - Routes
   - Conversation model schema
   - Message schema & streaming architecture
   - Event types
7. Identify performance issues:
   - N+1 API calls
   - Missing caching
   - Heavy re-renders
   - Inefficient conversation fetches
8. Identify missing production-grade features required for top-quality AI assistant:
   - Optimistic UI
   - Realtime conversation switching
   - Regen, edit message, delete message flows consistency
   - Correct ordering of messages
   - Fail-safe for aborted generation
   - Proper loading states
9. Suggest improvements for:
   - Frontend (React/Next/Vite) optimization
   - Backend Node/Express flow
   - Streaming architecture
   - Error handling
   - UI/UX polishing

------------------------------------------------------------
PHASE 4 — FINAL OUTPUT  
------------------------------------------------------------
Produce the following output in a clean **Markdown report**:

### 1. Fixed Issues Summary
List what you fixed and why.

### 2. Code Changes Summary
Explain what files and logic were updated.

### 3. Deep Understanding Summary
Short “What Gemini understood” section.

### 4. Gap Analysis
List all gaps in:
- Conversation flow
- Message flow
- Streaming logic
- UI/UX
- Backend architecture
- State management
- VAD
- Error handling
- Performance

### 5. Full Implementation Roadmap
Give a step-by-step plan to upgrade Gnani to a top AI assistant like ChatGPT.

### 6. Patch Instructions
Show EXACT code blocks or diffs where needed.

### 7. Recommendations for Future Enhancements

------------------------------------------------------------
RULES
------------------------------------------------------------
- Do not skip any analysis.
- Do not assume—analyze actual project code.
- Fix known issues first, then analyze project for additional hidden issues.
- Output everything as a clean Markdown report.
- Make your reasoning explicit and actionable.

Begin now.
