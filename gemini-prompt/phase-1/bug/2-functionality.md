You are my Senior Electron + React Engineer.

The latest UI upgrade replaced or removed previously working features.
You must now fully RESTORE all functionality while keeping the new advanced JARVIS UI exactly as designed.

---

## 🎯 GOAL

Merge BOTH:

1. The new advanced holographic JARVIS UI
2. The old complete working logic from Stage 6:
   - Microphone streaming
   - Wake word events
   - Audio listening events
   - Thinking state
   - Speaking state
   - IPC event mapping
   - StatusBar reactive updates
   - ResponseConsole streaming output
   - Waveform live audio level
   - Unified state machine in GnaniCore

You must **NOT REMOVE OR BREAK ANY FUNCTIONALITY** that previously worked.

---

## 📌 FIXES NEEDED

1. Restore all microphone logic from Stage 6.
2. Restore the wake word → listening → thinking → speaking state flow.
3. Reconnect IPC events:
   - wake:triggered
   - audio:listening
   - audio:thinking
   - llm:response (partial/final)
   - ui:status
4. Re-enable mic:start and mic:stop events.
5. Re-enable mic:chunk streaming to Electron.
6. Reconnect ResponseConsole to stream tokens again.
7. Fix Waveform so it uses live audioLevel.
8. Restore HUD animations that depend on mic state and LLM state.

---

## 🎤 MICROPHONE DESIGN FIX

Improve the MicButton:

- Larger size (150–200px)
- Always visible
- Floating bottom-center OR center-bottom HUD
- High-contrast neon glow
- Pulsing hologram rings when active
- Idle subtle breathing effect
- Hover brightening
- Perfectly visible over the background

Place it in a **dedicated floating layer** so it is never hidden behind HUD animations.

---

## 📁 FILES TO UPDATE (MANDATORY)

Update these files with FULL restored logic + new UI:

1. /react/src/hooks/useMicrophone.js
2. /react/src/hooks/useIPC.js
3. /react/src/components/GnaniCore.jsx
4. /react/src/components/MicButton.jsx
5. /react/src/components/Waveform.jsx
6. /react/src/components/StatusBar.jsx
7. /react/src/components/ResponseConsole.jsx
8. /react/src/App.jsx

Do NOT modify Electron code.

---

## 📌 RULES

- KEEP the new holographic UI styling from the last output.
- RESTORE the old functionality exactly as it was in Stage 6.
- MERGE logically and visually cleanly.
- DO NOT overwrite or remove any necessary feature.
- UI-first, but functionality must be 100% restored.
- Output ONLY full file paths + full updated code.
- No explanations, no comments.

---

Begin merging now.
