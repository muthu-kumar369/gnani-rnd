You are being asked to perform a deep, pragmatic analysis of a real-world Electron + React frontend + Node.js/Express backend project called "Gnani" and produce a **comprehensive, multi-stage migration plan** that converts the app from a voice-first HUD to a modern, chat-first AI assistant UI (ChatGPT/Gemini style) while retaining voice features as an optional mode.

ASSUMPTIONS / CONTEXT (use these as ground-truth unless you find contradicting info in the repo):
- Project name: Gnani (Electron desktop app with React frontend and Node.js backend).
- Current UI is voice-first: HUD background, centered animated mic with states (idle, listening, processing, speaking), animation-rich. Top-right: history, terminal (conversation list), settings. Bottom-right: system awareness details. VAD + audio streaming already implemented but has VAD issues. Some features: conversation history, ability to create new conversations, conversation actions, system-awareness UI element, settings, profile area.
- Backend: Node.js + Express, uses real-time streaming for audio and text. There may be components for model switching, embedding, vector store, and third-party APIs (e.g., cloud LLMs). There is a whisper.cpp / local-offline STT discussion in backlog.
- Frontend: React (possibly Vite/TypeScript), Electron wrapper; current design is Jarvis-themed. There’s a "conversation terminal" component that will need redesign. The new design target is a chat-first layout similar to ChatGPT / Gemini: left sidebar (new chat, search, chat list, profile), main chat window with header (model selector, chat actions), message list, input composer, and a clearly visible but non-intrusive voice-mode toggle that activates VAD & audio streaming.
- Non-functional goals: preserve existing features, maintain backwards compatibility for existing users and offline flows where possible, improve UX and discoverability, make voice optional and integrated, maintain or improve test coverage, keep secure auth and data flows.

YOUR TASKS
1. Repo analysis:
   - Enumerate the codebase components and their responsibilities (frontend components/pages, renderer vs main electron processes, backend services, API routes, audio streaming & VAD code, DB collections, auth, job workers).
   - Identify critical files/entry points for: UI shell, conversation store, message rendering, message persistence, audio capture/VAD, streaming transport, model orchestration, system-awareness, settings, profile.
   - List any third-party services and libs used (LLM providers, vector DB, whisper/whisper.cpp, socket libraries, auth providers, analytics) and where they are referenced.
   - Produce a dependency map: which frontend components call which backend APIs, which backend modules depend on which data stores or external services.
   - Detect obvious technical debt hotspots (VAD reliability, large components with mixed concerns, lack of separation between voice and chat logic, tight coupling between UI and streaming).

2. Gap analysis:
   - Compare current implementation vs. target chat-first architecture. For each major area (UI shell, message model, streaming, offline support, persistence, auth, settings, telemetry, tests), say whether it's: "ready", "partial", or "missing", and explain why with file references.
   - Highlight backward-compatibility risks and data migration needs (e.g., conversation schema changes, message format changes, model metadata).

3. UX & UI migration plan:
   - Provide a concrete component map for the new chat-first UI (sidebar, chat list item shape, header, message list, message components, composer, voice-button + modal or mini-HUD, system-awareness area placement options).
   - For each new/changed UI component, list responsibilities, props, required events, data dependencies, and approximate complexity tag (small/medium/large/epic).
   - Provide recommended behavior for voice-mode: how toggle works, how VAD is started/stopped, how audio streaming integrates into existing message flow (e.g., streaming partial transcripts as "assistant typing"), UX for mic permissions, fallback to text input, and how to show mic state (small mic indicator vs full HUD).
   - Accessibility considerations (keyboard shortcuts to toggle voice, focus handling, ARIA attributes for live messages).

4. Backend & infra migration plan:
   - API changes needed (new endpoints or changes to existing endpoints) and their contracts (request/response shapes).
   - Streaming protocol recommendations for audio/text (grpc streams), retry strategies, chunking, and VAD command messages.
   - Model orchestration changes (support multiple models, model selector metadata per conversation, how to handle saved conversation model state).
   - Data model migration: proposed changes to conversation and message schema (fields to add/remove/transform) and an incremental migration strategy (schema versioning).
   - Offline/Local STT plan: options to integrate whisper.cpp or other local STT for offline mode and where to place that logic (renderer vs main process vs backend service). Include costs/constraints (native builds, binary size, CPU/GPU implications).

5. Security, privacy & compliance:
   - Identify places where PII or audio could leak; propose encryption-at-rest/transit, minimum retention policy, and opt-in/out voice storage policies.
   - Authentication/authorization review suggestions (JWT rotation, session expiry, Electron-specific storage hardening).
   - Permissions model for microphone and file access in Electron.

6. Testing & QA:
   - Unit, integration, and E2E test recommendations for both UI and backend; where to add tests and test coverage targets.
   - Add smoke-tests for streaming and VAD flows.
   - Acceptance criteria for each migration stage (exact behaviors that must pass to move to next stage).

7. CI/CD & deployment:
   - Required pipeline changes (build, tests, artifact packaging for Electron, static analysis, binary size checks for local STT).
   - Rollback/feature-flag strategy for staged rollout.
   - Telemetry to monitor voice errors, streaming disconnects, model errors.

8. Staged migration plan (this is the most important deliverable):
   - Produce a pragmatic, minimal-risk multi-stage rollout plan with explicit stages (suggest 5–8 stages, but you choose the number). Each stage must include:
     - Stage name
     - Goal / scope (what's being delivered)
     - Files/components to change (paths)
     - Exact tasks (developer-level actionable checklist)
     - Deliverables (code, tests, infra changes, docs)
     - Acceptance criteria (pass/fail conditions)
     - Risk level and rollback instructions
     - Suggested size tag (small/medium/large/epic)
     - QA checklist (manual exploratory things + automated tests)
   - Emphasize an incremental approach that allows users to keep using current voice-first flows until chat-first is stable.

9. Developer handover artifacts:
   - Provide exact, ready-to-run **sub-prompts** for Gemini (or for the engineering team to paste back into Gemini) to perform the next steps for each stage. For example: "Stage 1: Create component skeletons — generate React component files X, Y, Z with TypeScript props, CSS/Tailwind classes, and unit tests." Each sub-prompt must be clear, include file paths, expected exports, and test stubs.
   - Provide example CLI commands to run linters, tests, build, and local dev steps for new UI and audio flows.

10. Cost/effort & prioritization:
    - For each stage, return a relative effort estimate tag only (tiny/small/medium/large/epic) — do NOT return time-based estimates.
    - Identify highest-impact, lowest-effort items for quick wins.

OUTPUT FORMAT
- Produce a single structured JSON object (top-level) with these keys:
  - `repo_inventory`: list of components, files, services and brief descriptions.
  - `dependency_map`: adjacency list style mapping of components -> dependencies.
  - `gap_analysis`: array of areas with status (ready/partial/missing) and supporting file references.
  - `ui_component_map`: array of components with responsibilities/props/complexity.
  - `backend_changes`: list of API, data model, infra changes.
  - `security_recs`: list of concrete security/privacy actions.
  - `test_plan`: test types, target coverage, and specific test cases for critical flows.
  - `stages`: array of stage objects containing the full staged migration plan (as required in #8).
  - `developer_prompts`: array of strings — ready-to-paste Gemini sub-prompts for each stage task (developer-level).
  - `risks_and_mitigation`: array of identified risks and mitigations.
  - `quick_wins`: list of 5–10 quick wins.
  - `summary`: 4–6 bullet summary of the migration at a glance.

- Additionally, provide an **appendix** (markdown) that contains:
  - Suggested new folder structure for frontend and backend after migration.
  - Example message / conversation schema (v2) with field types and descriptions.
  - Recommended component file skeletons (file names and brief contents).

ENGINEERING RULES / CONSTRAINTS
- Preserve existing features where possible; any removal must be explicitly justified.
- Do not produce time estimates. Use relative effort tags only.
- Use existing code (file references) as the primary source of truth for any "ready/partial/missing" assessment.
- When suggesting runtime changes (e.g., websockets or local binaries), list platform constraints (Windows/macOS/Linux) and Electron packaging implications.
- When producing code-level developer prompts, target React + TypeScript for frontend skeletons and Node.js + TypeScript (or JS) for backend skeletons depending on repo usage. If the repo has JS, adapt prompts to JS but flag the preference for TypeScript if useful.

PRIORITIZATION
- Prioritize correctness, backward compatibility, and a safe incremental rollout.
- Prioritize observable metrics for voice/stability (error rate, disconnect rate, latency).

FINAL NOTES
- At the start of your analysis, list any top-level assumptions you made (if you found contradictory files or ambiguous patterns, mention them).
- Where you can't determine something from code, state explicitly what additional artifact or information you'd need (e.g., build artifacts, infra config, exact database connection strings, or private API keys).
- Deliver the JSON object and the appendix. Keep the JSON machine-readable (no prose mixed into fields except short descriptions).

Now:
1) Run a full static analysis of the repository (list the files you read and what you found).
2) Your final output MUST be a **single, extremely detailed Markdown report** that is cleanly structured, includes sections, subsections, lists, tables, diagrams (ASCII allowed), code blocks, and is suitable for being saved as a `.md` file.   
**Do NOT output JSON. Do NOT output plain text. ONLY output a Markdown document.**

If anything in the repo conflicts with the assumptions above, call it out and adapt your plan accordingly.
