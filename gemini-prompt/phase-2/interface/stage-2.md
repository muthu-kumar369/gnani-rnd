You are my Senior GNANI Realtime Audio Engineer.

Goal:
Fix and upgrade the entire wake-word and microphone lifecycle so it becomes stable, predictable, and tightly synchronized with the UI and gRPC streaming.

Instructions:

- Analyze how wake-word triggers, mic recording, and gRPC audio streaming currently work.
- Fix timing issues, duplicate mic starts, waveform continuing after stop, and lingering audio nodes.
- Upgrade wake-word flow:
  • wake-word detected → proper wake → mic start → transition to streaming
- Improve mic lifecycle:
  • start / stop must always cleanly transition states
  • ensure no overlapping or locked audio streams
- Ensure seamless transitions to the UI state machine created in Stage 1.
- Keep existing Phase-2 functionality intact, only upgrading and stabilizing behavior.
- Let Gemini decide the best architecture based on existing code.

Output:
A stable, bug-free wake-word + mic lifecycle integrated cleanly with UI states.
