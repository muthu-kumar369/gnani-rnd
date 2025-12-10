You are an expert full-stack engineer, systems architect, and senior product designer with deep experience building conversational UIs, LLM integrations, streaming gRPC, and robust backend systems. 

CONTEXT:
- Project: Gnani (React + Vite + Electron frontend, Node.js backend, gRPC used for LLM responses/streams)
- The repo includes conversation terminals (chat UI) where messages and LLM responses are stored as records.
- Current features implemented: create message, regenerate response, edit message, delete message — but they are applied globally/massively and not linked correctly between user message and its response(s).
- Requirements: implement correct, robust message lifecycle so that every user message is linked to its responses; operations (edit/regenerate/delete) operate correctly and predictably; UI shows clear loading/disabled states, multi-part responses are numbered (1/2, 2/2), copy/export, undo, and backend schemas + APIs + gRPC streaming remain consistent.

YOUR TASK:
1) Analyze the entire repository I provide — both frontend and backend — and infer the existing message/response data model, gRPC usage, and UI flows. If any code or files are missing that prevent verification, list them.

2) Produce a complete design and implementation plan that:
   — Fixes message ↔ response linking (schema + DB migrations)
   — Implements delete behavior such that deleting a user message cascades (or soft-deletes) all associated response records and streaming state in a safe, undoable way
   — Implements regenerate behavior: keeps previous generations, appends new generation(s), shows numbering like "1/2", "2/2", and allows copying / exporting / diffing between generations
   — Implements edit behavior: editing a user message optionally invalidates response(s) (marking them stale) and surfaces a clear UX path to regenerate or accept an edited response
   — Ensures all of the above works with **existing gRPC streaming** integration for model responses (stream remains the canonical source for LLM output); regeneration must still use gRPC stream and follow same semantics
   — Ensures frontend disables duplicate actions, shows loaders/skeletons during streaming/regeneration/edit/save/delete, and handles partial streams (resume / cancel)
   — Ensures API & gRPC contracts remain stable, versioned, and documented; provide migration/compatibility strategy if schema changes are required
   — Includes tests (unit + integration + e2e) to prevent regressions
   — Includes monitoring/observability: traces, correlation IDs, and audit logs for message lifecycle operations
   — Provides an action plan + priority roadmap and exact file diffs / full file replacements for any broken files

DETAILED REQUIREMENTS & CHECKLIST (exhaustive)
A. DB Schema & Data Model
  1. Provide a concrete recommended schema for messages, responses, and generations (SQL or MongoDB schemas depending on current repo). Include fields for:
     — message_id (uuid)
     — conversation_id
     — parent_message_id (nullable, for threads/replies)
     — role (user/system/assistant)
     — content (string / blob)
     — created_at, updated_at, deleted_at (for soft deletes)
     — status (draft, pending, streaming, completed, failed, stale)
     — generation_id(s) or pointer to response documents
     — generation_index (1,2,...)
     — generation_meta: model_version, prompt_sent, tokens_used, cost_estimate
     — stream_trace: stream_id, started_at, finished_at, cancel_token
     — is_active boolean (for quick queries)
     — versioning for edits (version number + have old_content kept)
  2. If using MongoDB: propose collection names, indexes (conversation_id + created_at, message_id unique, status indexes), and a migration script (or instructions) to add new fields without downtime.
  3. If SQL: provide migration SQL (ALTER TABLE etc.) to add columns/tables for generations/response_history.
  4. Recommend soft deletes and tombstones, not hard deletion, to avoid losing telemetry and to allow undo.

B. Message ↔ Response Linking & Lifecycle
  1. Each user message MUST own zero-or-more assistant response generations. Model each generation as a separate record (response generation table/collection), linked to message_id.
  2. Deleting user message:
     — Soft-delete message record (set deleted_at)
     — Soft-delete all linked response generations (deleted_at)
     — Cancel any ongoing streaming operations by emitting a cancel to the gRPC stream (use stream_id from stream_trace)
     — Append an audit record (who, when, reason)
     — Provide an UNDO window (e.g., 30s or configurable) — store tombstone token to restore message and responses
  3. Regenerate:
     — Create a new generation record linked to the same message_id with generation_index = previous_max + 1 and status= pending/streaming
     — Keep previous generations intact (status may be kept completed or marked stale)
     — UI should render both old and new generation blocks; the new one shows a streaming loader and partial content as gRPC stream arrives
     — For multi-part streaming output (model emits segments/parts), annotate the chunks with generation_index and part_index (e.g., 1/2, 2/2). The UI must render parts as they complete.
     — After regeneration finishes, store tokens/cost in generation_meta.
  4. Edit:
     — Editing a user message should not implicitly delete previous generations — but previous generations must be marked as STALE and shown with a visual indicator (reason: message changed at time X).
     — UI must provide quick CTA: "Regenerate for edited message" which will create a new generation.
     — Also allow "Apply changes to conversation" vs "Keep old responses" modal for users who want to keep or drop old responses.
  5. Copy / Export / Diff:
     — Provide backend endpoints (or simple client-side utilities) to copy generation text, export as JSON, or produce a diff between two generations (use a small diff library on server or client).
  6. Idempotency & Concurrency:
     — Regenerate or delete operations must be idempotent; attach idempotency keys to requests.
     — Handle retry safely; if a regenerate request is re-played, it must not duplicate streams unless explicitly requested.

C. gRPC Streaming Semantics (must preserve existing gRPC flow)
  1. The LLM responses MUST continue to stream via gRPC server streams or bidi streams as currently implemented.
  2. For each generation, attach a stream_id to the generation record. While streaming:
     — persist partial chunks to a temporary buffer (in-memory, or if size requires, append to a temp store like Redis)
     — send incremental updates to frontend via your current transport (grpc-web, websockets, or electron IPC)
     — ensure chunk ordering and at-least-once or exactly-once semantics documented (recommended: sequence numbers)
  3. Cancellation:
     — Provide a cancellation path from frontend to backend which uses stream_id and sends a Cancel message to gRPC server or closes the stream; backend should set generation status = cancelled and flush partial content to DB (if required).
  4. Resume/Reconnect:
     — If the frontend reconnects, allow resumption: attach last_received_seq per generation so server can resume or replay missing chunks if supported or re-run generation as needed.
  5. Partial Responses:
     — UI must render partial text as it arrives but show clear loader until final "completed" event.
     — If a stream ends unexpectedly (network), mark generation as failed and expose Retry.

D. API & Contracts
  1. Provide REST/gRPC endpoints for:
     — POST /conversations/:cid/messages (create user message)
     — PATCH /messages/:mid (edit message — supports partial updates and versioning)
     — POST /messages/:mid/regenerate (create new generation)
     — POST /generations/:gid/cancel (cancel stream)
     — DELETE /messages/:mid (soft delete + cascade responses)
     — GET /conversations/:cid/messages?includeGenerations=true
     — GET /generations/:gid/download or /generations/:gid/diff?other_gid=<id>
  2. Define request/response payload shapes (include idempotency-key header support)
  3. Ensure JWT/auth metadata is passed both in REST headers and gRPC metadata consistently.

E. Frontend UX & Implementation
  1. Action flow UX patterns:
     — Create message: show placeholder message, optimistically push to UI with status = pending; after server ack, update with server id
     — While streaming: show spinner + "Streaming..." + partial text; disable regenerate/delete for that generation
     — Regenerate: disable regenerate button during streaming; show previous generations in a collapsed "older generations" section; label generations 1/2, 2/2 for multi-part
     — Delete: show confirmation modal; after confirm, show "Deleting..." loader; when successful, replace content with "Message deleted — Undo" toast (30s)
     — Edit: open inline editor; on save, send PATCH; show "Stale responses" badge on old generations; show CTA to regenerate
  2. UI components suggested:
     — <MessageItem> (handles message meta, actions)
     — <GenerationItem> (individual generation output, shows status, tokens, parts)
     — <StreamingText> (handles streaming chunk appends, cursor, highlight diffs)
     — <ConfirmModal>, <Toast>, <LoaderSkeleton>, <UndoSnackbar>
  3. Loading & disable rules:
     — Any action that triggers backend mutation must show a loader and disable the related action buttons until completion or failure.
     — Provide helpful inline error messages and a global error boundary for streaming exceptions.
  4. Accessibility:
     — All actions reachable via keyboard; accessible labels for streaming state; announce changes using ARIA live regions.
  5. Edge cases:
     — If regenerate is triggered while an earlier regeneration stream is active, either queue or reject with explicit message. Recommend rejecting and offering "Cancel current regeneration" instead.
     — If user edits message mid-stream, provide clear option: "Stop stream and regenerate for edited text" (sends cancel + regenerate) or "Keep current stream".

F. Tests & CI
  1. Provide at least:
     — Unit tests for message generation lifecycle (backend service layer)
     — Integration tests for regenerate/cancel/delete flows with mocked gRPC server (use grpc-mock)
     — E2E test for frontend (Playwright) that covers: create → stream → regenerate → edit → delete → undo
  2. Add contract tests between frontend and backend (schema validation using JSON schema or protobuf checks)
  3. Add CI snippets (GitHub Actions) that run contract tests on PRs.

G. Observability & Audit
  1. Add correlation IDs for every lifecycle operation (trace_id in headers/metadata)
  2. Log events for create/edit/regenerate/delete with generation ids and user ids
  3. Expose metrics: number_of_generations, stream_disconnect_rate, regenerate_rate, avg_stream_latency
  4. Optional: UI telemetry to track user interactions (button taps for regenerate/delete) for UX improvements.

H. Security & Permissions
  1. Ensure only owner (or authorized role) can edit/delete/regenerate a message.
  2. Protect endpoints with auth middleware; enforce ownership checks server-side.
  3. Avoid leaking generation content in logs; sanitize before logging.

OUTPUT DELIVERABLES (must be produced)
1. Executive Summary — overall status and high-level recommendations.
2. Full Issues Report — file-by-file (if repo provided). If code is missing, list missing files so the repo owner can attach them.
3. Concrete DB schema proposals and migration scripts (MongoDB or SQL based on repo).
4. API contract definitions (OpenAPI / protobuf snippets).
5. Full backend code patches or full-file replacements for any files that need changes (include imports/exports).
6. Full frontend code patches or full-file replacements for components involved in message lifecycle (React + hooks + sample CSS/Tailwind classes).
7. Streaming handling patches: server-side and client-side streaming management code (including cancel/resume).
8. Tests: runnable unit, integration and e2e tests for critical flows.
9. CI snippets for contract tests and e2e runs.
10. Observability/instrumentation snippets (OpenTelemetry or simple correlation-id middleware).
11. Action Plan: prioritized tasks with effort estimates (S/M/L) and suggested sprint breakdown.
12. Rollback & backward compatibility plan (how to deploy DB migrations safely and how to maintain old clients).

STRICT CONSTRAINTS
— Maintain current gRPC-based LLM streaming approach. Do not propose switching to a non-gRPC pattern for streaming unless you identify an absolute blocker — if so, explain in detail and provide a migration strategy.
— Use soft-deletes and tombstone patterns instead of hard deletes unless deletion is explicitly irreversible and approved.
— Provide idempotency keys for all mutating endpoints to avoid duplicates.
— Keep message/response storage efficient (avoid storing duplicate large blobs) — store diffs or final concatenated content where appropriate.
— When giving code, produce runnable, complete code (no pseudocode). Include necessary imports and error handling.

Now:  
— Analyze the repository I provide (frontend + backend).  
— If files are missing for full verification (for example proto files, DB migration scripts, or streaming handlers), list them clearly and continue with best-effort design and patches.  
— Output everything described in "OUTPUT DELIVERABLES".  
— Think like an engineer who will both implement the changes and write tests and CI to prevent regressions. Be exhaustive and precise.
