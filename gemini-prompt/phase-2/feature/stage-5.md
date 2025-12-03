You are my Senior GNANI Realtime Interaction Engineer.

Goal:
Connect UI microphone actions with the new gRPC audio streaming client.

Instructions:

- Add UI event handlers:
  • Start Recording → open gRPC streaming channel
  • Stop Recording → close gRPC stream
- Capture microphone audio using existing mic access utilities or implement a new recorder.
- Stream raw audio frames to the backend in real-time.
- Display:
  • live STT transcription (word-by-word or chunk-by-chunk)
  • refined prompt (if supplied)
  • LLM streamed output (ChatGPT-like response)
- Add UI indicators:
  • Recording on/off
  • Processing
  • Connection errors
- Ensure no conflicts with previous WebSocket implementation.
- Do not break any existing screen.

Output:
A fully working voice → GNANI → response UI with real-time streaming.
