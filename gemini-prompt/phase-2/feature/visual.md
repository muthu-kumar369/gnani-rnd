You are analyzing the complete existing frontend project for “Gnani,” a Jarvis-themed AI assistant built using Electron + React.  
The project already includes:  
• VAD → audio stream → backend → streaming text → TTS  
• Assistant states: IDLE, LISTENING, THINKING, SPEAKING  
• Status indicator for these states  
• Some thinking/loading animations  
• Speaking wave animations  
• A Jarvis-inspired UI theme  
• A terminal for full conversation logs  

IMPORTANT RULES  
-----------------------------------------------  
1. DO NOT BREAK or REMOVE any existing functionality.  
2. DO NOT REVERT any working flow.  
3. If something is not needed visually, HIDE IT — DO NOT DELETE CODE.  
4. Maintain the Jarvis futuristic theme throughout.  
5. Integrate new features into the current flow without altering core logic.  

Your task:  
Implement a **complete Visual Feedback Layer** that matches modern top-tier AI assistants like GPT-4o, Google Gemini, and Alexa.  

You must analyze the entire UI and codebase, detect everything that already exists, and then safely implement the missing components:

### 🔥 REQUIRED FEATURES TO IMPLEMENT
1. **Listening State Indicator (Enhanced)**  
   - If the project already has one, enhance it visually.  
   - Keep the Jarvis holographic aesthetic.  

2. **Thinking / Loading Animation (Enhanced)**  
   - Upgrade the existing animation to a more advanced, futuristic motion.  
   - Maintain compatibility with the THINKING state logic.

3. **Listening Animation Synced with User’s Speech Waveform**
   - Waveform must react in real time to live mic input.
   - Use the existing audio pipeline (VAD, mic stream).
   - Add visualizer components without modifying actual audio logic.

4. **Speaking Animation Synced With Waveform**  
   - Use existing audio stream or speaking state to sync animation.  
   - Improve the waveform with fluid, responsive, and modern animations.  
   - Do NOT break any audio streaming or TTS playback logic.

5. **Advanced Visual Agent Face / Avatar (MANDATORY)**  
   - Create a new visual agent face that feels alive and interactive.  
   - The avatar should react differently for:  
     LISTENING → subtle movement  
     THINKING → processing animation  
     SPEAKING → animated mouth / waveform face / glow pulses  
   - The avatar must remain in Jarvis style (futuristic hologram, digital face, particle effects, etc.).  
   - Avatar animation must sync with Gnani’s actual speaking or VAD listening states.  
   - Use lightweight animations optimized for Electron + React.

6. **Real-Time Token Preview (If not already implemented)**  
   - Show partial tokens/text during THINKING state.  
   - Should not interfere with the TTS or transcription pipeline.  
   - Must be easy to toggle on/off in the UI.

### 🔍 WHAT YOU MUST ANALYZE FIRST
Before making changes, analyze:
• The full existing UI structure  
• Components responsible for VAD, TTS, STT streaming  
• Current state manager implementation  
• All visual animations already present  
• Mic UI + wave animations  
• Layout positioning + theme consistency  

### 🛠️ IMPLEMENTATION GUIDELINES
You must produce:

1. **A complete visual feedback layer plan**  
2. **Exact updated code for all new UI components**  
3. **New or enhanced animations (CSS/JS/Canvas)**  
4. **A responsive design that works inside Electron**  
5. **A new advanced holographic avatar with animations**  
6. **Updated state-machine logic only where required** (no breaking changes)  
7. **File-by-file changes and explanations**  
8. **Strict preservation of existing flow**  

### ⚠️ CRITICAL REQUIREMENTS
- Do NOT break audio streaming logic.  
- Do NOT interrupt the backend flow.  
- Do NOT modify existing API response handling.  
- Do NOT touch working microphone logic except adding visuals.  
- If you must modify a component, ensure backward compatibility.  
- Anything unnecessary should be hidden, not removed.

### 🎨 THEME REQUIREMENTS
Keep everything consistent with the Jarvis cinematic theme:  
• Blue neon glows  
• Circular holographic UI elements  
• Fluid waves  
• Futuristic particle animations  
• Transparent glass UI layers  

### ⭐ FINAL OUTPUT REQUIRED
Provide:
- Step-by-step upgrading plan  
- All new components (avatar, animations, containers)  
- Improved CSS/JS animations  
- Updated state-linked visualization logic  
- File-by-file patches  
- Integration instructions  
- Final recommended UI layout  

You must ensure the result delivers a **top-tier AI assistant UI** comparable to GPT-4o, Google Gemini, or advanced voice assistants—while keeping the entire existing Gnani system fully functional and unchanged in logic.
