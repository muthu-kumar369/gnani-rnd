You are an expert full-stack engineer, AI agent systems architect, and senior code reviewer. 
You must fully analyze my entire project directory. The project consists of:

• gnani-rnd-backend  (Node.js, Express, tool layer, reasoning layer, embeddings layer, Redis, Docker, etc)
• gnani-rnd (Frontend: React, Vite, Electron integration)

Your goal: give me a complete system-level and code-level review that identifies:
— architectural issues
— code quality problems
— logic bugs
— missing edge-case handling
— performance issues
— memory issues
— tool layer problems
— integration issues between backend ↔ frontend
— missing error-handling
— poor folder structure
— functions that are too large, unmaintainable, or unnecessary
— any race conditions
— any JWT/session/auth issues
— any security vulnerabilities (XSS, CORS, rate-limit, validation etc.)
— any API or event-flow flaws

Also verify:
— ChromaDB embedding pipeline is correct and not using dummy embeddings.
— The project can run fully in **WSL** and list missing dependencies.
— The backend architecture supports tool-layer execution.
— Whisper.cpp can be integrated later for offline STT.
— Vector embedding and memory system is correct for long-term memory.
— Multi-agent support feasibility in future.

Then produce the following deliverables:

1. **Complete Architecture Review**
   — Identify all problems, inconsistencies, design anti-patterns.
   — Check whether APIs follow standard backend conventions.
   — Validate tool layer structure and flow from user → model → tool → model → frontend.

2. **Backend Full Review**
   — Bugs, broken flows, missing checks, async issues, nested promises, missing awaits.
   — Data validation issues (especially where validation is incomplete or missing).
   — Rate limiting, security, authorization issues.
   — Service boundaries and business logic issues.
   — Suggestions to restructure controllers, services, tool handlers.

3. **Frontend Full Review**
   — Component structure
   — State management
   — API hooks
   — Re-renders, unnecessary effects
   — Bad patterns in UI or logic
   — Recommendation to improve electron-react-vite structure.

4. **Embedding + Memory System Review**
   — Validate embedding generation.
   — Verify vector DB (Chroma) usage.
   — Recommend improvements for full local embeddings.
   — Ensure the embedding pipeline is correct for recalling previous conversations.

5. **Tool Layer Review**
   — Identify missing handlers.
   — Fix problems in action routing.
   — Ensure the tool layer is clean and scalable.
   — Suggest a better architecture if needed.

6. **WSL Setup Instructions**
   — Missing dependencies
   — Required docker changes
   — Node installation
   — GPU/CPU setup for later Whisper.cpp

7. **Complete FIXED version of any problematic file**
   If you find broken or badly written files, rewrite them completely.

8. **Final Deliverables**
   Output MUST contain:
   — List of issues found
   — Exact actions to fix them
   — File-by-file suggestions
   — Refactored code for broken parts
   — Improved folder structure
   — Improvements for future multi-agent system

Now analyze the entire project directory provided by me. 
Always think deeply and exhaustively. 
Never skip any issue.
