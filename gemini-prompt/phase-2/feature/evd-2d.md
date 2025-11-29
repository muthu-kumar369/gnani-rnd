You are assisting as a senior full-stack & realtime avatar systems engineer.

Your task is to analyze the ENTIRE Gnani project codebase end-to-end, including:

• Electron Shell + React Frontend
• Mic & audio streaming pipeline to backend
• Web Audio usage
• STT → LLM → TTS → UI pipeline
• Realtime streaming indicators
• Terminal conversation UI
• Settings screen
• Device awareness module
• Status indicators: idle, listening, thinking, speaking
• Barge-in implementation
• EVA (current static avatar system)

IMPORTANT RULES:
1. DO NOT BREAK or REMOVE any existing functional flow.
2. Hide unused EVA elements but DO NOT DELETE them.
3. Maintain full compatibility with current state machines, IPC channels, events, hooks.
4. Mic → VAD → STT → LLM → TTS → audio-out MUST remain intact.
5. No regression in wake word, barge-in, streaming audio, terminal output.
6. New avatar must extend functionality without replacing or disrupting anything.

====================================================================
                        MAIN OBJECTIVE
====================================================================

Implement a **real-time, expressive, Lottie-based 2D Virtual Human Avatar**
that fully supports:

✔ Male avatar  
✔ Female avatar  
✔ Smooth switching based on user settings  
✔ Full lip-sync + emotion + behavioral animation  
✔ Works on low-end laptops, mobiles, tablets, and Electron

This avatar system must be CPU-light (SVG/Canvas Lottie), NOT GPU-heavy.

This is NOT a 3D avatar.  
This is a high-quality **2D animated virtual human** built using Lottie.

====================================================================
                           AVATAR TYPES
====================================================================

You must build two complete avatar sets:

### MALE AVATAR  
Folder: `avatar/male/`  
Contains Lottie JSON animations:  
• idle.json  
• blink.json  
• listen.json  
• think.json  
• talk_aa.json  
• talk_ee.json  
• talk_oo.json  
• talk_m.json  
• smile.json  
• emotion_happy.json  
• emotion_serious.json  
• emotion_excited.json  

### FEMALE AVATAR  
Folder: `avatar/female/`  
Identical animation structure:  
• idle.json  
• blink.json  
• listen.json  
• think.json  
• talk_aa.json  
• talk_ee.json  
• talk_oo.json  
• talk_m.json  
• smile.json  
• emotion_happy.json  
• emotion_serious.json  
• emotion_excited.json  

====================================================================
                AVATAR SELECTION (SETTINGS INTEGRATION)
====================================================================

Add new options to Settings:

### **Virtual Human → Avatar Type**
• Male  
• Female  
• (Future) Custom Photo-Based Avatar

### **Virtual Human → Avatar Mode**
• ON  
• OFF  
• Reduced Motion Mode (low CPU mode)

### **Virtual Human → Expression Style**
• Neutral  
• Expressive  
• Minimal  

When user selects “Male” → load Lottie animations from `avatar/male/`  
When user selects “Female” → load from `avatar/female/`

Switch MUST happen instantly without reloading the entire app.

====================================================================
                        CORE ANIMATION SYSTEM
====================================================================

Implement new modules:

• `LottieAvatar.tsx`
• `avatar/AvatarStateEngine.ts`
• `avatar/LipSyncEngine.ts`
• `avatar/PhonemeController.ts`
• `avatar/EmotionEngine.ts`
• `avatar/AvatarLoader.ts`
• `avatar/AvatarConfig.ts` (maps male/female animation paths)

Avatar Loader must:

1. Detect selected gender from Settings.
2. Load the correct animation bundle.
3. Preload common animations.
4. Cache animations for fast switching.

====================================================================
                    REAL-TIME LIP SYNC (2D)
====================================================================

Implement a phoneme → animation mapping system for each gender.

Example mapping:

AA  → talk_aa.json  
EE  → talk_ee.json  
OO  → talk_oo.json  
M   → talk_m.json  
Default → neutral mouth  

Speed: 100–150ms transitions  
Sync perfectly with TTS audio output.

Fallback: amplitude-based lip sync if phonemes unavailable.

====================================================================
                BEHAVIORAL STATES (MALE & FEMALE)
====================================================================

States must be identical for both avatars; only animation assets differ.

### IDLE  
• subtle body float  
• soft blinking  

### LISTENING  
• slight forward tilt  
• attentive eyes  

### THINKING  
• eye saccades  
• micro-expression tension  

### SPEAKING  
• phoneme → viseme Lottie mapping  

### EMOTIONS  
(e.g., happy, serious, excited) must blend above any state.

====================================================================
                 INTEGRATION WITH EXISTING GNANI UI
====================================================================

1. Avatar appears in the same location as current EVA.
2. Avatar can be toggled ON/OFF via settings.
3. Avatar must NOT overlap or disturb:
   • mic controls  
   • streaming indicators  
   • terminal   
   • settings UI  

4. Avatar must be responsive and work in:
   • Electron main window  
   • resizable window layouts  

====================================================================
                         PERFORMANCE REQUIREMENTS
====================================================================

• Max CPU usage < 10% on low-end laptops  
• Prefer SVG renderer, fallback to Canvas  
• Idle animation must be light  
• Preload animations efficiently  
• No memory leaks  
• Support Reduced Motion mode (disable micro-motions)  

====================================================================
                     BACKEND INTEGRATION POINTS
====================================================================

Gemini must analyze and define where to emit:

• Phoneme timestamps  
• Emotional tone metadata  
• State-change markers  
• TTS-viseme mapping  

These must not break existing APIs or flows.

====================================================================
                          DELIVERABLES
====================================================================

Gemini must generate:

### A) All new React components + integration  
### B) Avatar switching logic (male ↔ female)  
### C) Phoneme → Lottie mapping system  
### D) Updated Settings UI with gender selector  
### E) Integration guide for Electron preload  
### F) Performance optimization plan  
### G) State machine integration without breaking anything  
### H) Exact folder structure for both avatars  

====================================================================
                     NON-BREAKING GUARANTEES
====================================================================

You MUST NOT break:

• mic → VAD → STT → LLM → TTS  
• wake word  
• barge-in  
• audio output  
• terminal  
• settings  
• device awareness  
• any IPC channels  

Existing EVA code MUST remain intact, only hidden when not used.

====================================================================
                         FINAL OBJECTIVE
====================================================================

Create a **real-time, expressive, phoneme-synced, male/female switchable  
Lottie Virtual Human Avatar** that integrates smoothly into the Gnani  
Electron + React architecture, works on ANY hardware, and behaves  
human-like, emotional, and reactive.

Proceed.
