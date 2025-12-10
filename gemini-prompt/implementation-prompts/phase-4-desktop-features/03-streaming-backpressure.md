# Stage 3: Streaming Backpressure

## Objective
Implement flow control for the LLM text stream to prevent buffer overflows in the Electron main process or the frontend. This ensures stability when the LLM generates text faster than the frontend can process or speak it.

## Context
The LLM generates text chunks which are streamed via gRPC to Electron, and then via IPC to React. If the network or processing is slow, these chunks can accumulate, potentially causing memory spikes or UI freezes.

## Implementation Steps

### 1. Backend Updates (Node.js)

#### [MODIFY] `src/grpc.ts` (gRPC Server)
- Implement a mechanism to check the writable stream's buffer size.
- If `call.writableLength` exceeds a threshold (e.g., 16KB), pause writing until the `drain` event is emitted.
- Example logic:
  ```typescript
  if (!call.write(chunk)) {
      await new Promise(resolve => call.once('drain', resolve));
  }
  ```

### 2. Electron Updates (Main Process)

#### [MODIFY] `electron/stream/client.js`
- Ensure the gRPC client handles backpressure correctly.
- If the IPC channel to the renderer is saturated, pause reading from the gRPC stream (if possible) or buffer intelligently.

### 3. Frontend Updates (React)

#### [MODIFY] `src/hooks/useIPC.ts`
- No major changes expected here, but ensure that the `latestLLMChunk` update doesn't block the main thread.
- Consider using a queue if processing chunks takes time (e.g., complex markdown rendering).

## Verification
1. Simulate a very fast LLM response (mock generator).
2. Simulate a slow frontend (e.g., artificially delay processing).
3. Monitor memory usage of the Electron main process.
4. Verify that the application remains responsive and doesn't crash.
