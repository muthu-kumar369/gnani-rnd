You are updating my Electron-based voice assistant application (Gnani).  
The project already has:

- wake word detection
- VAD (voice activity detection)
- continuous microphone capture
- gRPC audio streaming to backend

However, the current behavior still sends audio chunks continuously to the backend even when the user is silent. The backend receives audio forever until manually stopped. This wastes resources and causes incorrect Whisper/LLM processing.

Your task is to analyze the entire project and update ONLY what is necessary to fix this behavior WITHOUT breaking ANY existing features.

Please implement the following:

1. Respect the existing VAD and wake word logic.
   Do not remove or rewrite them.  
   Instead, extend or integrate with them properly.

2. Integrate VAD into the streaming logic so that:

   - When the user is speaking → continue sending audio chunks.
   - When the user stops speaking (silence for 300–600 ms) → stop sending audio chunks immediately.

3. When silence is detected:

   - Fire a speech-end handler (e.g., handleSpeechEnded()).
   - This must send a final END_OF_STREAM or similar control message through gRPC.
   - After sending END_OF_STREAM, cleanly close the audio stream.
   - Ensure backend only starts ASR/LLM after receiving END_OF_STREAM.

4. IMPORTANT:
   The existing working logic for audio encoding, chunk sending, UI states, wake word detection, and gRPC communication must NOT be removed or rewritten.  
   Only add or adjust logic to:

   - use VAD to detect end of speech,
   - stop streaming at the correct time,
   - send END_OF_STREAM correctly.

5. Detect and refactor ONLY the necessary portions where continuous audio streaming happens, so that silence no longer triggers sending audio.

6. Maintain the entire current flow:
   wake word → user speaks → VAD active → stream audio → detect silence → stop stream → send END_OF_STREAM → backend ASR → backend LLM → frontend handles response.

7. Add clear comments explaining:

   - where VAD is connected
   - where audio streaming stops
   - where END_OF_STREAM is emitted
   - why no chunks should be sent during silence

8. Code must remain modular, readable, and must NOT break any existing logic.

Now analyze the entire project and implement these updates precisely.
