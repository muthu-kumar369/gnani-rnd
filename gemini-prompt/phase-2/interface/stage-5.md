You are my Senior GNANI UX Engineer.

Goal:
Add or upgrade a real-time GNANI Intelligence Panel that displays real operational data instead of static placeholders. This is optional visually but strongly recommended for debugging wake-word, mic, and gRPC flows.

Instructions:

- Analyze current UI and Phase-2 logic.
- Add or refine a small dynamic panel showing:
  • current GNANI state
  • wake-word detection status
  • mic power/amplitude values
  • duration of recording/streaming
  • STT latency
  • model response latency
  • packet send/receive counts
  • streaming health
  • optional debug information
- Panel should auto-update and visually match the JARVIS HUD theme.
- Make it toggleable for production and dev modes.
- Keep all existing code functional.

Output:
A live GNANI intelligence panel with real system metrics.
