**GOAL:** Implement the Voice Mode Overlay by **reusing the existing Voice UI components**.
**CONTEXT:** Chat works. Now we enabling the Voice Mode. The user loves the existing Voice UI (HUD, Avatar, Waveform) and wants to keep it exactly as is, but displayed as an overlay with **only a Close button** visible (hiding settings/history buttons that might be in the original).

## Specification

### 1. Reusing the Core Voice UI
-   **Component to Reuse:** Inspect `react/src/components/gnani/GnaniCore.tsx` and `HUDBackground.tsx`.
-   **Strategy:**
    -   Instead of creating `VoiceModeOverlay` from scratch with just a waveform, we will wrap the **entire existing GnaniCore (or a slightly modified version)** inside the overlay.
    -   **Critical Requirement:** When used in "Overlay Mode", we must **HIDE** all extraneous UI elements:
        -   Hide Terminal Toggle.
        -   Hide Settings Button.
        -   Hide Sidebar Toggles.
        -   **KEEP:** Avatar, Waveform, Status Status Bar (Listening/Processing), and the main visual aesthetic.
    -   **ADD:** A single **Close Button** (X) in the Top Right corner.

### 2. Implementation Logic
-   **Refactoring:**
    -   Modify `GnaniCore.tsx` (or create a wrapper `VoiceExperience.tsx` that uses the same internal components) to accept a prop `isOverlayMode`.
    -   If `isOverlayMode` is true:
        -   Apply `absolute inset-0 z-50` positioning.
        -   Conditionally render `null` for the sidebars/top-bars.
        -   Render the Close Button.
    -   **Backdrop:** The existing `HUDBackground` is likely opaque or semi-transparent. Ensure it covers the Chat UI completely.

### 3. State & Trigger
-   **Trigger:** User clicks Mic in `ChatInput` -> `setIsVoiceMode(true)`.
-   **Mount:** Mount the `VoiceExperience` component on top of `ChatLayout`.
-   **Behavior:**
    -   **On Mount:** Trigger `ipcRenderer.send('mic:start')`.
    -   **On Close (Click X):** Trigger `ipcRenderer.send('mic:stop')` and `setIsVoiceMode(false)`.
    -   **TTS:** TTS **MUST** be enabled. (Since we are using the original components, they likely already have the TTS listeners wired up. Ensure we don't accidentally silence them).

## Tasks
1.  [ ] Refactor `GnaniCore.tsx` or extract its internals to support an `isOverlayMode`.
2.  [ ] Create `react/src/components/overlay/VoiceModeOverlay.tsx` which renders this "Clean Voice UI".
3.  [ ] Add the Close Button logic.
4.  [ ] Connect `ChatInput` Mic button to toggle this mode.

## Test Plan
-   Click Mic icon in Chat.
-   **Verify:** The "Old Familiar" Voice Interface appears full screen.
-   **Verify:** NO Settings/Sidebar buttons are visible. ONLY the specific Close button.
-   **Verify:** Avatar animates, Waveform moves.
-   **Verify:** TTS plays audio response.
-   Click X. Verify returns to Chat.
