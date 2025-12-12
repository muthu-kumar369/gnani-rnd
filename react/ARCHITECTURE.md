# Gnani Architecture

## Overview

Gnani uses a **Hybrid State Management** approach, combining **Zustand** for global app state and **XState** for complex behavioral logic (Voice Mode).

## 🏗️ Core Systems

### 1. State Management (`src/store`)
- **`useConversationStore`**: Manages the chat history, current session, and message branching. Persists to `localStorage`.
- **`useGnaniStore`**: Manages the transient state of the Voice Assistant (Listening, Thinking, etc.) and bridges the XState machine to the UI.
- **`useUserStore`**: Handles user authentication, settings, and preferences.

### 2. Voice System (`src/components/gnani`)
The voice system is encapsulated in `GnaniCore.tsx`, which serves as the orchestrator for:
- **Audio Input**: `useMicrophone` hook for accessing media streams.
- **IPC**: `useIPC` hook for communicating with the Electron/Python backend (Wake Word, VAD, TTS).
- **Visuals**: Renders the holographic HUD and `VoiceModeOverlay`.

#### State Machine (`src/machines/gnaniStateMachine.ts`)
The `GnaniStateMachine` defines valid transitions to ensure deterministic behavior:
- `idle`: Waiting for Wake Word.
- `listening`: Capturing user speech (VAD Active).
- `thinking`: Processing STT and waiting for LLM response.
- `speaking`: Playing back TTS audio.

### 3. Mode Transitions
Gnani seamlessly switches between **Chat Mode** (standard web UI) and **Voice Mode** (overlay).
- **Chat Mode**: `ChatPage.tsx` renders `Sidebar` and `MessageList`.
- **Voice Mode**: `ChatPage.tsx` overlays `VoiceModeOverlay` (containing `GnaniCore`).
- **Cleanup**: When switching out of Voice Mode, `GnaniCore` triggers a rigorous cleanup (`stopMic`, `reset` state) to prevent resource leaks.

### 4. Data Synchronization
User inputs from Voice Mode are synchronized to the `ConversationStore` via `StateManager.tsx`.
- **Flow**: `Voice Input` -> `Backend STT` -> `IPC Event` -> `StateManager` -> `addMessage()` -> `ConversationStore`.

## 📁 Directory Structure

```
src/
├── api/             # API clients (axios)
├── components/
│   ├── chat/        # Chat interface components
│   ├── common/      # Shared UI components (Feedback, CodeBlock)
│   ├── gnani/       # Voice Mode components (HUD, Overlay)
│   └── terminal/    # Terminal-style output for Voice Mode
├── hooks/           # Custom React hooks
├── machines/        # XState machine definitions
├── pages/           # Main route pages
├── state/           # State machine types
├── store/           # Zustand stores
├── styles/          # Global styles & Tailwind
└── utils/           # Helper functions
```
