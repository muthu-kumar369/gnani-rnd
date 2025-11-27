You are upgrading a real-time assistant system built with:
- gnani-rnd (Electron + React frontend)
- gnani-rnd-backend (Node.js backend)

IMPORTANT PROJECT BEHAVIOR:
• The frontend records audio → sends audio chunks to backend.
• The backend streams TEXT back to the frontend.
• The frontend converts streamed text chunks into TTS audio.
• Mic and VAD must continuously restart after the assistant finishes speaking.

YOUR TASK:
Analyze the existing project and FIX ONLY the broken parts without changing the high-level design or breaking any working features.

DO NOT ASK ME FOR FILE NAMES.  
Detect the correct files and update them directly.

────────────────────────────────────────
### STRICT RULES — READ CAREFULLY

1. **DO NOT remove any existing functionality.**
2. **DO NOT break any existing working flow.**
3. **DO NOT rewrite the system architecture.**
4. **DO NOT delete or replace working logic such as:**
   - audio capture
   - audio streaming
   - backend stream route
   - TTS integration
   - conversation UI updates
5. **Only patch or extend the required places.**
6. **Reuse all existing utility functions, hooks, handlers, and modules.**
7. **If something is already working, leave it untouched.**
8. **Fix only the bugs and missing logic.**

────────────────────────────────────────
### FIX THESE BUGS ONLY:

1. **Mic & VAD stop after first interaction**
   • After TTS finishes speaking, mic must automatically restart.
   • VAD must resume listening without user action.
   • Implement the “listen → think → speak → auto-listen again” loop.

2. **Audio chunks not being sent again to backend after first response**
   • Frontend must resume sending audio chunks using the EXISTING logic.
   • Only repair the loop and state transitions.

3. **Backend sends broken or incomplete words**
   • Implement partial → final stabilization:
        { type: "partial", text: "sta" }
        { type: "partial", text: "start" }
        { type: "final", text: "start the music" }
   • Only send partials when text is stable enough.
   • Only send final tokens once completed.

4. **Frontend repetition issue (e.g., “can can can can…” )**
   • Frontend must NOT append partial chunks.
   • Replace the existing partial text each time.
   • Append ONLY final stabilized chunks.

5. **LLM repeating tokens**
   Add anti-loop generation in backend:
       temperature: 0.2
       top_p: 0.9
       frequency_penalty: 0.7
       presence_penalty: 0.2
   Add token repetition guard on server side.

6. **Frontend TTS streaming must control mic state correctly**
   • While TTS is speaking, mic + VAD must pause.
   • After TTS finishes, restart VAD + mic automatically.
   • Use existing TTS logic; only patch timing & state control.

────────────────────────────────────────
### ADDITIONAL REQUIREMENTS:

• DO NOT rebuild or replace audio sending logic.  
  Analyze the existing functions and patch only where needed.

• DO NOT change the backend → frontend → TTS architecture.  
  Keep the text-streaming design exactly as it is.

• ONLY modify:
    - VAD resume logic
    - mic restart logic
    - partial/stable text handling
    - repetition suppression
    - stream correctness

• Maintain full compatibility with the current UI, event handlers, and WebAudio modules.

────────────────────────────────────────
### DELIVERABLES IN YOUR RESPONSE:

1. A clear explanation of:
   • what was broken
   • why the loop stopped
   • what caused repetition & instability

2. A list of ALL files you modify (frontend + backend).

3. Provide COMPLETE updated code for every changed file:
   • VAD auto-restart logic
   • mic stream restart logic
   • backend text stabilizer
   • repetition suppression
   • frontend partial/final handlers
   • TTS playback → mic resume flow

4. Ensure ALL existing features still work exactly as before.

Start now and provide the updated code.
