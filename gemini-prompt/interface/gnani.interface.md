You are my Senior Electron + React Engineer.
We are now starting Stage 1 of the GNANI desktop voice assistant: the full Jarvis-style interface.

Please generate the complete React UI for GNANI inside the /react project.
The UI must follow these rules:

1. Use TailwindCSS for all styling.
2. Use Framer Motion for animations.
3. Style theme: Jarvis-style neon blue, futuristic HUD, glowing edges, soft blur, circular elements.
4. Create the following components with full file paths and code:

   - /react/src/components/GnaniCore.jsx (main interface shell)
   - /react/src/components/MicButton.jsx (central glowing mic control)
   - /react/src/components/Waveform.jsx (animated placeholder for audio visualization)
   - /react/src/components/StatusBar.jsx (wake-word, VAD, streaming status)
   - /react/src/components/ResponseConsole.jsx (conversation UI)
   - /react/src/hooks/useIPC.js (hook for Electron IPC events)
   - Update /react/src/App.jsx to load GnaniCore

5. Include placeholder states for:

   - idle
   - wake-word triggered
   - listening
   - thinking
   - speaking

6. DO NOT implement wake-word, VAD, or audio logic yet.
   Only prepare UI state variables and IPC listener shells.

7. Use this IPC event mapping (do not implement them yet):

   - wake:triggered
   - audio:listening
   - audio:thinking
   - llm:response
   - ui:status

8. Make sure all components are modular and future-proof.

Please output the React code only, with all file paths clearly marked.
Do not include Electron code yet. We will implement that in the next stage.
"
