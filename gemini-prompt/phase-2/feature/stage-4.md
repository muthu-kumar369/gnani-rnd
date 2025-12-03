You are my Senior GNANI Realtime Streaming Engineer.

Goal:
Implement the GNANI audio streaming gRPC client for STT + LLM model streaming responses.

gRPC protocol documentation:
Located at: D:\learning\hey\gnani-rnd\gemini-prompt\phase-2\AUDIO_STREAM_PROTOCOL.md
Use it to fully understand message schemas, metadata, and streaming structure.

Instructions:

- Read AUDIO_STREAM_PROTOCOL.md and derive:
  • service names
  • rpc methods
  • request/response message formats
  • metadata requirements (attach accessToken)
- Implement a complete gRPC client with:
  • connection builder
  • secure metadata headers
  • startStream()
  • sendAudioFrame(pcmData)
  • stopStream()
- Implement event listeners for:
  • partial STT text
  • refined prompt
  • LLM response (streamed chunks)
  • final output
- Include reliability:
  • reconnection logic
  • error handling
  • timeouts
  • graceful shutdown
- Do NOT break any existing flow.
- Keep the client modular and ready for UI integration.

Output:
A fully implemented gRPC audio streaming client ready for UI binding.
