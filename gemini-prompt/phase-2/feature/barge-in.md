You are analyzing a complete existing frontend project for "Gnani"—a Jarvis-style AI assistant built with Electron + React.  
The project already has:  
• VAD → audio stream → backend → streaming text → TTS  
• Assistant states: IDLE → LISTENING → THINKING → SPEAKING  
• A Jarvis-based theme  
• Full working flow for speech detection, backend streaming, and TTS  
• A terminal (to be added soon) that will show conversation logs  
• Do NOT break or remove ANY existing functionality under any circumstances.

Your task:
Implement **full barge-in / interruption support** across the entire system while preserving the complete working flow.

### 🔥 What Barge-In Must Do
1. **User interrupts while Gnani is speaking**
   - Immediately stop TTS playback (instantly, no delay).
   - Cancel/stop any pending speech queue.
   - Transition assistant state from SPEAKING → LISTENING.
   - Restart VAD / microphone stream *without requiring user action*.
   - while we need to stop the speaking only and keep the converstation history with the response that we got.

2. **Frontend must send new audio stream instantly**
   - Existing VAD logic must automatically resume streaming audio.
   - Backend must receive the new audio chunks without waiting for previous response cycles.
   - No race conditions, no stuck states.

3. **Frontend UI updates**
   - The visual state must change correctly:  
     SPEAKING → (Interrupted) → LISTENING.
   - Ensure existing animations, waves, Jarvis-style visuals remain untouched.
   - Improve states only if necessary, but do NOT break existing UI.

4. **No functionality regressions**
   - Nothing about the current speech-to-text streaming pipeline should be removed or replaced.
   - No disruption to:
     - VAD  
     - Wake-word logic (if any)
     - TTS
     - Streaming response handling
     - State manager
     - Current animations / waveforms
     - Jarvis theme

### 🔍 What you must analyze
Inspect the entire project structure:
- Components handling mic, audio, VAD, streaming.
- TTS playback system (AudioContext, HTMLAudioElement, or custom player).
- State management logic that controls LISTENING / THINKING / SPEAKING.
- Any existing cancellation or abort controllers.
- Any UI elements tied to mic activity, wave animations, or speaking animations.

### 🛠️ Implementation expectations
You must:
✔ Add a **robust interruption detection mechanism**  
✔ Add a **TTS stop / cancel function** if missing  
✔ Ensure VAD restarts automatically  
✔ Guarantee frontend and backend sync flawlessly  
✔ Update UI state transitions cleanly  

Avoid:
✘ Removing code  
✘ Refactoring major structures  
✘ Breaking existing features  
✘ Changing flow sequences  

If something is unused or visually unnecessary:
– Hide it without deleting the code.  
(We may use it later during terminal development.)

### 🎨 Theme constraints
Keep the **Jarvis theme** consistent:
- Waves, lights, glows, holographic feel.
- Assistant state indicators must look futuristic and AI-driven.
- No theme reset or color palette changes.

### ⭐ Final Output Required
Provide:
1. **Exact file-by-file changes**  
2. **New or updated functions** (with full code)  
3. **Event flow diagram** of how interruption works  
4. **Updated state-machine logic**  
5. **TTS cancel mechanism** integration  
6. **VAD stream restart logic**  
7. **UI updates** (only enhancements, no breaking designs)  
8. **API or callback wiring**, if needed  

Make sure the final result integrates seamlessly into the existing Gnani system and upgrades it with true human-like barge-in behavior like Alexa, Siri, Google Assistant.
