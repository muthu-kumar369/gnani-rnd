**GOAL:** Make the Chat Interface functional by connecting it to the backend Streaming Client.
**CONTEXT:** `ChatLayout` exists. Now we need to implement the actual chatting mechanism. The backend `StreamingClient` (gRPC) already supports `sendText` and emits `stream:llm_chunk`.

## Specification

### 1. Chat Components
Refactor or Create in `react/src/components/chat/`:
-   **`ChatInput.tsx`**:
    -   Textarea with auto-resize.
    -   "Send" button (Icon).
    -   "Mic" button (Icon) -> *Logic for this comes in Stage 3, just UI for now.*
    -   **Action:** On Enter or Click Send, call `streamingClient.sendText(text)`.
-   **`MessageList.tsx`**:
    -   Virtualized list (optional, or standard map) of messages.
    -   Reuse `components/terminal/MessageBubble.tsx` if possible, or adapt it.
    -   Must support: `user` messages (right aligned), `model` messages (left aligned, streaming).

### 2. State Management (Hook)
Create `react/src/hooks/useChatSession.ts`:
-   **Purpose:** Manages the connection to `StreamingClient`.
-   **State:** `messages[]`, `isStreaming`, `currentResponse`.
-   **Effect:**
    -   Subscribe to `streamingClient` events: `stream:partial`, `stream:final`, `stream:llm_chunk`.
    -   **On `stream:llm_chunk`:** Append tokens to the last assistant message (or `currentResponse`).
    -   **On `stream:final` (STT):** (If we were using Voice) Append user text.
    -   **On User Send:** Optimistically append User Message -> Call `sendText`.

### 3. TTS Restriction (CRITICAL)
-   **Requirement:** In this "Chat Mode", the Assistant should **NOT** speak automatically.
-   **Implementation:**
    -   Check `StreamingClient` or `TtsPlayer` logic.
    -   If `TtsPlayer` listens to the same `stream:llm_chunk` event globally, we might need to modify `main.js` or `TtsPlayer` to respect a flag `isVoiceMode`.
    -   **Hack/Fix:** In `ChatPage`, ensure we don't trigger any audio playback methods. If the backend pushes audio, valid "Mute" state in `useUserStore` or `StreamingClient`.
    -   *Assumption:* The current architecture likely has the frontend triggering TTS upon receiving chunks/text. If so, simply *don't call* the TTS function in `useChatSession`.

### 4. Integration
-   Update `ChatPage.tsx` to use `useChatSession` and render `MessageList` + `ChatInput`.

## Tasks
1.  [ ] Create `useChatSession.ts` hook.
2.  [ ] Create `ChatInput.tsx` wired to `sendText`.
3.  [ ] Create `MessageList.tsx` rendering basic text messages.
4.  [ ] Verify TTS is **OFF** when chatting.

## Test Plan
-   Go to `/chat`.
-   Type "Hello".
-   Verify message appears immediately (Optimistic).
-   Verify "Thinking..." or streaming response appears.
-   **Verify NO AUDIO is played.**
