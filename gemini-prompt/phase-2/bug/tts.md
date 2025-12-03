You are updating my Electron + React application (Gnani).  
Electron loads the React app in the renderer, and all microphone/VAD/streaming logic is already integrated through the preload → renderer IPC bridge.  
Do NOT remove or break any existing Electron or React logic.

The backend now responds correctly after END_OF_STREAM, but in the frontend (React UI) I only see the status “responding” and no audio is played.  
I need you to inspect and update ONLY the response-handling flow inside the Electron + React architecture.

Please implement the following:

1. Analyze BOTH:

   - Electron main process
   - preload script
   - React renderer (frontend)

   and find where the backend gRPC or websocket responses arrive in the frontend.

2. In the React renderer:

   - Add detailed console logs for every backend response.
   - Log streamed chunks, partial text, final text, and metadata.
   - This ensures we know exactly what response is reaching the UI.

3. If Text-To-Speech (TTS) is not implemented in the React renderer:

   - Add a clean TTS module inside the React layer only.
   - Use Web Speech API (`speechSynthesis`) or an existing local TTS utility if present.
   - DO NOT use any external network API.
   - The TTS module must expose a simple function:
     speakText(text: string)
   - This must play audio through the frontend immediately.

4. If TTS already exists anywhere in the project:

   - Integrate it properly into the React response-handling code.
   - Make sure:
     - The LLM text is passed to TTS
     - Streaming text is handled (buffer or incremental)
     - It plays audio as soon as final text is ready
   - Do NOT rewrite any existing mic/VAD/wakeword logic.

5. Update the React UI flow so that:

   - When backend starts responding → show status = “responding”
   - When text response arrives → console.log it clearly
   - Then automatically trigger TTS to speak the response aloud

6. Ensure Electron ↔ React communication still works:

   - Keep IPC channels unchanged unless absolutely necessary
   - Only fix missing message bindings, if discovered
   - Do NOT break any preload script functionality

7. Keep all existing working features exactly as they are:

   - wake word detection
   - VAD
   - microphone control
   - audio streaming to backend
   - END_OF_STREAM flow
   - backend LLM flow
   - UI components

8. Only add:

   - response console logging (React side)
   - TTS implementation (if missing)
   - integration between backend response and TTS

9. Add clear comments in Electron and React explaining:
   - where backend responses enter the system
   - where they are logged
   - where TTS is invoked
   - how the flow works end-to-end

Now analyze all relevant Electron + preload + React files and implement these changes exactly.
