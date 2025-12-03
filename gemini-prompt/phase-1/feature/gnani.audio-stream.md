# Prompt: GNANI — Stage 5: Streaming Audio → Backend

You are my Senior Engineer. We completed UI, Electron IPC, Wake-word, and VAD.
Now implement Stage 5: the Streaming Audio → Backend pipeline and response handling.
This prompt must produce only the backend-streaming related code and integration points inside /electron and a clear API contract for the backend.
Do NOT implement server-side AI model logic — only the client, protocols, formats, and local handling for streaming and receiving responses (text + TTS).

---

GOALS (high level)

1. Send VAD-produced speech segments (PCM 16k, 16-bit, mono) to a remote backend in near real-time.
2. Support both WebSocket streaming (primary) and HTTP chunked/fetch streaming or HTTP/2 (fallback).
3. Receive streaming partial text (tokens) and final transcript from backend.
4. Receive streaming TTS audio (or TTS URL) and play it locally—non-blocking playback while more text arrives.
5. Provide reliable reconnection, auth, encryption, buffering, and backpressure handling.
6. Expose Electron IPC events for UI updates and for other modules (wake, VAD).
7. Provide configuration and monitoring hooks.

---

FILES TO CREATE / UPDATE (full paths)

- /electron/stream/client.js (main streaming client abstraction)
- /electron/stream/wsClient.js (WebSocket streaming implementation)
- /electron/stream/httpClient.js (HTTP chunked / fetch / HTTP2 fallback)
- /electron/stream/serializer.js (formats chunks, headers, metadata)
- /electron/stream/recorder.js (optional: local buffering, local save of conversation)
- /electron/stream/ttsPlayer.js (playback engine for incoming TTS)
- /electron/ipc/stream.js (ipc wiring for stream control)
- Update /electron/main.js (register stream IPC)
- Update /electron/preload.js (expose stream APIs)
- /electron/stream/utils/backoff.js (reconnect/backoff helpers)
- /electron/stream/utils/metrics.js (simple telemetry hooks)
- /electron/stream/config.example.json (config template for endpoints, keys, tls, chunkSize, sampleRate)
- /electron/stream/test/sendFileStream.js (test harness)
- /electron/stream/test/mockServer.js (local mock server for integration tests)

---

PROTOCOL & CHUNK FORMAT (explicit)
A) Chunk Envelope (JSON + binary)

1. JSON control message:
   { "type": "meta", "event":"start_segment", "segment_id":"<uuid>", "sampleRate":16000, "channels":1, "timestamp":"<ISO>" }
2. Binary frame: raw PCM bytes for that chunk (no headers) — preceded by a JSON header frame or length-prefixed envelope.
3. End-of-segment message:
   { "type":"meta", "event":"end_segment", "segment_id":"<uuid>", "durationMs":1234 }

B) Chunking policy

- Default chunk length: 200ms (configurable)
- Reassemble server-side into contiguous stream per segment_id.
- WebSocket: use text frames for JSON control and binary frames for audio.
- HTTP fallback: use multipart/form-data or chunked transfer with matching JSON boundaries.

C) Metadata
Each segment must include:

- segment_id (uuid)
- session_id (per interaction)
- sampleRate
- channels
- codec: "pcm_s16le"
- partialSequence (if splitting segments)
- local timestamps for latency analysis

---

WEBSOCKET CLIENT (wsClient.js) REQUIREMENTS

- Connect with TLS (wss://) and Bearer token or API key in headers.
- Handshake: send `session_start` JSON with client metadata (os, version, sampleRate).
- Implement ping/pong keepalive.
- Streaming:
  - On VAD 'audio:chunk' event: send start_segment → stream binary frames → end_segment.
  - Wait for server acks and partial transcripts.
- Receive messages:
  - { "type":"transcript.partial", "segment_id": "...", "text": "...", "tokens": [...] }
  - { "type":"transcript.final", "segment_id": "...", "text": "..." }
  - { "type":"tts.chunk", "segment_id": "...", "audio": <binary or base64>, "format": "pcm_s16le" }
  - { "type":"error", "code": "...", "message": "..." }
- Emit local IPC events:
  - stream:connected, stream:disconnected, stream:partial, stream:final, stream:tts_chunk, stream:error
- Backpressure:
  - If send queue > threshold, drop or pause mic capture (configurable) and emit ui warning.
- Reconnection:
  - Exponential backoff with jitter in backoff.js.
  - Resume session ideally with same session_id or let server treat as new.

---

HTTP / FETCH FALLBACK (httpClient.js)

- Support chunked POST (Transfer-Encoding: chunked) or WebTransport/HTTP2 if available.
- Use multipart for chunked uploads and SSE for receiving server events (text + tts urls).
- Provide same IPC event contract as wsClient.

---

SERIALIZER (serializer.js)
Provide:

- createStartSegmentEnvelope(meta)
- createAudioFrameBuffer(pcmBuffer)
- createEndSegmentEnvelope(meta)
- encodeControlMessage(obj) -> Buffer/String
- decodeIncomingMessage(payload) -> normalized JS object (handles binary and JSON)
  Support base64 encoding for systems that need it.

---

TTS PLAYBACK (ttsPlayer.js)

- Accept:
  - raw PCM bytes (pcm_s16le, 16k or 24k) OR
  - streamed OGG/MP3 chunks OR
  - remote TTS URL
- If raw PCM:
  - Prefer renderer WebAudio playback: stream audio via ipcMain → preload → renderer and play using WebAudio API.
  - Optionally support native playback (node-speaker) as fallback.
- Provide:
  - playTtsChunk(segment_id, pcmBuffer, sampleRate)
  - stopPlayback()
  - events: tts:started, tts:ended, tts:error
- Non-blocking: allow partial playback as chunks arrive.

---

IPC MAPPINGS & PRELOAD API
Renderer → Main:

- stream:start { sessionId?, token? }
- stream:stop
- stream:setEndpoint { url, headers }
- stream:getStatus

Main → Renderer:

- stream:connected
- stream:disconnected
- stream:partial { segment_id, text, confidence?, tokens? }
- stream:final { segment_id, text }
- stream:tts_chunk { segment_id, pcm_base64, sampleRate }
- stream:error { code, message }
- stream:metrics { rttMs, bytesSent, bytesReceived }

Preload should expose:
window.gnani.stream = {
startStream(options),
stopStream(),
on(event, cb),
setEndpoint(cfg)
}

NOTE: audio:chunk events come from the VAD layer; stream client listens to those and forwards to server.

---

SECURITY & AUTH

- Transport must be TLS (wss:// or https://).
- Support Bearer token auth in headers.
- Allow for mTLS (configurable) — provide placeholders in config.example.json.
- Validate server certificate by default; allow opt-out for dev with explicit flag.
- Do not log raw audio data. Only log metadata hashes.

---

RESILIENCE & OBSERVABILITY

- Metrics in metrics.js:
  - bytesSent, bytesRecv, segmentsSent, reconnects, lastRTT
- Emit metrics via IPC periodically (e.g., every 5s).
- Provide configurable maxRetries, backoff base, jitter.
- Provide optional local save (recorder.js) of raw segments to disk for debugging (rotating files).

---

CONFIG EXAMPLE (/electron/stream/config.example.json)
{
"endpoint": "wss://api.example.com/v1/stream",
"apiKey": "<REPLACE>",
"chunkMs": 200,
"sampleRate": 16000,
"reconnect": {"maxRetries": 10, "baseMs":500, "maxMs":60000},
"tls": {"rejectUnauthorized": true}
}

---

TESTING HOOKS

- /electron/stream/test/sendFileStream.js — loads WAV file and streams it to wsClient to simulate live capture.
- /electron/stream/test/mockServer.js — small local WebSocket server to respond with simulated partial/final transcript and TTS chunks for integration tests.

---

PERFORMANCE & LATENCY NOTES (add as comments in code)

- Aim for end-to-end latency < 400ms for partial text where possible.
- Minimize copies: stream buffers directly; avoid intermediate base64 when using binary frames (use base64 only for IPC boundary if necessary).
- Batch small frames into slightly larger network frames (configurable), but keep chunk size < 500ms to preserve interactivity.

---

EDGE CASES & SAFETY

- If server returns 'rate_limit' or 'auth_error', emit stream:error and stop streaming.
- If network unstable, buffer up to N seconds (configurable), but prefer live over buffering — warn user when buffering.
- If multiple segments overlap, drop the later or serialize them (configurable).
- Ensure session termination cleans all buffers and stops mic capture if requested.

---

OUTPUT REQUIRED FROM GEMINI
Produce full code for the files listed above, with:

- clear comments explaining choices,
- modular, testable functions,
- consistent style with previous electron code,
- CommonJS or ESM matching /electron project style,
- and example usage snippets in comments.

Do NOT implement server-side model logic. Provide only client-side code, test stubs, and config templates.

Also at the end, list any missing items or recommendations not covered in this prompt.
