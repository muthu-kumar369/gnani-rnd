You are my Senior GNANI Frontend Architect.

Goal:
Upgrade the entire GNANI UI by establishing a robust, fully dynamic state system that controls all UI/animation behavior. This replaces static values with live state transitions, fixes inconsistent behavior, and ensures all Phase-2 features work smoothly.

Instructions:

- Analyze the whole Electron + React project.
- Identify all states involved in GNANI’s flow: idle, wake-word, mic recording, streaming to gRPC, receiving STT, thinking, responding, and error.
- Build or upgrade a unified global UI state machine that accurately drives the UI and animations.
- Integrate this state machine with existing:
  • mic controller
  • wake-word engine
  • gRPC event flow
  • UI components
- Ensure backwards compatibility with all existing Phase-2 features.
- Do not modify business logic; only improve state management + UI behavior.
- Ensure transitions are smooth, glitch-free, and correctly triggered by real events.

Output:
A fully functional GNANI UI state system controlling all visual and interactive behavior.
