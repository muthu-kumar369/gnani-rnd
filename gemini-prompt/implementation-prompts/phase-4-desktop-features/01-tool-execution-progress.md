# Stage 1: Tool Execution Progress

## Objective
Implement real-time progress indicators for tool execution. Instead of a generic "Processing..." state, the user should see what specific tool is running and its status (e.g., "🔍 Searching web for 'latest news'...", "📄 Reading file 'data.txt'...").

## Context
Currently, when the LLM decides to call a tool, the system enters a generic "thinking" or "processing" state. The `ToolRegistry` executes the tool asynchronously, but the user has no visibility into this process until it completes.

## Implementation Steps

### 1. Backend Updates (Node.js)

#### [MODIFY] `src/modules/tools/tool.registry.ts`
- Update `executeTool` to accept a callback or event emitter for progress updates.
- Emit events like `tool:start`, `tool:progress`, `tool:end`.

#### [MODIFY] `src/modules/llm/llm.service.ts`
- When `getToolDecision` returns a tool call, subscribe to the tool's progress events.
- Forward these events to the gRPC stream.

#### [MODIFY] `src/grpc.ts` (or `stream.service.ts`)
- Define a new gRPC message type or extend the existing `Response` message to include `ToolProgress`.
- Example structure:
  ```json
  {
    "type": "tool_progress",
    "tool_name": "search_web",
    "status": "running", // or "starting", "completed", "failed"
    "message": "Searching for 'React hooks'...",
    "progress": 50 // optional percentage
  }
  ```

### 2. Frontend Updates (React)

#### [MODIFY] `src/hooks/useIPC.ts`
- Listen for the new `tool_progress` event from the backend (via Electron IPC).
- Expose a `toolProgress` state.

#### [MODIFY] `src/components/gnani/ToolStatusIndicator.tsx` (or create new)
- Create a component that displays the current tool activity.
- Use animations (e.g., spinner, progress bar) and icons based on the tool type.
- Display the status message.

#### [MODIFY] `src/components/gnani/GnaniCore.tsx`
- Integrate `ToolStatusIndicator` into the main UI (e.g., near the input field or in the status bar).
- Ensure it appears when a tool starts and disappears (or shows success) when it finishes.

## Verification
1. Ask Gnani a question that triggers a tool (e.g., "Search for the latest iPhone specs").
2. Verify that the UI shows "Searching web..." immediately.
3. Verify that the status updates if the tool provides progress (optional).
4. Verify that the indicator disappears when the final response starts streaming.
