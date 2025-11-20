"
You are my Senior Electron Engineer.

We have already completed Stage 1 (React UI).  
Now generate Stage 2 of the GNANI desktop voice assistant:
Electron base architecture + preload IPC bridges + microphone access shell.

Follow these rules strictly:

1. Work inside the /electron directory.
2. Generate or update the following files with full file paths:

   - /electron/main.js (Electron main process)
   - /electron/preload.js (secure IPC bridge)
   - /electron/ipc/audio.js (audio-related IPC handlers)
   - /electron/ipc/system.js (status + meta IPC handlers)
   - /electron/mic/micCapture.js (mic access shell, no VAD, no wake-word)
   - /electron/utils/logger.js (simple logger)

3. Implement ONLY the foundation code:

   - Setup BrowserWindow with preload
   - Setup secure ipcMain <-> ipcRenderer channels
   - Implement channels defined in context:
     - audio:chunk
     - wake:triggered (placeholder, do not implement wake-word now)
     - audio:listening
     - audio:thinking
     - llm:response
     - ui:status
   - Do not add business logic, wake-word, or audio streaming logic yet.

4. Mic handling shell rules:

   - Create micCapture.js with:
     - startMicrophone()
     - stopMicrophone()
     - event emitter that emits audio buffers
   - Use Node microphone modules or placeholders.
   - Do not integrate VAD or wake-word yet.

5. Wire micCapture → ipcMain → preload → React UI
   (Placeholders only; minimal code)

6. Add clean logging (info, warn, error) using logger.js

7. Ensure preload.js exposes functions:

   - window.gnani.send(channel, data)
   - window.gnani.on(channel, callback)
   - window.gnani.startMic()
   - window.gnani.stopMic()

8. Do NOT create any UI. Do NOT modify React files.

9. Only produce Electron-related code and full file paths.
   "
