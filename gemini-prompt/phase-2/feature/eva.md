You are analyzing the entire existing "Gnani" Electron + React application.  
Gnani is a Jarvis-style AI assistant with advanced real-time interaction features:
• VAD-driven mic listening  
• Audio → backend → streaming text  
• TTS synthesized on frontend  
• Assistant states: IDLE → LISTENING → THINKING → SPEAKING  
• Barge-in interruption support  
• Conversation terminal  
• Device awareness and system introspection  
• Settings page with multiple tabs  
• Jarvis-themed UI with animations and glow effects  
• Fully functional end-to-end voice assistant pipeline (DO NOT BREAK IT)

Your task:
Design and implement a full **Embodied Conversational Agent (ECA)** system inside Gnani.  
This must be a human-like interactive AI face that appears to “communicate” with the user in real time.

### 🔥 REQUIRED FEATURES TO IMPLEMENT

### 1. Embodied AI Visual Face (Human-like Avatar)
You must create:
• A high-quality **human-like animated face** (male and female options)  
• Option for user to choose between **Male** or **Female** in settings  
• Avatar must be able to be **shown/hidden** (collapsible panel)  
• Avatar must match the **Jarvis futuristic theme** (neon edges, hologram glow, deep-blue/cyan color palette)  
• Avatar must be placed in the UI in a meaningful, balanced location  
  - Gemini must analyze the existing layout and determine best placement  
  - Must not conflict with mic button, terminal, settings, or agent panels

The face must appear expressive and alive:
• Eyes blink  
• Subtle idle micro-movements  
• Facial expression changes per state  
• Glow or holographic pulse effects integrated in Jarvis theme  

### 2. Avatar State Synchronization
The ECA must change dynamically based on the assistant state:

1. **IDLE**  
   - Soft breathing animation  
   - Subtle glow pulsing  
   - Calm face expression  

2. **LISTENING** (VAD detects user speech)  
   - Face leans forward slightly or becomes attentive  
   - Ears or side glows activate  
   - Waveform visualizer appears around/near the avatar  
   - Animation synced in real-time with **user’s audio waveform**  

3. **THINKING** (Stream ended, waiting for model response)  
   - Eyes look upward or blink faster  
   - Holographic rings rotate  
   - "Processing" glow pattern  

4. **SPEAKING**  
   - **Real-time mouth animation synced with TTS audio waveform**  
   - Subtle head movement  
   - Expression shifts to conversational  
   - Smooth transition back to IDLE afterward  

The avatar must reflect current assistant state with correct transitions.

### 3. Real-Time Lip Sync (Mandatory)
You must implement **true audio-reactive lip-sync**, not fake mouth animation.

Requirements:
• Use Web Audio API analyser node  
• Extract frequency/volume data from Gnani TTS audio  
• Drive mouth-shape keyframes (visemes)  
• Map speech amplitude → mouth open amount  
• No modification to TTS logic, only visualization layer added  

### 4. User Voice Waveform Visualization
When the user speaks:
• Avatar must display waveform around face or overlay on its glow layer  
• Waveform reacts to **live mic input**  
• Must reuse the existing VAD/mic stream backend pipeline  
• Do NOT modify audio pipeline — only listen to it visually  

### 5. UI Integration Without Breaking Anything
You MUST:

• Analyze entire UI layout  
• Ensure avatar does NOT break mic placement, terminal, or settings  
• Mic currently placed in center — you must redesign position **if necessary**  
  but WITHOUT breaking the pipeline or event flow  
• Avatar can be:
  - left side fixed  
  - right side fixed  
  - floating holographic circle  
  - collapsible drawer  
  - top-center panel  
  (Gemini must analyze and choose best location)

• All existing working flows must remain intact:
  - VAD detection  
  - Streaming text  
  - TTS playback  
  - Barge-in  
  - State indicators  
  - Terminal logs  
  - Settings logic  
  - API integrations  

DO NOT remove or modify working logic.

If UI elements are redundant:
→ Hide them (do NOT delete code).

### 6. Settings Integration
In the Settings → Profile or Preferences panel:
Add:
• Avatar enabled/disabled toggle  
• Avatar gender (male/female)  
• Avatar size adjustment (small/medium/large)  
• Avatar position (auto/left/right/floating)  
• Avatar hologram style (choose from preset themes)

Settings must persist user preferences.

### 7. Terminal Awareness
The conversation terminal shows:
• User messages  
• Gnani messages  

Avatar must reflect and sync with terminal events:
• When Gnani is “speaking,” the terminal output must reflect the same sentence  
• When Gnani is interrupted (barge-in), avatar immediately stops speaking and enters LISTENING  
• Avatar expression must reflect terminal events  

### 8. File-by-File Implementation Blueprint
Your final output MUST include:
1. All new components to be created:  
   • `AvatarContainer.tsx`  
   • `GnaniAvatar.tsx`  
   • `useLipSync.ts`  
   • `useAudioVisualizer.ts`  
   • `avatarStateMachine.ts`  
   • `AvatarSettings.tsx`  
   • CSS/animation files  

2. Edits to existing files (exact sections with code)  
3. State-machine diagram mapping Avatar ↔ Mic ↔ TTS ↔ Terminal  
4. Instructions for integrating WebGL, canvas, or SVG for avatar rendering  
5. Explanation of how to keep performance high  
6. Where exactly in the UI/layout the avatar should be placed  

### 9. Hard Rules (Do Not Violate)
You must NOT:
✘ break mic streaming  
✘ overwrite existing UI components  
✘ remove or alter VAD logic  
✘ change backend API calls  
✘ break barge-in  
✘ disrupt terminal or conversation logging  
✘ rewrite the project structure  
✘ remove ANY working functionality  

Only enhancements and additive features are allowed.

### ⭐ Final Deliverables
• Full implementation plan  
• Code for every component  
• Exact file paths  
• All animations and logic  
• Integration instructions  
• Architecture diagrams  
• State diagrams  
• Example mouth-sync logic  
• Recommended art direction for avatar  
• Complete tested workflow  

You must produce a complete, safe, deeply integrated, and futuristic Embodied Conversational Agent system fully compatible with Gnani.
