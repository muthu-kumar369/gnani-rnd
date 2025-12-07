**GOAL:** Enable persistent conversations (Save/Load history).
**CONTEXT:** We have a chat UI and a voice UI, but messages disappear on refresh. We need to fetch/save them from the backend.

## Specification

### 1. Backend Updates (Node.js)
Check `gnani-rnd-backend/src/modules/conversation`.
-   Ensure `GET /api/conversations` (List) exists and returns sorted by date.
-   Ensure `GET /api/conversations/:id` (Details) returns full message history.
-   Ensure `POST /api/conversations` (Create) works.
-   **Update:** If necessary, modify `session.coordinator.ts` to ensure *every* user text input and *every* LLM response is saved to the DB associated with the `sessionId` / `conversationId`.

### 2. Frontend Store
Create or Update `react/src/store/useConversationStore.ts`.
-   Actions: `fetchConversations()`, `createConversation()`, `loadConversation(id)`.
-   State: `conversations[]`, `activeConversationId`, `isLoading`.

### 3. Sidebar Integration
-   Connect `Sidebar.tsx` to `useConversationStore`.
-   Render the list of conversations.
-   Clicking a conversation -> `loadConversation(id)` -> Updates `useChatSession` message list.
-   "New Chat" button -> `createConversation()` -> Clears view.

### 4. Application Logic
-   When entering `/chat`, check URL param (e.g., `/chat/:id`) or default to New Chat.
-   Ensure `StreamingClient` updates its `conversationId` when the user switches chats, so new messages go to the right place.

## Tasks
1.  [ ] Backend: Verify/Implement Conversation REST APIs.
2.  [ ] Frontend: Implement `useConversationStore`.
3.  [ ] Frontend: Wire up Sidebar list and selection.

## Test Plan
-   Create new chat. Send "My name is Bond".
-   Refresh page.
-   Verify conversation is in Sidebar.
-   Click it. Verify "My name is Bond" message is restored.
