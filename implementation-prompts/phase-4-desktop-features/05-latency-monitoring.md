# Stage 5: Latency Monitoring

## Objective
Implement end-to-end latency tracking to identify bottlenecks in the audio processing pipeline (VAD -> STT -> LLM -> TTS).

## Context
Users perceive latency as the time between them stopping speaking and Gnani starting to speak. We need to measure this breakdown to optimize it.

## Implementation Steps

### 1. Backend Instrumentation

#### [MODIFY] `src/modules/logger/audit.service.ts` (or create `latency.monitor.ts`)
- Create a service to track timing events for a specific `requestId` or `sessionId`.
- Methods: `startTimer(id, stage)`, `endTimer(id, stage)`.

#### [MODIFY] `src/grpc.ts`
- Start timer when `AudioFrame` is received (or VAD triggers).

#### [MODIFY] `src/modules/stt/whisper.service.ts`
- Log time taken for STT transcription.

#### [MODIFY] `src/modules/llm/llm.service.ts`
- Log time to first token (TTFT).
- Log total generation time.

#### [MODIFY] `src/modules/tts/tts.service.ts`
- Log time to generate first audio chunk.

### 2. Logging & Visualization

- Log the collected metrics in a structured format (JSON).
- Example Log:
  ```json
  {
    "type": "latency_report",
    "sessionId": "...",
    "vad_latency": 20ms,
    "stt_latency": 400ms,
    "llm_ttft": 800ms,
    "tts_latency": 200ms,
    "total_e2e": 1420ms
  }
  ```

## Verification
1. Run a conversation flow.
2. Check the backend logs.
3. Verify that a `latency_report` is generated for each turn.
4. Analyze the logs to identify the slowest component.
