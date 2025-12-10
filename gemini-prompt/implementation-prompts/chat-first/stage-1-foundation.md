**GOAL:** Implement the basic "Chat-First" UI shell for the Gnani application.
**CONTEXT:** We are migrating from a HUD-style voice app to a standard Chat app. The current entry point is `GnaniCore.tsx` inside `App.tsx`. We need to introduce a new layout and route without breaking the existing app.

## Specification

### 1. New Layout Structure
Create a new layout file: `react/src/layouts/ChatLayout.tsx`.
It should have:
-   **Flex Container:** Full screen, dark background (`bg-jarvis-bg`).
-   **Header (Top):** Fixed height (~60px), border-bottom (`border-jarvis-border`). 
    -   *Left:* Logo or Model Selector placeholder.
    -   *Right:* Device indicators (Battery, Network) - *Reuse logic from `StatusBar.tsx` or `SystemAwareness` if possible, but minimal visual.*
-   **Sidebar (Left):** Fixed width (260px), border-right.
    -   *Top:* "New Chat" button.
    -   *Middle:* Scrollable list of recent chats (Dummy data for now).
    -   *Bottom:* **User Profile Area**.
        -   Avatar (Circle).
        -   User Name (Truncated).
        -   **Interaction:** Clicking this area opens a Popover/Menu with options: "Settings", "Logout".
-   **Main Content (Right):** Fluid width. Renders `<Outlet />` or the Chat Interface.

### 2. New Page: ChatPage
Create `react/src/pages/ChatPage.tsx`.
-   For now, just a placeholder container: "Select a conversation or start a new one."
-   Or if a chat is active, show a dummy `MessageList` and `ChatInput`.

### 3. Routing Updates
Update `react/src/App.tsx`:
-   Keep existing `/` route pointing to `ProtectedRouter` -> `GnaniCore` (for backward compatibility during dev, or move `GnaniCore` to `/voice-legacy`).
-   **New Route:** `/chat` pointing to `ChatLayout` -> `ChatPage`.
-   **Dev Tool:** Add a small floating button or link in `GnaniCore` (the current home) that says "Try Chat UI" which navigates to `/chat`.

### 4. Style & Theme
-   Use existing Tailwind tokens (`jarvis-blue`, `jarvis-text`, `cyan-500`, etc.).
-   Aim for a "Clean, Premium" look. Glassmorphism on the Sidebar is nice but keep performance high.

## Tasks
1.  [ ] Create `react/src/layouts/ChatLayout.tsx`.
2.  [ ] Create `react/src/components/chat/Sidebar.tsx` (Move `UserInfo` specific logic here).
3.  [ ] Create `react/src/components/chat/ChatHeader.tsx`.
4.  [ ] Create `react/src/pages/ChatPage.tsx`.
5.  [ ] Update `react/src/App.tsx` with the new routes.

## Code Constraints
-   Use **TypeScript** interfaces for all props.
-   Use `lucide-react` for icons if available, or existing assets.
-   Do NOT delete `GnaniCore.tsx` yet.

## Test Plan
-   Run `npm run start-react`.
-   Navigate to `/chat`.
-   Verify Sidebar, Header, and Main Content areas are visible and responsive.
-   Verify Profile click opens a simple menu (can be just a `console.log` or simple `div` toggle for Stage 1).
