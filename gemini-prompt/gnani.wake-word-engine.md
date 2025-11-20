"
You are my Senior Electron Engineer.

We completed Stage 2 (Electron + preload architecture).  
Now implement Stage 3 of the GNANI voice assistant:
WAKE-WORD DETECTION using Porcupine.

Follow these instructions carefully:

---

## 1. Project Structure

Create and update the following files:

- /electron/wake/wakeEngine.js (Porcupine integration)
- /electron/wake/wakeManager.js (state machine + control layer)
- /electron/ipc/wake.js (IPC wiring)
- Update /electron/main.js (register wake IPC)
- Update /electron/preload.js (add wake APIs)
- Update /electron/mic/micCapture.js
  → pipe mic audio frames into wakeEngine (non-destructive)

---

## 2. Wake-Word Engine Rules (Porcupine)

Implement:

- initializePorcupine()
- startWakeDetection()
- stopWakeDetection()
- processAudioFrame(frame)
- cleanup()

Use placeholder:

- Porcupine.create(...) or mocked class if keyword file is missing.

DO NOT integrate VAD or STT.
Wake-word should run continuously once started.

---

## 3. Wake Manager (state machine)

Create a simple state machine:

States:

- idle
- listening_for_keyword
- keyword_detected

Transitions:

- onStart() → listening_for_keyword
- onWakeDetected() → keyword_detected
- onReset() → idle

Emit to ipcMain when triggered.

---

## 4. IPC Requirements

Implement IPC channels (matching our global mapping):

Main → Renderer:

- wake:triggered (when keyword is detected)
- wake:status (state updates)

Renderer → Main:

- wake:start
- wake:stop
- wake:getStatus

---

## 5. Integrate with Mic (no logic changes to VAD/audio)

Modify micCapture.js to:

- export an event emitter that outputs 16-bit PCM frames
- forward each audio frame into wakeEngine.processAudioFrame(frame)
- DO NOT block or modify audio flow
- Keep this purely as a side-tap for wake detection

---

## 6. Preload API

Expose:

window.gnani.wake = {
startWakeWord(),
stopWakeWord(),
getWakeStatus(),
onWakeTriggered(callback)
}

Use secure, validated channels only.

---

## 7. Logging

Use logger.js for:

- engine initialization
- wake trigger events
- state changes
- errors

---

## 8. DO NOT Implement:

- VAD
- STT
- Streaming
- React components

Only Electron wake-word layer.

---

Please generate complete file paths and code.
"
