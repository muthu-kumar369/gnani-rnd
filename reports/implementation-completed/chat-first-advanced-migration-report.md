# Gnani Advanced Chat-First Migration: The "Jarvis" Protocol

## 1. Executive Vision: "Advanced & Adaptive"
The goal is to elevate Gnani into a tier-1 AI Assistant interface that rivals Gemini Advanced and ChatGPT Plus. The design philosophy shifts from "Always Listening" to "Adaptive Intelligence".

**Key Design Pillars:**
1.  **Glassmorphic & Futuristic**: Utilizing `backdrop-filter`, subtle glows, and efficient space usage.
2.  **Context-Aware Header**: The header is not just a title; it is the "System Status Deck" showing Device Awareness (CPU/RAM/Battery) and Voice Status.
3.  **Collapsible Sidebar**: A dynamic navigation drawer that respects user focus.
4.  **Immersive Voice Identity**: Voice Mode is exclusive. It takes over the experience, removing visual clutter to focus on the conversation.

---

## 2. Advanced UI Architecture (Mermaid)

### A. The "Glass Deck" Layout
This structure defines the high-end application shell.

```mermaid
graph TD
    classDef glass fill:#1e293b,stroke:#38bdf8,stroke-width:1px,fill-opacity:0.8;
    classDef active fill:#0ea5e9,stroke:#fff,stroke-width:2px;

    App[App Container] --> Shell[Glass Shell Layout]
    
    subgraph "Navigation Layer (Left)"
        Shell --> SB[Collapsible Sidebar]
        SB --> Logo[Small Logo]
        SB --> NewChat[+ New Chat]
        SB --> Hist[History Groups (Today/Yesterday)]
        SB --> SysMon[System Monitor Widget (CPU/RAM)]
    end
    
    subgraph "Command Deck (Top)"
        Shell --> Header[Glass Header]
        Header --> Toggle[Sidebar Toggle (Top-Left)]
        Header --> Model[Model Selector dropdown]
        Header --> Indicators[System Indicators (Wifi/Battery)]
        Header --> VoiceBtn[🎧 Voice Mode Trigger]
        Header --> Profile[Avatar Profile Menu]
    end
    
    subgraph "Interaction Plane (Center)"
        Shell --> Content[Chat Interface]
        Content --> MsgList[Virtual Message Stream]
        Content --> Composer[Floating Input Composer]
    end
    
    subgraph "Voice Interaction (Overlay)"
        VoiceBtn -.-> Overlay[Voice Mode Modal]
        Overlay --> Close[X Close Button]
        Overlay --> Visualizer[Holographic Waveform]
        Overlay --> Captions[Floating Captions]
        
        style Overlay fill:#000,stroke:#f0f,stroke-width:2px,stroke-dasharray: 5 5;
    end
    
    class Shell,SB,Header,Content glass;
    class VoiceBtn active;
```

---

## 3. Component Deep Dive & "Keep vs Discard" Analysis

### A. The Header (Command Deck)
**Location**: Fixed Top. Height: 60px. Glass effect.
*   **[NEW] Sidebar Toggle**: Top-Left. Icon (`PanelLeft`). Minifies Sidebar.
*   **[MOVED] System Indicators**: From `SystemIndicators.tsx`. Relocated next to Profile. Shows minimal Wifi/Battery icons.
*   **[NEW] Voice Trigger**: Distinct "Headphones" or "Microphone" icon action button. Gradient border.
*   **[NEW] Profile Menu**: Avatar. On click -> Dropdown with:
    *   Settings
    *   Account
    *   Logout
    *   *System Health (Expand)*

### B. The Sidebar (Navigation)
**Location**: Fixed Left. Width: 260px (Open) / 72px (Collapsed).
*   **[EXISTING] Conversation List**: Reuse `ConversationSidebar.tsx` logic but restyle for "Collapsed Mode" (show avatars/icons only).
*   **[MOVED] DeviceStatsHUD**: Move `DeviceStatsHUD.tsx` here?
    *   *Decision*: **Keep it in Sidebar Bottom**. In collapsed mode, show mini circular charts. In open mode, show full bars. This gives it a permanent "Dashboard" feel.

### C. Voice Mode (Immersive Overlay)
**Requirement**: "Only close icon top right. All other hidden."
*   **[REUSE] `GnaniCore.tsx` visual elements**:
    *   `HUDBackground`: **KEEP**.
    *   `Waveform`: **KEEP**.
    *   `MicButton`: **KEEP**. (maybe auto-activates, but button remains for manual mute).
    *   `StatusDisplay`: **KEEP**.
*   **[HIDE]**:
    *   Everything else (Sidebar, Header, Chat Input).
    *   The overlay will have a specific `z-index: 50` and `backdrop-filter: blur(20px)`.

---

## 4. Backend Analysis & gRPC Integration

**Current Status**:
*   Backend uses `grpc.ts` for Audio Stream + Text Stream.
*   Frontend uses `useAudioStream.ts` to bridge Electron <-> React.

**Migration Logic**:
1.  **Text Chat**: Uses `POST /api/chat`.
    *   *Action*: No Change to backend. Frontend `useConversationStore` handles this.
2.  **Voice Mode**: Uses gRPC Stream.
    *   *Action*: The `VoiceOverlay` component will initialize the stream on mount and destroy it on unmount.
    *   *Crucial*: The "Response Speaking" logic is tied to the Overlay presence (as defined in the previous report's Gating Logic).

**Data Persistence**:
*   `SendAudioStream` (gRPC) and `/chat` (REST) both write to the same `Conversation` model in MongoDB.
*   **Synchronization**: When closing Voice Overlay, `ChatPage` must trigger `refreshMessages()` to pull the latest voice transcriptions into the visual history.

---

## 5. Detailed Component Migration Plan

### Phase 1: The Shell (Layouts)
1.  Create `src/layouts/DashboardLayout.tsx`.
    *   Implements the Collapsible Sidebar logic (`isCollapsed` state).
    *   Implements the Header logic (`DeviceAwareness` integration).
2.  Update `DeviceStatsHUD.tsx`.
    *   Add `collapsed` prop.
    *   If `collapsed`, render circular SVG progress rings (CPU/RAM).
    *   If `expanded`, render existing detailed bar charts.

### Phase 2: The Chat Interface
1.  Refactor `TerminalPanel.tsx` -> `src/pages/ChatPage.tsx`.
2.  **Advanced Styling**:
    *   **User Message**: Dark Blue/Purple Gradient background. Right Aligned.
    *   **AI Message**: Glass/Transparent background. Left Aligned. Markdown supported.
    *   **Input Composer**: Floating capsule at the bottom (`max-width: 800px`).

### Phase 3: The Voice Immersive overlay
1.  Create `src/components/overlay/VoiceMode.tsx`.
2.  Move `GnaniCore` visual logic here.
3.  Add `CloseButton` (X icon) at `top: 2rem; right: 2rem;`.
4.  Ensure `useAudioStream` is strictly bound to this component's lifecycle.

---

## 6. Implementation Checklist

- [ ] **Scaffold**: Create `DashboardLayout` and `VoiceMode` files.
- [ ] **Sidebar**: Adapt `ConversationSidebar` to handle collapsible state.
- [ ] **Header**: Integrate `SystemIndicators` (Wifi/Battery) into the top bar.
- [ ] **Device Stats**: Modify `DeviceStatsHUD` to support "Mini Mode" for the sidebar footer.
- [ ] **Voice Logic**: Implement the "Mount/Unmount" stream lifecycle in `VoiceMode`.
- [ ] **Cleanup**: Remove old routing from `App.tsx` and legacy `GnaniCore` home route.

This plan delivers the "Top AI Assistant" feel you requested: highly visual, context-aware, and strictly separated interaction modes.
