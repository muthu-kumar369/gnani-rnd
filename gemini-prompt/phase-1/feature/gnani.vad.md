"
You are my Senior Electron Engineer.

We completed Stage 3 (Wake-word). Now implement Stage 4:
VOICE ACTIVITY DETECTION (VAD) and speech-segmentation.

Follow these rules strictly — produce only electron-side code and full file paths.

---

## 1) Purpose

Implement a pluggable VAD subsystem that:

- Listens to microphone frames (16k, 16-bit PCM) from micCapture.js
- Detects when speech starts and ends (speech segments)
- Emits speech segment buffers as contiguous PCM chunks
- Emits IPC events to renderer:
  - audio:listening (when speech starts)
  - audio:chunk (when a speech segment is ready — send PCM buffer + metadata)
  - audio:ended (when speech ends)
- DOES NOT perform STT, wake-word, or streaming.

---

## 2) Recommended approach / fallback

Implement two detector backends with automatic fallback:
A) Primary: Node WebRTC VAD (e.g., node-webrtc-vad or webrtcvad binding)
B) Fallback: Silero VAD via a Python child_process bridge (silero_vad.py) if native binding unavailable

The VAD module should auto-select the available backend at runtime and log the chosen backend via logger.js.

---

## 3) Files to create / update (full paths)

- /electron/vad/vadEngine.js (VAD abstraction, choose backend)
- /electron/vad/backend/webrtcVad.js (WebRTC binding wrapper)
- /electron/vad/backend/sileroBridge.js (Python bridge wrapper — spawn child_process)
- /electron/vad/vadManager.js (segmenter + state machine + buffering)
- /electron/ipc/vad.js (ipc wiring, register channels)
- Update /electron/main.js (register VAD IPC)
- Update /electron/preload.js (expose VAD APIs)
- /electron/vad/utils/pcmUtils.js (helpers: resample, ensure 16k, concat buffers)
- Use logger.js for all logs

---

## 4) vadEngine.js responsibilities

- detectBackend() -> picks 'webrtc' or 'silero'
- init(options) -> sampleRate (default 16000), frameSize (default 30ms), aggressiveness
- processAudioFrame(frame) -> feed frames into selected backend
- destroy()

Backend implementations should expose:

- init(opts)
- process(frame) -> returns {speech:boolean} for that frame
- cleanup()

---

## 5) vadManager.js responsibilities

- Subscribe to micCapture emitter
- Buffer frames into a rolling buffer
- Apply hangover logic:
  - speech_start: require N consecutive speech frames (configurable)
  - speech_end: require M consecutive non-speech frames
- When speech segment complete:
  - concatenate buffered frames into single PCM Buffer (16k, 16-bit)
  - emit ipcMain event 'audio:chunk' with payload:
    { id: uuidv4(), timestamp: ISO, sampleRate:16000, channels:1, pcm: <base64 or ArrayBuffer>, durationMs: <int> }
  - emit 'audio:ended'
- Emit 'audio:listening' when speech_start fires
- Support concurrent segments guard (no overlapping segments)
- Expose startVAD(), stopVAD(), getStatus()

---

## 6) IPC mapping & preload API

Add/ensure these are available:

Renderer → Main:

- vad:start
- vad:stop
- vad:getStatus
- vad:setAggressiveness (optional)

Main → Renderer:

- audio:listening
- audio:chunk
- audio:ended
- vad:status

Preload should expose:
window.gnani.vad = {
startVAD(),
stopVAD(),
getVADStatus(),
setAggressiveness(level),
on(event, cb) // for audio:listening, audio:chunk, audio:ended
}

Note: audio:chunk should be delivered as metadata + base64-encoded PCM in the IPC payload.

---

## 7) Performance & reliability rules

- Ensure all heavy work runs off the renderer thread (main process or child_process)
- Use streams where possible; avoid copying large buffers unnecessarily
- Provide configurable parameters (frameLengthMs, speechStartFrames, speechEndFrames)
- Add clear logging for chosen backend, errors, and segment events

---

## 8) Testing hooks

- Provide a test script stub: /electron/vad/test/playbackTest.js that can load a WAV file and feed frames into vadManager to simulate mic input.

---

## 9) DO NOT implement:

- STT / ASR
- TTS
- Streaming to backend
- Wake-word logic (except ensure VAD can run alongside wake detection)

---

## 10) Output

Generate full code for the files listed, with clear, modular functions and comments.
Use CommonJS or ESM consistently with the /electron project.
Return only electron-side code with full paths. Do not modify React.

"
