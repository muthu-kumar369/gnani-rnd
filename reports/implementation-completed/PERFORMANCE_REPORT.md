# GnaniCore Performance Report

## Optimization Overview
**Stage R9** focused on splitting the monolithic `GnaniCore.tsx` component to improve maintainability and performance. Audio processing and state management logic were extracted into dedicated sub-components with memoization.

## Metrics

### Code Size
| Metric | Before | After | Change |
| :--- | :--- | :--- | :--- |
| **GnaniCore Lines** | 629 | 580 | ▼ 8% |
| **Logic Lines (Est.)** | ~200 | ~50 | ▼ 75% |

*Note: While the overall line count reduction in `GnaniCore` is modest (due to retaining UI layout and essential store subscriptions), the **complexity** reduction is significant. The heavy Audio/VAD loop and State transition logic (approx. 150+ lines) were moved to `AudioManager` and `StateManager`.*

### Component Structure
- **Extracted `AudioManager.tsx`**: Encapsulates VAD listeners, microphone orchestration, and barge-in logic. Wrapped in `React.memo`.
- **Extracted `StateManager.tsx`**: Encapsulates all state transition rules and timeout guards (thinking/speaking/listening). Wrapped in `React.memo`.
- **Optimization**: `GnaniCore` handlers wrapped in `useCallback` to ensure stable props for sub-components, preventing unnecessary re-renders of the audio/state logic loops.

### Rendering Performance
- **Virtualization**: Confirmed `TerminalPanel` uses `react-virtuoso` for efficient rendering of chat history (O(1) DOM nodes vs O(N)).
- **Re-renders**: The decoupling of `audioLevel` updates (in `MicButton` / `HUD`) from global state logic (in `StateManager`) ensures that high-frequency audio updates do not trigger re-evaluation of state transition rules.

## Future Recommendations
- Further reduce `GnaniCore` size by extracting the UI layout (Header/Main/Footer) into a pure presentational `GnaniLayout.tsx` component.
- Move IPC event listeners (`latestLLMChunk`, `toolStatus`) into a custom hook `useGnaniIPC` to de-clutter the main component.
