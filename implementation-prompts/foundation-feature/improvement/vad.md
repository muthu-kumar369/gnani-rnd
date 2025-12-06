You are analyzing my Electron + React frontend for the “Gnani” AI assistant. I want you to deeply inspect the complete audio capture and VAD logic in the frontend. This includes the WebRTC/microphone stream, audio processing pipeline, VAD integration, UI state updates, and the gRPC audio streaming flow.

Our current VAD (Voice Activity Detection) implementation is NOT working as expected. Your task is to fully understand the existing architecture and fix it without breaking the backend communication or any existing input/response flow.

---

# 🔥 What VAD SHOULD do (expected behavior)
1. It should detect **actual human speech**, not background noise.
2. It should trigger **start of audio stream** to backend ONLY:
   - When user begins speaking.
3. It should trigger **end of audio stream** ONLY:
   - When user stops speaking for the configured silence threshold.
4. It should NOT start streaming when **Gnani replies via TTS**.
5. It must coexist perfectly with:
   - Mic input pipeline
   - gRPC duplex streaming
   - TTS output pipeline
   - UI state updates (listening / not listening / speaking)

---

# 🔍 Problems Gemini MUST analyze automatically
Gemini must scan the entire codebase to identify:

### 1. Incorrect VAD logic
- VAD detecting noise or silence as speech
- VAD not correctly identifying end-of-speech
- Events firing too early or too late
- Over-sensitive or under-sensitive thresholds
- Misuse of RMS/energy-based VAD
- Incorrect integration with WebAudio API ScriptProcessor or AudioWorklet

### 2. Self-triggering
Gnani's TTS audio is being picked up by mic → VAD triggers → starts new gRPC stream → backend gets garbage audio.

Gemini must figure out WHY:
- Poor echo cancellation?
- Wrong audio constraints?
- Incorrect WebAudio routing?
- Missing “speaking state” suppression?
- No logic preventing VAD from triggering during TTS playback?

### 3. Incorrect coordination with gRPC stream
Gemini must check:
- Audio chunks encoding (16k, 48k, PCM16, float32 → PCM conversion)
- Stream start/end flags
- Logic that sets “isFinal”, “end-of-stream”, etc.
- Incorrect state transitions
- Race conditions between VAD events and gRPC events

### 4. Existing logic that MUST NOT break
- Backend gRPC expects a certain flow:
    - Start stream when speech begins
    - Send audio chunks continuously
    - End stream on silence
- Text input and TTS response flow
- UI components depending on listening state

Gemini must preserve **ALL** of these.

---

# 🎯 What Gemini MUST deliver

## 1. Full analysis of the current VAD implementation
Gemini must:
- Read the entire audio pipeline code
- Understand how VAD is initialized, thresholds, filters
- Detect errors in:
  - buffer sizes
  - audio sample conversion
  - start/stop callbacks
  - logic handling

## 2. Identify root causes for:
- Misfiring start-of-speech
- Misfiring end-of-speech
- Self-triggering during Gnani speech

## 3. A corrected VAD architecture
Gemini must produce a revised plan that includes:

### ✔ Frontend VAD improvements
- Optional WebRTC noise suppression + autoGain off  
- Custom energy threshold tuning  
- Robust, debounced start/stop detection  
- Buffered approach (detect N consecutive frames)  
- Correct timing windows (startDelay, endDelay)

### ✔ Self-trigger prevention
Gemini must implement one or more of the following:
- "Gnani speaking" flag → disable VAD until TTS ends  
- Ducking backend TTS audio path out of input graph  
- Using WebAudio’s `echoCancellation` + proper routing  
- Filtering on output device audio  

Gemini must choose the cleanest solution and implement it.

### ✔ Correct stream boundary logic
- Start stream → ONLY once per utterance
- Continue sending audio chunks
- Stop stream → ONLY after silence
- No duplicate starts or missing ends
- No infinite active stream after VAD stops

## 4. Implementation instructions for each file
Gemini must output:
- BEFORE → existing buggy code
- AFTER → corrected code  
For:
- VAD module  
- Audio Worklet or ScriptProcessor  
- gRPC stream handler  
- TTS playback handler  
- State management (listening/speaking flags)  
- UI updates  

## 5. Advanced improvements Gemini should propose
- Frame smoothing  
- RMS + zero-crossing combination  
- Adaptive thresholding  
- TTS audio-protection gating  
- Grace period logic  
- Edge-case protection fixes  

## 6. A final integrated pipeline diagram
Gemini must generate:
- Full audio flow diagram  
- Start/end detection timeline  
- State machine for:
    - Idle  
    - Listening  
    - Speaking  
    - Processing  

## 7. A stability checklist
Gemini must output:
- Test cases  
- Debug logs to add  
- Validation checklist for production  

---

# ❗ Important
- DO NOT break existing gRPC request/response flow.
- DO NOT break TTS output.
- DO NOT change message handling that works.
- Only fix VAD + improve stability + prevent Gnani’s voice from triggering VAD.
- All changes must match the existing architecture style.

---

Now deeply analyze the entire frontend project, understand the complete audio/VAD/gRPC pipeline, and provide the corrected implementation with detailed reasoning, code fixes, diagrams, and final integration steps.
