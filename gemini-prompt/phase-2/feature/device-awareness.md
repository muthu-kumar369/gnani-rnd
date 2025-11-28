You are an expert architect for Electron, React, Node.js, gRPC, and system-level integrations on Windows/macOS/Linux.

We are building an AI agent app called "Gnani". The existing system includes:

- A main interface where voice/text interactions happen.
- A settings page for advanced configuration.
- A consistent design system and UI theme across React/Electron.
- Existing conversation flows (voice + text).
- Existing status indicators and layout structure.

You MUST NOT break or interfere with any existing flows.  
Your task is to add **Device Awareness** capabilities to Gnani in a clean, scalable, theme-consistent, production-ready way.

----------------------------------------------------
NEW SUPER FEATURE: **Device Awareness Layer**
----------------------------------------------------
The assistant must gain basic OS-level awareness and expose them safely to the frontend.

We need real-time or polled access to:

1. **Active Window / Active Application**
   - App name
   - Executable/process name
   - Window title
   - (Cross-platform: Windows, macOS, Linux)

2. **System Status Updates**
   - CPU usage
   - Memory usage
   - System load
   - Disk space (optional)
   - Uptime

3. **Internet Connectivity**
   - Online/offline detection
   - Latency or connectivity check

4. **Battery + Charging State**
   - Battery level (%)
   - Charging/discharging
   - Power source (AC/Battery)

5. **Microphone and Audio Device Information**
   - Default microphone
   - All available audio input/output devices
   - Device change events (plug/unplug)
   - Microphone mute/unmute status (if available)

----------------------------------------------------
REQUIREMENTS
----------------------------------------------------

You must:

1. Propose the correct architecture for integrating all this:
   - Where to put OS-level logic (Electron main process)
   - What to expose via Electron preload (secure IPC)
   - What belongs in the backend (Node/gRPC)
   - How frontend React receives updates (event-based, polling, or IPC streaming)
   - How to avoid blocking the main thread

2. Decide WHERE each part of the UI should appear:
   - Settings page (detailed device & system information)
   - Main interface (compact indicators or quick info)
   - You MUST choose the locations automatically based on best UX practice.

3. Provide **complete code** for:
   - Electron main OS-integration modules  
   - Preload IPC bridge  
   - React components for showing system/device info  
   - Backend updates if needed  
   - System monitoring utilities (Node.js/Electron)  
   - Cross-platform implementations for active window detection and battery status  

4. Maintain the existing theme:
   - Same styling system
   - Same component language
   - Same color palette
   - High-quality, minimalistic, modern UI
   - Animations consistent with current behavior

5. Provide UI/UX guidance for:
   - System info panel inside Settings  
   - Compact realtime indicators in main UI  
   - How to expand/collapse advanced device data  
   - Placement that does NOT disrupt conversation experience  
   - Non-intrusive, professional design  

6. Provide:
   - A clean, scalable folder structure update
   - Explanation of security considerations (IPC, OS APIs, permission boundaries)
   - Best practices for performance (throttling, debouncing, worker threads)

7. Avoid common issues:
   - Do NOT block Electron’s main thread
   - Do NOT spam UI with too many events
   - Ensure battery + connectivity polling is efficient
   - Ensure active window detection works cross-platform
   - Ensure gRPC stream is not overloaded

8. Produce a final full system architecture diagram showing:
   - Electron Main (OS Awareness Module)
   - Preload IPC
   - React (Settings + Main UI)
   - Backend gRPC (if involved)
   - Integration with existing flows

Start by summarizing your understanding of the existing Gnani architecture, then propose the updated architecture, then provide the full implementation plan and necessary code.
