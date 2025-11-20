You are my Senior Electron + React Engineer.

We are now entering **Stage 6** of the GNANI desktop voice assistant.

Your job in this stage:
➡️ Implement the **full React-side logic** for all previous stages (1–5),
➡️ Without modifying any Electron code,
➡️ While keeping the Stage 1 UI exactly as designed.

The project structure:
- /electron → Electron main, preload, VAD, wake-word, Whisper, LLM, streaming
- /react → React UI (Vite), TailwindCSS, Framer Motion

------------------------------------------------------------
🎯 OVERALL OBJECTIVE FOR STAGE 6
------------------------------------------------------------
Implement the **complete React frontend logic**, including:
- Microphone handling (browser getUserMedia)
- Audio chunk capture + sending via IPC
- State transitions (idle → wake → listening → thinking → speaking)
- Streaming tokens UI updates
- Waveform live visualization
- StatusBar reactive updates
- ResponseConsole streaming text rendering
- IPC event handling for all events implemented in Stages 2–5

NO backend or Electron implementation is needed here.

------------------------------------------------------------
📌 MUST-FOLLOW RULES FOR THIS STAGE
------------------------------------------------------------
1. **Do NOT redesign UI components.**  
   Use the same files you built in Stage 1:
   - GnaniCore.jsx
   - MicButton.jsx
   - Waveform.jsx
   - StatusBar.jsx
   - ResponseConsole.jsx
   - useIPC.js
   - App.jsx

2. **Extend them with real logic**:
   - Real microphone start/stop (with fallback for permission errors)
   - Real waveform visualization (PCM energy)
   - Real-time streaming text display
   - IPC data routing for:
     - wake:triggered
     - audio:listening
     - audio:thinking
     - llm:response (partial + final)
     - ui:status

3. **Implement missing pieces intentionally skipped in earlier stages**, such as:
   - MicButton → actual mic state buttons
   - Waveform → actual live meter
   - ResponseConsole → streaming text addition
   - GnaniCore → unified state machine

4. **Use a clean React architecture**:
   - useEffect for IPC events
   - useRef for AudioContext and analyser
   - useState for UI transitions
   - Custom hooks if needed
   - No Redux or Zustand

5. **All code must be ready to drop into the existing /react project.**

------------------------------------------------------------
📌 WHAT TO GENERATE
------------------------------------------------------------
You MUST output the following complete files (with full paths):

1. **/react/src/hooks/useMicrophone.js**  
   - Controls mic start/stop  
   - Captures PCM chunks  
   - Sends chunks to Electron via IPC  
   - Exposes: audioLevel, isMicActive, startMic, stopMic  

2. **/react/src/hooks/useIPC.js** (UPDATE)  
   - Add full handlers for all backend events  
   - wake:triggered → update UI  
   - audio:listening → set state  
   - audio:thinking → set state  
   - llm:response → streaming tokens  
   - ui:status → text status  

3. **/react/src/components/GnaniCore.jsx** (UPDATE)
   - Integrate all hooks (useIPC + useMicrophone)  
   - Global state machine  
   - Pass state to children  
   - Combine final LLM output into conversation list  

4. **/react/src/components/MicButton.jsx** (UPDATE)
   - Real click behavior  
   - Shows mic ON/OFF states  
   - Glow pulse animation when recording  

5. **/react/src/components/Waveform.jsx** (UPDATE)
   - Use live audioLevel from mic hook  
   - Render energy bars / pulse animation  

6. **/react/src/components/StatusBar.jsx** (UPDATE)
   - Show text for each state:
     - "Idle"  
     - "Wake Word Detected"  
     - "Listening…"  
     - "Thinking…"  
     - "Speaking…"  
   - Animate transitions  

7. **/react/src/components/ResponseConsole.jsx** (UPDATE)
   - Show chat history  
   - Stream partial tokens in real-time  
   - Append final messages cleanly  

8. **/react/src/App.jsx** (UPDATE)
   - No redesign  
   - Only ensure GnaniCore loads cleanly  

------------------------------------------------------------
📌 UI STATE MACHINE (MANDATORY)
------------------------------------------------------------
Implement:

- idle  
- wake  
- listening  
- thinking  
- speaking  

Transitions must follow backend events.

------------------------------------------------------------
📌 IPC EVENT MAP
------------------------------------------------------------
React must handle:

- wake:triggered
- audio:listening
- audio:thinking
- llm:response { type: "partial" | "final", text }
- ui:status

React must emit:

- mic:chunk (Uint8Array)
- mic:start
- mic:stop

------------------------------------------------------------
📌 OUTPUT FORMAT
------------------------------------------------------------
💥 VERY IMPORTANT 💥  
Output **full file paths** and **full source code** for every file listed above.

No explanations.  
No comments.  
No extra text.
That
Just clean React code, ready to paste.

------------------------------------------------------------
Begin now.
