You are an expert architect for Electron, React, Node.js, and gRPC real-time streaming systems.

We are building an AI agent app called “Gnani”.  
The existing system already has a complete voice-based conversation loop:

1. User speaks through mic.
2. Frontend streams audio to backend.
3. Backend processes speech, builds context + prompt.
4. Model responds (stream).
5. Backend streams output back to frontend over gRPC.
6. Frontend synthesizes speech (TTS) and plays it.
7. Conversation terminal updates with User → Gnani messages.
8. UI continuously updates status indicators: **Listening → Thinking → Speaking**.

This ENTIRE voice flow already works perfectly.  
You MUST NOT break, modify, or interfere with the existing voice pipeline.

---------------------------------------------------------------
NOW I WANT TO ADD A NEW OPTIONAL FEATURE: **TEXT INPUT MODE**
---------------------------------------------------------------
User clicks a button in the Conversation Terminal → an advanced input UI appears → user types or pastes text → presses Enter/Submit → frontend sends text to backend → backend runs the SAME agent pipeline (context + prompt) → backend streams response → frontend speaks using the SAME TTS + displays in conversation terminal.

REQUIREMENTS (VERY IMPORTANT)
-----------------------------------------
1. You MUST analyze the existing architecture:
   - Frontend app: gnani-rnd (React, Electron preload, IPC, gRPC client)
   - Backend app: gnani-rnd-backend (Node.js, gRPC server, agent pipeline)
   - Existing voice flow components (ASR, context builder, prompt builder, TTS)
   - Existing conversation terminal UI
   - Existing status indicators (Listening/Thinking/Speaking)
   - Existing theme/styling used across the app

2. The NEW TEXT INPUT FLOW must:
   - Reuse the SAME backend pipeline as voice (context → prompt → model → TTS)
   - Use the SAME gRPC streaming structure
   - Update the conversation terminal in the SAME way as voice messages
   - Trigger the SAME status indicators:
       * Before backend request → “Thinking”
       * During TTS streaming → “Speaking”
       * After completion → revert to idle state
   - Blend seamlessly with the existing theme and UI styling.

3. Describe an ADVANCED INPUT FIELD DESIGN:
   - Modern floating panel that slides out or expands from the conversation terminal
   - Auto-resizing textarea with smooth expand animation
   - Paste-friendly (large texts supported)
   - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
   - Integrated submit button matching the existing theme
   - A clean “close/cancel” UI
   - Must visually match the existing Gnani color palette and design system
   - Fully responsive inside Electron

4. Provide:
   - Updated architectural diagram of the combined **voice + text** unified pipeline
   - File-by-file changes required in:
        * React conversation terminal component(s)
        * Input box new component
        * Electron preload IPC bridge (if needed)
        * gRPC client handler
        * Backend gRPC server handler
        * Backend agent pipeline (where text input enters)
   - COMPLETE CODE for:
        * New TextInput React component
        * Conversation Terminal modifications
        * Status indicator updates
        * gRPC request for text input
        * Backend handler receiving text input
        * Prompt/context builder updates
   - How to unify both flows without code duplication.

5. Explain how to avoid common issues:
   - Don’t break the existing microphone flow.
   - Don’t create a second conflicting gRPC stream type.
   - Don’t block UI while typing or while backend is processing.
   - Avoid race conditions between text and voice flows.
   - Avoid duplicate updates in conversation terminal.

6. Deliver a final production-grade design and code for the fully integrated system.

Begin by summarizing your understanding of the existing Gnani system, then propose the updated architecture, then provide full code and reasoning.
