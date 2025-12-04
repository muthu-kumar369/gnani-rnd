I want you to analyze my entire project (frontend + backend) with the goal of building a rock-solid, production-grade single-LLM version of my AI assistant called **Gnani**.

Your goal is NOT to design the multi-agent system now. 
Your goal is to design the strongest possible SINGLE-LLM architecture that:
- works reliably
- handles real-time audio and text
- manages tools properly
- scales efficiently
- supports high concurrency
- operates at OS level (Electron + system control)
- is cleanly structured
- AND is fully future-proof for a later upgrade to multi-agent LLMs.

You must deeply analyze all existing flows:
- Electron desktop architecture
- VAD + audio streaming chain
- WebSocket streaming chain
- gRPC streaming
- Tools & function calling system
- Embeddings and vector search layer
- Memory and session management
- Backend API structure
- Database usage (MongoDB, Redis)
- Frontend state management
- System awareness modules
- Current limitations
- Missing components

Then generate a complete and highly detailed **Single-LLM Gnani Foundation Report** that includes:

============================
### 1. Project Analysis
- Breakdown of current frontend architecture
- Breakdown of backend architecture
- Existing flows (audio, text, tools, memory, vector search)
- Issues, bottlenecks, missing pieces
- Stability concerns
- Tool invocation analysis
- WebSocket reliability issues
- Session handling gaps
- Vector search accuracy & performance problems

### 2. What Needs to Be Implemented for a Solid Single LLM
You must list every required component including:
- Audio pipeline fixes
- Text streaming improvements
- Tool layer stabilization
- Unified session manager
- State machine for assistant behavior
- Error handling and retry logic
- OS-level awareness module (Phase 1)
- Frontend event architecture improvements
- Backend module restructuring
- Logging + monitoring setup
- Production-grade security & safety rules

### 3. Clean Architecture Plan
Provide:
- Clear folder structure for frontend & backend
- Separation of concerns
- How to isolate LLM logic, tools, memory, embeddings, RAG
- Standard interfaces for future multi-agent upgrade
- How to prevent architecture collapse later

### 4. Future-Proofing for Multi-Agent
DO NOT design the multi-agent system now.
Instead, describe:
- What abstractions the single-LLM version must follow
- What patterns make it upgradeable to multi-agent later
- What components must be modular
- How the messaging/intent pipeline should be built now
- How to design the tool interface for agent expansion
- How to design memory for multi-agent compatibility

### 5. Performance & Scalability Plan
- How to support high traffic with a single LLM backend
- Caching strategies
- Audio pipeline optimization
- WebSocket/gRPC improvements
- Redis usage plan
- Horizontal scaling potential

### 6. Production-Grade Requirements
- Logging, metrics, and tracing
- Graceful restart + reconnection
- Rate limits & protections
- Recovery flows
- Error boundaries (frontend + backend)
- Unit testing plan

### 7. Final Deliverables
Produce an extremely detailed report including:
- Architecture diagrams
- Flow diagrams
- Tables and checklists
- Clear step-by-step development roadmap (1 month, 2 month, 3 month plan)
- A punch list of “must fix / must build” items
- Checklist for “Solid Single LLM Gnani Completion”

============================

IMPORTANT:
This report must be high quality and deeply technical — similar to an internal Google or DeepMind architecture review document.

Focus only on creating the strongest possible single-LLM Gnani foundation. 
Do NOT design the multi-agent system yet. Please create the md file for the report.
