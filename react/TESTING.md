# Testing Gnani

## 🧪 Verification Strategy

Gnani uses a combination of **Automated Tests** (Jest/Vitest) and **Manual Verification** with Simulation Tools.

## 🛠️ Simulation Mode

Since hardware access (microphone) and backend connectivity might not always be available during frontend development, `GnaniCore` includes built-in event listeners for simulation.

### Simulation Controls
Located in `IntelligencePanel.tsx` (toggle "DEBUG" in the header if available, or use the dev-only controls):

1.  **Simulate Wake**:
    - Dispatches: `test:wake`
    - Effect: Transitions state from `Idle` -> `Listening`.
    - Verification: HUD should turn Green/Active.

2.  **Simulate STT**:
    - Dispatches: `test:stt` (payload: `{ text: "Hello Gnani" }`)
    - Effect: Transitions `Listening` -> `Thinking`, then logs "Hello Gnani" to the chat history.
    - Verification: Chat bubble appears, HUD switches to "Thinking" animation.

3.  **Simulate Code Message**:
    - Dispatches: `test:code-message`
    - Effect: Injects a dummy assistant message with a Python code block.
    - Verification: Check Code Block styling and "Copy" button functionality in the overlay.

## ✅ Manual Test Cases

### 1. Voice Mode Integration
- [ ] **Launch**: Click the microphone icon in Chat Mode. Overlay should appear smoothly.
- [ ] **Wake**: Say "Hey Gnani" (or Simulate). HUD activates.
- [ ] **Speech**: Speak a query. Text should appear in `SpokenTextDisplay`.
- [ ] **Response**: TTS audio should play, and text should stream in the terminal.
- [ ] **Exit**: Click "X" or say "Goodbye". Overlay closes, and you return to Chat Mode.

### 2. Message Synchronization
1.  Enter Voice Mode.
2.  Speak/Simulate "What is the weather?".
3.  Verify "What is the weather?" appears in the Voice Terminal.
4.  Exit Voice Mode.
5.  Verify "What is the weather?" is present in the main Chat History.

### 3. Shared Components
- **Code Blocks**: Verify syntax highlighting applies correctly in both Light/Dark/Glass themes.
- **Feedback**: Verify Thumbs Up/Down buttons work in the Overlay and do not get clipped (z-index check).

## 🤖 Automated Tests

Run the test suite:

```bash
npm run test
```

Build verification:

```bash
npm run build
```
