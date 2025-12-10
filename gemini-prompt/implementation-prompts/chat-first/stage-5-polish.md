**GOAL:** Polish the UI, implement Settings, and finalize the transition.
**CONTEXT:** All functional blocks are in place. Now we need to make it look premium and handle the "Settings" interactions.

## Specification

### 1. User Profile & Settings Menu
-   **Component:** `UserProfile.tsx` (in Sidebar).
-   **Interaction:** Clicking it opens a `PopOver` or `DropdownMenu`.
-   **Items:**
    -   "Settings"
    -   "Keyboard Shortcuts"
    -   "Log Out"
-   **Settings Action:** Opens a Modal (`SettingsDialog.tsx`).

### 2. Settings Modal
-   Reuse existing `Settings` components from `components/settings/*` if meaningful.
-   Tabs: "General", "Voice", "Account".
-   **Voice Tab:** "Input Device", "Output Device", "Wake Word" toggles.
-   **Style:** consistently dark, modern, centered modal.

### 3. Header Polish
-   Ensure `DeviceIndicators` (Battery/Network) look integrated, not grafted on.
-   Add a **Model Selector** dropdown in the Header (Left or Center) if the backend supports multiple models.

### 4. Transition
-   Make `/chat` the default route in `App.tsx` (Move `GnaniCore` to legacy or remove).
-   Ensure no "FOUC" (Flash of Unstyled Content) or flickering when loading.

## Tasks
1.  [ ] Implement Profile Popup Menu.
2.  [ ] Implement Settings Modal (wrapping existing settings controls).
3.  [ ] Finalize Header styling.
4.  [ ] Switch default route to `/chat`.

## Test Plan
-   Click Profile -> Settings. Change a setting (e.g., Mic). Verify it persists.
-   Resize window. Verify Sidebar/Header responsiveness.
-   Logout. Verify redirect to Login.
