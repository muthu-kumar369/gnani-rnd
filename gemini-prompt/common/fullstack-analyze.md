You are an expert systems engineer with deep experience in full-stack integration, distributed systems, API design, and frontend UX. 
You will perform an exhaustive, line-by-line analysis of the entire project codebase I provide (frontend + backend) and produce a complete integration audit focused on the communication layer and any UI behavior that depends on backend state.

Scope (must inspect everything in repository):
- Frontend: React + Electron + Vite (all components, hooks, API clients, gRPC stubs, streaming handlers, state management)
- Backend: Node.js/Express (or server framework used), gRPC servers/clients, proto files, middleware, auth, web APIs, sockets/streams
- Infrastructure and config: docker compose, WSL configs, CI scripts, env files, reverse proxies, service discovery
- Tests: unit, integration, e2e (if present)
- Tooling: OpenAPI/Swagger, proto definitions, contract tests, mocks, stubs

Primary objective:
Verify that frontend↔backend communication is CORRECT, RELIABLE, and USER-FRIENDLY. Produce exact, actionable fixes (file-level diffs where necessary) and tests.

DETAILED CHECKLIST (exhaustively perform each item)

1. Protocol & Contract correctness
  • Validate gRPC proto files: message types, enums, field numbers, options, package names, and service method signatures.
  • Ensure proto changes are backward-compatible (or suggest explicit versioning).
  • Verify frontend-generated gRPC stubs match backend proto definitions (no mismatches in field names/types).
  • Validate REST API contracts: routes, HTTP methods, request/response schema, status codes.
  • Identify any schema drift between frontend expectations and backend responses.

2. Payload correctness & validation
  • Check that every incoming request (backend) validates input (types, required fields, ranges).
  • Ensure frontend sanitizes input and encodes binary payloads properly for gRPC/REST.
  • Verify correct Content-Type handling (application/json, application/grpc-web, multipart/form-data).
  • Detect missing or incorrect schema validation on either side.

3. Headers, Auth & Metadata
  • Validate all required headers are sent and consumed (Auth, Trace-Id, Content-Type, Accept, CORS, rate-limit headers).
  • Verify JWT or session tokens are attached consistently (both REST and gRPC metadata).
  • Check CORS policies on backend and preflight behavior.
  • Ensure sensitive headers are NOT leaked into logs or client-side code.

4. Synchronization & State propagation
  • Ensure status changes (e.g., task started → processing → finished → error) are propagated reliably to UI.
  • Validate optimistic updates and server confirmations (reconciliation flows).
  • Check for race conditions where multiple UI updates depend on same backend call.
  • Verify idempotency for retryable operations (create/confirm/cancel).

5. Streaming & gRPC bidirectional flows
  • Validate server-stream and bidi-stream handling (backpressure, buffering, cancelation).
  • Ensure the frontend unsubscribes/cleans up streams on unmount or route change.
  • Check reconnection and resume logic for long-running streams.
  • Ensure streaming messages are handled in correct order and duplicates are detected/ignored.

6. Error handling & UX feedback
  • Confirm consistent error shapes returned by backend and handled by frontend.
  • Verify specific errors (validation, auth, rate limit, network) show appropriate UX (toasts, modals, inline messages).
  • Identify missing loaders, disabled button states, and missing "in-progress" indicators that cause duplicate clicks.
  • Ensure retry strategies are present where appropriate and UI prevents repeated user actions during retry.

7. Timing, timeouts & retries
  • Audit client and server timeouts for each relevant endpoint/stream.
  • Verify exponential backoff where retries are used.
  • Confirm any synchronous gRPC calls that block the UI are handled off the main thread (or made non-blocking).
  • Recommend sensible timeout values and show where to configure them.

8. Concurrency & locking
  • Identify endpoints that require locking or transaction semantics to avoid race conditions.
  • Check DB transaction boundaries and consistency guarantees for multi-step flows.
  • Check frontend state updates that assume sequential execution but may be concurrent.

9. Performance & payload size
  • Flag overly large payloads (JSON or binary), unnecessary fields, or chatty endpoints.
  • Recommend pagination, streaming, or delta updates where full payloads are used.
  • Check use of compression (gzip / brotli / grpc compression).

10. Observability, logs & tracing
  • Ensure each request has correlation IDs propagated (frontend→backend→logs).
  • Check that backend logs don't contain PII and have structured logging.
  • Verify presence of metrics for request latency, error rates, streaming disconnects.
  • Suggest traces/span instrumentation (OpenTelemetry) across frontend/backends where missing.

11. Tests & Contract validation
  • Identify missing contract tests between frontend & backend.
  • Produce integration test snippets (e.g., using pact, grpc-mock, supertest, Playwright) that validate critical flows.
  • Provide mocks/stub definitions for CI to run contract checks.

12. Security & data protection
  • Validate transport security (TLS) for gRPC and REST.
  • Check authentication/authorization enforcement for every endpoint.
  • Flag any insecure patterns (e.g., secrets in code, weak CORS, missing rate-limits).

13. Versioning & backward compatibility
  • Check semantic versioning for APIs/protos and recommend versioning scheme if missing.
  • Identify breaking changes and remedial steps (compatibility layer, migration script).

14. Developer ergonomics
  • Validate code generation steps for proto -> frontend stubs are reproducible.
  • Confirm that environment variables and setup for gRPC-web/tunnels are documented and usable.

OUTPUT REQUIREMENTS (must produce all items below)

A. Executive Summary
  • Short summary with overall health score (0-100) for integration.

B. Full Issues Report (file-by-file)
  • For every problem found: file path, line ranges (if applicable), severity (Critical/Major/Minor), root cause, and exact fix (diff or full replacement).

C. Contract Drift Table
  • Table of endpoints/proto methods where frontend and backend disagree (request/response mismatches).

D. Loading & UX Audit
  • List of UI interactions missing loaders or disabled states. For each: suggested loader type (spinner, skeleton, button spinner) and exact code fix (React snippet).

E. Streaming & gRPC Audit
  • For each streaming method: current behavior, potential failure modes, and patch code to fix reconnection, handling, or cleanup.

F. Test Suite
  • Add at least 5 concrete tests (unit/integration/e2e) that can catch the critical integration issues identified. Provide runnable test code and rationale.

G. Observability Plan
  • Minimal tracing/logging/metrics changes with code examples and sample queries to detect production problems.

H. Security Checklist
  • Steps and patches to fix security issues found, including headers, TLS, CORS, auth.

I. Action Plan & Priority Roadmap
  • Prioritized checklist (Immediate fixes: must-fix before deploy; High: fix in next sprint; Medium/Low)
  • Estimated effort (S/M/L) per task and suggested assignee (frontend/backend/full-stack)

J. Regression-proofing
  • CI steps (linters, contract tests, proto-check) to prevent regressions, with exact CI config snippets.

K. If any file is broken or suboptimal, produce a fully refactored version of that file in the report. Do not leave pseudo-code — produce real, runnable code.

FINAL INSTRUCTIONS
- Be exhaustive and precise. Do not skip any integration check.
- When suggesting code fixes, include imports and small helper utilities if needed.
- If you cannot verify something because the code is missing, clearly state the missing files and why verification is impossible.
- Output must be machine-usable: include clear file diffs or full-file replacements for every code change.
- Always include reproduction steps to trigger each issue and commands to run proposed tests.

Now analyze the repository I provide and produce the complete report described above. Think like an engineer who will both ship the fix and write the tests. Never stop until you have covered every possible integration angle between frontend and backend.
