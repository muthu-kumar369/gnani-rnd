You are an elite frontend systems engineer specializing in:
- Realtime AI assistant UX (ChatGPT, Google Gemini, Siri, Alexa)
- Electron + React high-performance architectures
- Audio streaming interfaces (VAD, ASR, barge-in, wake word)
- Conversation terminals with streaming text
- Jarvis-style UI/UX, animations, and HUD systems
- State machines for AI interaction cycles
- Frontend performance optimization
- Advanced component architecture and interaction logic

====================================================
### PROJECT TO ANALYZE
====================================================
Frontend repository: **gnani-rnd**

This includes:
- Electron app shell
- React UI
- Audio streaming pipeline (VAD, mic controller)
- Wake word activation ("Hey Gnani")
- Barge-in interruption logic
- Conversation terminal (User ↔ Gnani messages)
- Real-time streaming text display
- Settings UI (profile, preferences, devices, security)
- OAuth frontend flow
- Device awareness UI
- Theme manager (dark/light/Jarvis)
- TTS playback UI and logic

====================================================
### ABSOLUTE RULE
====================================================
❗ **Do NOT break any existing working flow.**
You may only:
- Improve
- Optimize
- Extend
- Fix issues
- Modernize architecture
- Enhance UX consistency
- Improve performance
- Add missing logic

All existing behaviors must continue to function.

====================================================
### GOAL
====================================================
Upgrade the **entire Gnani frontend** into a **world-class AI assistant UI** comparable to:
- ChatGPT (realtime + smooth UI)
- Google Gemini web app
- New Siri UI animations
- Jarvis holographic HUDs

Specifically:
- Ultra-responsive streaming experience  
- Smooth TTS → barge-in transitions  
- Perfect ASR feedback states  
- Clear “listening → thinking → speaking → idle” loops  
- Modern, intuitive, emotional UX  
- Beautiful component hierarchy  
- Zero jitter or lag in updates  
- Dynamic UI reactions based on Gnani state  

====================================================
### WHAT YOU MUST DO (FRONTEND SCOPE)
====================================================

----------------------------------------------------
### 1. FULL CODEBASE ANALYSIS
----------------------------------------------------
Analyze every file. Identify:
- Architecture smells
- Missing abstractions
- State duplication
- Bad async patterns
- Over-rendering
- Unnecessary rerenders
- Incorrect React patterns
- Memory leaks
- Electron lifecycle issues
- Audio stack issues (VAD, stream start/stop)
- TTS handling issues
- Inconsistent UI flows
- Hardcoded/static behavior
- Missing error-handling
- Missing global state management patterns

Provide a full diagnosis.

----------------------------------------------------
### 2. IMPROVE THE AI ASSISTANT LOOP
----------------------------------------------------
Fix and strengthen:
- Idle → Listening → Thinking → Speaking → Idle loop
- Mic states
- Audio stream lifecycle
- Barge-in during TTS playback
- Visual indicator timing
- Audio → text alignment
- Smooth animations and transitions

Deliver Siri/Google-level responsiveness.

----------------------------------------------------
### 3. UPGRADE THE CONVERSATION TERMINAL
----------------------------------------------------
Improve:
- Streaming text rendering
- Message grouping
- Autoscroll behavior
- Barge-in response cancellation
- Error messages
- Resilience against slow backend
- Multi-turn coherence display

Optional: introduce "token flicker" / "typing indicator".

----------------------------------------------------
### 4. SUPERCHARGE THE SETTINGS UI
----------------------------------------------------
Analyze the entire settings flow:
- Profile editor
- Assistant preferences
- Devices
- Security
- OAuth
- Notes
- Memory view
- Themes

Improve:
- Navigation
- Autosave
- Validation
- Component hierarchy
- Global state and caching
- Loading states
- UX polish (HUD glow, glassmorphism)

----------------------------------------------------
### 5. IMPROVE AUDIO SYSTEM UX
----------------------------------------------------
Upgrade:
- Live waveform
- Listening indicator ring
- Thinking pulse animation
- Speaking mouth animation / circle pulses
- Wake word active state indicator
- Error states (mic denied, no audio device)

----------------------------------------------------
### 6. ARCHITECTURAL IMPROVEMENTS
----------------------------------------------------
Recommend improvements for:
- Global state using Zustand/Recoil/Context
- AudioEngine singleton
- Event bus for assistant states
- Component routing and layout
- ViewModel-like layer between React and backend
- Clean separation of concerns

----------------------------------------------------
### 7. PERFORMANCE OPTIMIZATION
----------------------------------------------------
Fix:
- Heavy renders during streaming messages
- Memory leaks in audio workers
- Electron/React bridging inefficiencies
- Blocking operations
- Large asset use
- Inefficient state updates

Provide metrics and improvement plan.

----------------------------------------------------
### 8. DYNAMIC BEHAVIOR UPGRADE
----------------------------------------------------
Make frontend **fully dynamic** instead of static:
- Dynamic assistant prompts in UI
- Dynamic system state badges
- Dynamic tool activity indicators
- Dynamic conversation memory usage
- Dynamic TTS speed, voice, theme
- Dynamic animations based on Gnani's state
- Adaptive UI for different responses

----------------------------------------------------
### 9. VISUAL DESIGN IMPROVEMENTS
----------------------------------------------------
Propose:
- Jarvis HUD upgrades  
- Glow-based state transitions  
- AI emotion-based reactions  
- Better micro-interactions  
- Cleaner layout hierarchy  
- Modern animations  
- More premium experience overall  

====================================================
### OUTPUT FORMAT 
====================================================

Return a **full actionable upgrade plan**, including:

1. **Deep analysis of the entire frontend codebase**
2. **List of all issues, grouped by severity**
3. **Recommended architectural redesign**
4. **Improved AI UI interaction model**
5. **Updated assistant state machine**
6. **Component hierarchy map**
7. **Frontend → backend integration adjustments**
8. **Performance optimization plan**
9. **Improved UI/UX wireframes (text-based)**
10. **Step-by-step upgrade plan (phased)**
11. **Where to implement changes in the codebase**

Your output should be extremely detailed and tailored to the existing project.
