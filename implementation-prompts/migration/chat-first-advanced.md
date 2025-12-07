You are being asked to perform a deep, pragmatic analysis of a real-world Electron + React frontend + Node.js/Express backend project called "Gnani" and produce a **comprehensive, multi-stage migration plan** that converts the app from a voice-first HUD to a modern, chat-first AI assistant UI (ChatGPT/Gemini style) while retaining voice features as an optional, minimal UI mode.

Important change requests (apply these before anything else):
- **ANALYZE FIRST:** Before proposing any UI/UX or migration steps, do a complete, repository-rooted analysis and write a short "What I understand" section that summarizes your mental model of the project (features, flows, constraints, missing info). The plan must *start* with this understanding and only then move into design and migration planning.
- **REUSE EXISTING IMPLEMENTATION FIRST:** Wherever possible, the migration must prefer reusing existing components, services, and logic (e.g., audio capture, VAD, device-awareness/state, streaming transport, conversation storage). If you propose replacing an existing implementation, justify why reuse was not possible and document an incremental replacement strategy that retains compatibility during rollout.
- **VOICE MODE MINIMAL UI:** Voice-mode must be available but visually minimal: **no extra buttons except a single CLOSE button** visible in the chat UI when voice-mode is active. Use the existing speaker/mic animations/states internally (idle/listening/processing/speaking) but do **not** surface additional buttons; provide subtle inline mic indicators only. Document exact UX for toggling voice (keyboard shortcut, menu, or quick toggle), and how the single-close button behaves (dismiss vs stop stream vs keep session).
- **DIAGRAM REQUIRED:** For every UI flow and for the final recommended chat-first design, include at least one diagram (ASCII or ASCII+plantuml-style) that shows component layout, data flow between frontend and backend, and streaming pipelines. The diagrams must be human-readable in a `.md` file and also include one small simplified ASCII sequence diagram for audio->VAD->STT->LLM->TTS flows.
- **DEVICE AWARENESS & REUSE:** Explicitly analyze and recommend how to reuse and extend existing device-awareness information (battery, network quality, microphone availability, OS-level capabilities) to make adaptive UI/UX choices (e.g., reduce streaming quality on poor network, disable local STT fallback on low CPU).

ASSUMPTIONS / CONTEXT (use these as ground-truth unless you find contradicting info in the repo):
- Project name: Gnani (Electron desktop app with React frontend and Node.js backend).
- Current UI is voice-first: HUD background, centered animated mic with states (idle, listening, processing, speaking), animation-rich. Top-right: history, terminal (conversation list), settings. Bottom-right: system awareness details. VAD + audio streaming already implemented but has VAD issues. Some features: conversation history, ability to create new conversations, conversation actions, system-awareness UI element, settings, profile area.
- Backend: Node.js + Express, uses real-time streaming for audio and text. There may be components for model switching, embedding, vector store, and third-party APIs (e.g., cloud LLMs). There is a whisper.cpp / local-offline STT discussion in backlog.
- Frontend: React (possibly Vite/TypeScript), Electron wrapper; current design is Jarvis-themed. There’s a "conversation terminal" component that will need redesign. The new design target is a chat-first layout similar to ChatGPT / Gemini: left sidebar (new chat, search, chat list, profile), main chat window with header (model selector, chat actions), message list, input composer, and a clearly visible but non-intrusive voice-mode toggle that activates VAD & audio streaming.
- Non-functional goals: preserve existing features, maintain backwards compatibility for existing users and offline flows where possible, improve UX and discoverability, make voice optional and integrated, maintain or improve test coverage, keep secure auth and data flows.

YOUR TASKS — keep all sections from the original prompt but apply the "Analyze first" & "Reuse first" constraints above. Update or extend each relevant section below to explicitly reflect the new constraints:

1. Repo analysis:
   - **MANDATORY FIRST STEP:** Run a full static analysis of the repository and produce a short "What I understand" summary listing top-level assumptions and any contradictions found in code vs. the assumptions above.
   - Enumerate the codebase components and their responsibilities (frontend components/pages, renderer vs main electron processes, backend services, API routes, audio streaming & VAD code, DB collections, auth, job workers).
   - Identify critical files/entry points for: UI shell, conversation store, message rendering, message persistence, audio capture/VAD, streaming transport, model orchestration, system-awareness, settings, profile.
   - List any third-party services and libs used (LLM providers, vector DB, whisper/whisper.cpp, socket libraries, auth providers, analytics) and where they are referenced.
   - Produce a dependency map: which frontend components call which backend APIs, which backend modules depend on which data stores or external services.
   - Detect obvious technical debt hotspots (VAD reliability, large components with mixed concerns, lack of separation between voice and chat logic, tight coupling between UI and streaming).

2. Gap analysis:
   - Compare current implementation vs. target chat-first architecture. For each major area (UI shell, message model, streaming, offline support, persistence, auth, settings, telemetry, tests), say whether it's: "ready", "partial", or "missing", and explain why with *file references*.
   - Highlight backward-compatibility risks and data migration needs (e.g., conversation schema changes, message format changes, model metadata).
   - For each "partial" or "missing" item, recommend the minimal reuse-first path (how to wrap/extend existing code rather than replacing it).

3. UX & UI migration plan:
   - Provide a concrete component map for the new chat-first UI (sidebar, chat list item shape, header, message list, message components, composer, voice-button + modal or mini-HUD, system-awareness area placement options).
   - For each new/changed UI component, list responsibilities, props, required events, data dependencies, and approximate complexity tag (small/medium/large/epic).
   - Provide recommended behavior for voice-mode that **obeys the minimal UI rule** (single close button shown when active). Include:
     - How toggle works (keyboard, menu, or UI).
     - How VAD is started/stopped and how partial transcripts are streamed into the chat.
     - How to represent assistant "typing" and partial results.
     - Mic permissions flow and fallbacks to text input.
     - How to show mic state with subtle inline indicators (not full HUD) while preserving existing animations internally.
   - Accessibility considerations (keyboard shortcuts to toggle voice, focus handling, ARIA attributes for live messages).

4. Backend & infra migration plan:
   - API changes needed (new endpoints or changes to existing endpoints) and their contracts (request/response shapes).
   - Streaming protocol recommendations for audio/text (websocket/grpc streams), retry strategies, chunking, and VAD command messages.
   - Model orchestration changes (support multiple models, model selector metadata per conversation, how to handle saved conversation model state).
   - Data model migration: proposed changes to conversation and message schema (fields to add/remove/transform) and an incremental migration strategy (schema versioning). Provide a small migration script outline that *reuses* existing persistence logic where possible.
   - Offline/Local STT plan: options to integrate whisper.cpp or other local STT for offline mode and where to place that logic (renderer vs main process vs backend service). Include platform and Electron packaging constraints (binary size, CPU/GPU implications). Prioritize a reuse-first approach: prefer wrapping existing streaming/STT adapters.

5. Security, privacy & compliance:
   - Identify places where PII or audio could leak; propose encryption-at-rest/transit, minimum retention policy, and opt-in/out voice storage policies.
   - Authentication/authorization review suggestions (JWT rotation, session expiry, Electron-specific storage hardening).
   - Permissions model for microphone and file access in Electron.

6. Testing & QA:
   - Unit, integration, and E2E test recommendations for both UI and backend; where to add tests and test coverage targets.
   - Add smoke-tests for streaming and VAD flows (these must include tests that verify the single-close-button voice UI and that audio continues/stops properly).
   - Acceptance criteria for each migration stage (exact behaviors that must pass to move to next stage).

7. CI/CD & deployment:
   - Required pipeline changes (build, tests, artifact packaging for Electron, static analysis, binary size checks for local STT).
   - Rollback/feature-flag strategy for staged rollout.
   - Telemetry to monitor voice errors, streaming disconnects, model errors.

8. Staged migration plan (this is the most important deliverable):
   - Produce a pragmatic, minimal-risk multi-stage rollout plan with explicit stages (suggest 5–8 stages, but you decide). Each stage must include:
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
   - For each stage include one Gemini-ready sub-prompt (developer-level) to perform that stage's primary coding task (component skeletons / migration script / infra change, etc.). Sub-prompts must include file paths, expected exports, and test stubs.

9. Developer handover artifacts:
   - Provide exact, ready-to-run **sub-prompts** for Gemini (or for the engineering team to paste back into Gemini) to perform the next steps for each stage. For example: "Stage 1: Create component skeletons — generate React component files X, Y, Z with TypeScript props, CSS/Tailwind classes, and unit tests." Each sub-prompt must be clear, include file paths, expected exports, and test stubs.
   - Provide example CLI commands to run linters, tests, build, and local dev steps for new UI and audio flows.

10. Cost/effort & prioritization:
    - For each stage, return a relative effort estimate tag only (tiny/small/medium/large/epic) — do NOT return time-based estimates.
    - Identify highest-impact, lowest-effort items for quick wins (emphasize reuse-first quick wins).

OUTPUT FORMAT
- Produce a **single, extremely detailed Markdown report** suitable for saving as `migration-report.md`. The report must be structured with sections, subsections, lists, tables, diagrams (ASCII allowed), code blocks, and must start with:
  1. A "Top-level assumptions I made" list (explicit).
  2. A "What I understand" short summary (repo-rooted).
  3. A numbered list of files read during the static analysis and brief findings per-file.
- After the initial analysis sections, include the full deliverables (repo inventory, dependency map, gap analysis, ui component map, backend changes, security recs, test plan, stages, developer_prompts, risks_and_mitigation, quick_wins, and summary).
- **DIAGRAMS:** Include at least:
  - wireframes of the proposed chat-first UI.
  - One ASCII layout diagram of the proposed chat-first UI.
  - One ASCII sequence diagram for audio->VAD->STT->LLM->TTS.
  - One ASCII or plantuml-style architecture diagram showing frontend↔backend↔model providers↔optional local STT.
- When you reference files in the repo use relative paths. If you cannot find a file, explicitly say what artifact you'd need (build outputs, infra config, or secrets).
- Keep the Markdown machine-readable but human-friendly. Include code blocks for example schemas, API request/response shapes, and migration script snippets.
- **Do NOT output JSON. Do NOT output plain text. ONLY output a Markdown document.**

ENGINEERING RULES / CONSTRAINTS
- Preserve existing features where possible; any removal must be explicitly justified.
- Do not produce time estimates. Use relative effort tags only.
- Use existing code (file references) as the primary source of truth for any "ready/partial/missing" assessment.
- When suggesting runtime changes (e.g., websockets or local binaries), list platform constraints (Windows/macOS/Linux) and Electron packaging implications.
- When producing code-level developer prompts, target React + TypeScript for frontend skeletons and Node.js + TypeScript (or JS) for backend skeletons depending on repo usage. If the repo has JS, adapt prompts to JS but flag the preference for TypeScript if useful.

PRIORITIZATION
- Prioritize correctness, backward compatibility, and a safe incremental rollout.
- Prioritize observable metrics for voice/stability (error rate, disconnect rate, latency).
- Emphasize reuse of device-awareness info to adapt streaming quality and UI.

FINAL NOTES
- At the start of your analysis, list any top-level assumptions you made (if you found contradictory files or ambiguous patterns, mention them).
- Where you can't determine something from code, state explicitly what additional artifact or information you'd need (e.g., build artifacts, infra config, exact database connection strings, or private API keys).
- Deliver the Markdown (`.md`) file as the only output.
