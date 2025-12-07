# Chat-First Migration Report & Implementation Plan

## Executive Summary
This report outlines the strategy to migrate **Gnani** from its current voice-first, HUD-centric interface to a **Chat-First** architecture similar to ChatGPT/Gemini, while retaining the immersive voice capabilities as a powerful optional mode. The analysis confirms that the backend is already well-structured to support this (supporting both REST and gRPC), and the frontend `TerminalPanel` component provides a solid foundation for the new main chat view. The migration will be executed in **6 distinct stages**, prioritizing stability and incremental value.

---

## 1. Repo Analysis & Inventory

### Codebase Components
*   **Frontend (`gnani-rnd/react`)**:
    *   **Core UI**: `GnaniCore.tsx` (current main orchestrator, handles Voice/HUD), `App.tsx` (routing/auth wrapper).
    *   **Voice/HUD**: `HUDBackground`, `MicButton`, `Waveform`, `StatusDisplay`, `SpokenTextDisplay`.
    *   **Chat/Terminal**: `TerminalPanel` (rich overlay chat), `MessageBubble`, `TextInput` (handles attachments/generations), `ConversationSidebar`.
    *   **State**: `useGnaniStore` (Voice/HUD states), `useConversationStore` (Chat data/persistence), `useUserStore` (Auth).
    *   **Infrastructure**: `useIPC` (Electron comms), `useAudioStream` (gRPC text/audio), `StreamingTTS`.
*   **Backend (`gnani-rnd-backend`)**:
    *   **Server**: `express_server.ts` (REST API), `grpc_server.ts` (Streaming Audio/Text).
    *   **Logic**: `sessionCoordinator`, `modules/conversation`, `modules/stream`.
    *   **Data**: MongoDB (via Mongoose schemas in `src/schemas`).

### Dependency Map (Simulated)
*   **Frontend -> Backend**:
    *   REST (`/api/chat`, `/api/conversations`) -> Used by `useConversationStore` for history, CRUD, and text-only messaging.
    *   gRPC (`StartSession`, `SendAudioStream`) -> Used by `useAudioStream`/`useIPC` for audio packets and real-time transcription.
*   **State Coupling**:
    *   `GnaniCore` is tightly coupled to `useGnaniStore` (UI animations depend on `listening`/`processing`/`speaking` states).
    *   `TerminalPanel` is relatively decoupled, primarily using `useConversationStore`, making it an excellent candidate for promotion to Main View.

### Technical Debt / Hotspots
*   **Tight Coupling in GnaniCore**: Currently, `GnaniCore` assumes it *is* the page. It manages the full screen canvas. This needs to be wrapped into a `VoiceModeContainer`.
*   **Audio Dependency**: The app initializes microphone and wake-word listeners on mount (`GnaniCore` line 237). In a chat-first app, this MUST be lazy-loaded or strictly scoped to "Voice Mode" to avoid privacy concerns and resource drain.

---

## 2. Gap Analysis

| Area | Status | Notes |
| :--- | :--- | :--- |
| **UI Shell** | **Partial** | Current shell is hidden/transparent. Need a standard "App Shell" with permanent Sidebar and Main Content Area. |
| **Chat Interface** | **Ready** | `TerminalPanel` + `TextInput` are mature. `Virtuoso` used for virtualization. Message bubbles support Markdown/Code. |
| **Streaming** | **Ready** | Backend supports full text streaming via gRPC and REST chunking. Frontend handles partials well. |
| **Persistence** | **Ready** | `conversation` module in backend and `useConversationStore` (Zustand + LocalStorage sync) are robust. |
| **Voice Toggle** | **Missing** | Need a specific UI Trigger to switch from Chat View -> Voice HUD Overlay. |
| **Offline Mode** | **Missing** | Prompt mentions `whisper.cpp` but it's not fully integrated for *offline* fallback in the code I saw. (Out of scope for initial UI migration, but noted). |

---

## 3. UX & UI Migration Plan

### New Layout Architecture (Chat-First)
1.  **Main Layout (`ChatLayout.tsx`)**:
    *   **Left Sidebar**: `ConversationSidebar` (Always visible on desktop, drawer on mobile). width: 260px.
    *   **Main Content**: `ChatInterface` (Evolution of `TerminalPanel`).
        *   **Header**: Model Selector, Title, **"Enter Voice Mode" Button**.
        *   **Message List**: Full height, scrollable (`MessageList` component using `Virtuoso`).
        *   **Composer**: Bottom fixed area (`TextInput`), supports file drag/drop.
2.  **Voice Mode Overlay (`VoiceMode.tsx`)**:
    *   Reuses `GnaniCore` components (`HUDBackground`, `MicButton`, `Waveform`) but renders them in a full-screen Modal/Overlay (Z-Index 9999).
    *   **Exit Strategy**: "Close" button or "Switch to Chat" button to return to `ChatLayout`.

### Component Map
*   `[NEW] src/layouts/MainLayout.tsx`: The structural frame (Sidebar + Outlet).
*   `[MOD] src/components/conversation/ConversationSidebar.tsx`: Remove "overlay" logic, make it a structural block.
*   `[MOD] src/components/terminal/TerminalPanel.tsx`: Refactor into `pages/ChatPage.tsx`. Remove "minimize/maximize" logic; it's now the page.
*   `[NEW] src/components/gnani/VoiceOverlay.tsx`: Wrapper for the immersive voice UI.

### Voice Mode Behavior
*   **Toggle**: A "Headphones" or "Waveform" icon in the top-right of the Chat Header.
*   **Action**: Clicking it opens the `VoiceOverlay`.
*   **Microphone**:
    *   **Chat Mode**: Mic is OFF (System Idle).
    *   **Voice Mode**: Mic is ON (Wake word active, VAD active).
*   **Transitions**:
    *   Chat -> Voice: Fade in HUD, start Audio Stream, play "Ready" sound.
    *   Voice -> Chat: Stop Audio Stream, Fade out HUD, show transcript of voice session in Chat History.

---

## 4. Backend & Infra Migration Plan

*   **API Changes**: Minimal changes required.
    *   Existing `/chat` (REST) and gRPC stream already strictly separate Audio/Text handling.
    *   **Optimization**: Ensure `/chat` endpoint supports `stream: true` flag for Server-Sent Events (SSE) if gRPC text streaming is too heavy for simple chat, though current gRPC text stream is fine.
*   **Data Model**: No schema changes required immediately. `ConversationMessage` already supports `type: 'gnani'` vs `type: 'user'`.
*   **Streaming**: Continue using `SendAudioStream` (gRPC) for Voice Mode. Use `sendMessage` (REST/gRPC hybrid in store) for Chat Mode.

---

## 5. Staged Migration Plan

### Stage 1: Structural Refactor & Route Setup
**Goal**: Create the routing shell for Chat-First without destroying the existing UI.
*   **Tasks**:
    1.  Create `src/layouts/MainLayout.tsx` (Sidebar + Content Area).
    2.  Extract `GnaniCore` logic into `src/pages/VoicePage.tsx` (or `VoiceOverlay`).
    3.  Extract `TerminalPanel` content into `src/pages/ChatPage.tsx`.
    4.  Update `App.tsx` router:
        *   `/` -> redirect to `/chat/new`
        *   `/chat/:id` -> `MainLayout` > `ChatPage`
        *   `/voice` -> `VoicePage` (temporary route for testing).
*   **Deliverable**: You can visit `/chat` and see a broken but structural chat view, and `/voice` to see the old HUD.

### Stage 2: The Chat Interface (The "Gemini" Look)
**Goal**: Polish the `ChatPage` to look like a top-tier chat assistant.
*   **Tasks**:
    1.  Style `ChatPage` header (Model selector, Title, Voice Toggle).
    2.  Refactor `TextInput` to start in the center (empty state) and move to bottom (chat state).
    3.  Enhance `MessageBubble` styling (Avatar, copy buttons, better code blocks).
    4.  Ensure `Virtuoso` auto-scroll works perfectly in full-page mode.
*   **Deliverable**: A fully functional, beautiful text chat interface.

### Stage 3: The Voice Overlay Integration
**Goal**: Re-integrate `GnaniCore` as an on-demand modal.
*   **Tasks**:
    1.  Wrap `VoicePage` logic into a `VoiceOverlay` component.
    2.  Ensure `useMicrophone` and `useAudioStream` only activate when Overlay is mounted/visible.
    3.  Add "Exit" button to Overlay.
    4.  Add "Enter Voice Mode" button to `ChatPage` header.
*   **Deliverable**: Click button -> Full screen HUD appears -> Talk -> Click Exit -> Return to chat with history updated.

### Stage 4: Sidebar & Navigation Deep Dive
**Goal**: Robust conversation management.
*   **Tasks**:
    1.  Refactor `ConversationSidebar` to be permanent (desktop) / drawer (mobile).
    2.  Add "New Chat" button prominent at top of sidebar.
    3.  Group history by "Today", "Yesterday", "Previous 7 days".
    4.  Add "Search Conversations" (frontend filtering first).
*   **Deliverable**: Seamless navigation between chats.

### Stage 5: Polish & Interactions
**Goal**: Micro-interactions and smooth transitions.
*   **Tasks**:
    1.  Add `Frramer Motion` layout transitions between Chat/Voice modes.
    2.  Add "Thinking" states in Chat (dots animation).
    3.  Ensure "Stop Generation" works in Chat mode (calling `cancelStream`).
*   **Deliverable**: App feels "Premium" and "Alive".

### Stage 6: Cleanup & Optimization
**Goal**: Remove legacy "Voice-First" assumptions.
*   **Tasks**:
    1.  Remove `GnaniCore` as a standalone route.
    2.  Audit `useAudioStream` to ensure no background listener leaks.
    3.  Verify memory usage when switching modes repeatedly.

---

## 6. Developer Prompts (Gemini Sub-Prompts)

**Stage 1: Refactor Structure**
> "I need to restructuring the Gnani frontend. Please create `src/layouts/DashboardLayout.tsx` which uses `ConversationSidebar` on the left and an `Outlet` on the right. Then, create `src/pages/ChatPage.tsx` by extracting the core message list and input logic from `TerminalPanel.tsx`. Update `App.tsx` to use these new routes, keeping `GnaniCore` strictly on a separate `/voice` test route for now."

**Stage 2: UI Polish**
> "Let's polish the `ChatPage.tsx`. Please modify the `MessageBubble` component to look more like Gemini (cleaner typography, distinct background for user vs assistant). Refactor the `TextInput` to center itself when there are no messages (Welcome Screen) and animate to the bottom when the conversation starts. Add a Header with a mocked 'Model Selector' dropdown."

**Stage 3: Voice Integration**
> "Now let's integrate the old voice UI. Create a `VoiceModeModal.tsx` that wraps the contents of the old `GnaniCore`. It should take an `isOpen` prop and `onClose` callback. When `isOpen` is false, ensure all microphone streams are stopped. When true, initialize the VAD. Add a 'Headphones' button to the `ChatPage` header that toggles this modal."

---

## 7. Risks & Mitigations
| Risk | Mitigation |
| :--- | :--- |
| **Microphone Leaks** | Audio stream stays open in background. **Fix**: Explicit cleanup in `useEffect` cleanup function of `VoiceOverlay`. |
| **State Sync** | Chat doesn't update after Voice session. **Fix**: `VoiceOverlay` uses the same `useConversationStore`. `useEffect` in ChatPage listens for store changes. |
| **Mobile Layout** | Sidebar takes too much space. **Fix**: Use `Sheet` / `Drawer` pattern for mobile sidebar. |

## 8. Summary
This migration shifts Gnani from a "Voice HUD" to a "Chat Powerhouse". By leveraging the existing modular backend and robust `TerminalPanel` frontend logic, we can achieve this transformation with high confidence. The result will be a familiar, productivity-focused Chat UI with a "superpower" button that instantly transports the user into the immersive voice experience they already love.
