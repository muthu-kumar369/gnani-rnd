You are an expert full-stack engineer working inside an Electron + React (Vite) project.

Your task:
1. Scan and analyze the entire project yourself (frontend folder: gnani-rnd, backend folder: gnani-rnd-backend).
2. Identify all React components, hooks, contexts, Electron IPC handlers, VAD logic, microphone logic, wake-word flow, backend streaming, and UI rendering code.
3. DO NOT ask me for file names. You must discover everything automatically.

IMPORTANT NON-NEGOTIABLE RULES:
- DO NOT remove, revert, rewrite, or break any existing functionality.
- DO NOT modify or undo any previously working flow (VAD, wake word, streaming, TTS, backend API flow, or response logic).
- DO NOT delete code. If something is not needed in the UI, HIDE it safely, leave the code intact.
- Only extend, enhance, and add new behavior on top of the existing system.
- Maintain the Jarvis-based theme and styling.
- All changes must be 100% compatible with the current working pipeline.

===================================================
### 1. REVIEW EXISTING UI & HIDE UNNECESSARY PARTS
===================================================
You must:
- Scan the existing UI components, layouts, and panels.
- Identify elements that are visually unnecessary, old, duplicated, or interfering with the UX.
- DO NOT delete or refactor them internally.
- Only hide them using conditions, flags, or CSS.
- Ensure hidden components can be re-enabled later if needed.
- Never break or remove corresponding logic.

===================================================
### 2. GNANI STATE MACHINE (Idle → Listening → Thinking → Speaking)
===================================================
Implement assistant states similar to Google Assistant, Siri, Alexa.

States:

1. **IDLE**
   - Default resting UI.
   - Subtle ambient Jarvis-like glow or particle animation.

2. **LISTENING**
   - Triggered when VAD detects speech & streaming begins.
   - Active waveform or ripple animation reacting to mic input.
   - Text label “Listening…” shown clearly.

3. **THINKING**
   - Triggered once streaming stops and waiting for full model response.
   - Futuristic “processing” animation (rotating rings, data pulses).
   - Label “Thinking…”.

4. **SPEAKING**
   - Triggered when the full response is received and TTS begins.
   - Outgoing voice wave animation.
   - Label “Speaking…”.

Notes:
- Create dedicated animation components per state.
- Use smooth transitions.
- Maintain performance in Electron (avoid heavy GPU usage).

===================================================
### 3. STATUS DISPLAY IMPROVEMENT
===================================================
- Show the current state text (Idle, Listening, Thinking, Speaking).
- Place it in a visually appropriate location.
- Styled in Jarvis-themed cyan/blue look.
- Must be clear and readable.

===================================================
### 4. GLOBAL ANIMATION SYSTEM
===================================================
Implement:
- A shared animation wrapper.
- State-specific animation components.
- Reusable waveform renderer.
- Smooth transitions between states.

Use lightweight animation libraries (CSS, Framer Motion, or lightweight Canvas waves).

===================================================
### 5. DEBUG PANEL HANDLING
===================================================
The project already has a debug panel.

Your job:
- If it is useful for development: redesign it in compact futuristic style.
- If not useful visually: hide it using a toggle button.
- DO NOT remove or break the debug panel code.

===================================================
### 6. FUTURE TERMINAL PREPARATION
===================================================
Prepare internal structure for adding a “terminal conversation panel” later:
- A scrolling list showing previous user and Gnani messages.
- DO NOT implement terminal now, only ensure UI architecture allows easy mounting.

===================================================
### 7. IMPLEMENTATION REQUIREMENTS
===================================================
- NEVER break VAD → streaming → response → TTS.
- Never revert previously working features.
- Only extend UI layers.
- Keep Electron compatibility.
- Provide only relevant code snippets, patches, and newly created components.
- Do not output entire files unless necessary.
- Ensure final output includes:
  - Updated state manager or context
  - Updated main UI component
  - New animation components
  - Any needed IPC or hook patches
  - Logic binding state transitions correctly

Start now.
