You are an expert full-stack engineer working inside an Electron + React Vite project.
Your task is to develop a **Jarvis-themed Terminal Conversation Panel** inside Project Gnani.

Project folders:
- Frontend: gnani-rnd
- Backend: gnani-rnd-backend

You must automatically scan the entire project. Discover all components, hooks, contexts, IPC handlers, mic streaming logic, VAD logic, backend streaming, and TTS response flow. DO NOT ask me for file names.

===========================================================
### 🚨 NON-NEGOTIABLE RULES
===========================================================
- DO NOT remove, rewrite, or break existing working functionality.
- DO NOT override VAD, wake word, streaming, STT, LLM response flow, or TTS.
- DO NOT delete code. If something isn’t needed visually, hide it.
- ONLY extend the existing system safely.
- Maintain all existing logic exactly as it is.
- Keep full Jarvis theme consistency.

===========================================================
### 🎯 MAIN GOAL — BUILD “JARVIS TERMINAL CONVERSATION PANEL”
===========================================================
Implement a full-featured futuristic terminal UI that shows:

1. **User messages**
2. **Gnani messages (final LLM output)**
3. **Gnani TTS spoken message**
4. **User live transcript** (from backend streaming text)
5. **Actions performed**
6. **State changes (Idle → Listening → Thinking → Speaking)**
7. **Time stamps, icons, metadata**

===========================================================
### 🔊 AUDIO FLOW — TERMINAL REQUIREMENTS
===========================================================
IMPORTANT NEW REQUIREMENTS:

1. **User Speaking**  
    - The frontend streams audio chunks to backend.  
    - Backend returns text transcripts in streaming chunks.  
    - You MUST capture this incoming text and:  
        - Show the final user transcript in the terminal.  

2. **Gnani Speaking (TTS)**  
    - When Gnani receives the *final complete* LLM response:  
        → TTS starts playing  
    - The terminal must display **the exact same text being spoken**.  
    - This must be 100% synchronized with the TTS logic.

3. **Prevent duplication**  
    - If the model produces stream text or partial text, DO NOT show those as final.  
    - Only final user & Gnani texts go into conversation history.

===========================================================
### 🧠 PROJECT ANALYSIS REQUIREMENTS
===========================================================
You must automatically:
- Find where backend sends STT streaming chunks.
- Detect where final ASR result is produced.
- Find where the final LLM text arrives.
- Find where TTS playback is triggered.
- Integrate all these into the terminal.

===========================================================
### 🛠 TERMINAL FEATURES TO IMPLEMENT
===========================================================

### 1. Terminal UI (Jarvis Hologram Theme)
- Futuristic neon cyan lines
- Glass blur
- Animated hologram grid
- Subtle scanlines
- Smooth fade/slide for messages

### 2. Message Rendering
Every message includes:
- Avatar (User / Gnani)
- Time
- Type label
- Holographic message bubble
- Message animations

### 3. Auto-Scrolling
Terminal must scroll to bottom on new message.

### 4. Conversation Store Structure
Implement a global Context/Store:

```

conversation = [
{
id,
type: 'user' | 'gnani' | 'tts' | 'action' | 'system',
message: string,
timestamp,
metadata: {}
}
]

```

- `type: 'tts'` → for the exact spoken output.

### 5. Integration Hooks
Hook into:
- ASR final transcript events
- LLM final response events
- TTS start events
- Action/command events
- State machine transitions

Then push items into the terminal store.

### 6. State Awareness
Use the existing state machine:

- Idle → show nothing
- Listening → show “User is speaking…”
- Thinking → show “Gnani is processing…”
- Speaking → show “Gnani is speaking…”

States must also appear in the terminal timeline as light system entries.

### 7. Actions Rendering
Examples:
- “📂 Gnani opened file X”
- “🌐 Running web search”
- “🎧 Playing audio”
- “⚙ Executing command…”

### 8. Animations
Use:
- CSS animations or Framer Motion
- Typing effect for Gnani messages
- Pulse/wave effect for TTS messages
- Flicker/glow hologram effects

Offer optimized performance for Electron.

===========================================================
### 🌓 DEBUG PANEL HANDLING
===========================================================
- Analyze the existing debug UI.
- Restyle in compact neon mode OR hide it behind a toggle.
- DO NOT delete or break its code.

===========================================================
### 📁 DELIVERABLES TO PROVIDE
===========================================================
Provide:
- New Terminal components
- Conversation Store
- UI patches to mount terminal panel
- Hooks to ingest user ASR and Gnani TTS messages
- Integration with state machine
- Styling files
- Event bindings for actions and system events
- Conditional UI hiding for old panels (without deletion)

Follow all constraints and ensure full Electron compatibility.
Start now.
