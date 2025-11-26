# Gnani Voice Assistant - Quick Reference

## State Machine

### States
- **idle**: Waiting for wake-word or manual start
- **listening**: Microphone active, streaming to backend
- **thinking**: Processing user input, LLM generating response
- **speaking**: TTS audio playing

### Transitions
```typescript
import useGnaniState from './hooks/useGnaniState';

const { state, transition, isIdle, isListening, isThinking, isSpeaking } = useGnaniState();

// Trigger transitions
transition('wake-word-detected');  // idle → listening
transition('manual-start');         // idle → listening
transition('vad-end');              // listening → thinking
transition('manual-stop');          // listening → thinking
transition('tts-start');            // thinking → speaking
transition('tts-complete');         // speaking → idle
transition('barge-in');             // speaking/thinking → listening
```

---

## Audio Preprocessing

### Configuration
```typescript
// In useMicrophone.ts
const audioConstraints: MediaTrackConstraints = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,    // Prevents echo
  noiseSuppression: true,     // Reduces background noise
  autoGainControl: true,      // Normalizes volume
};
```

### Check Support
```typescript
const support = navigator.mediaDevices.getSupportedConstraints();
console.log('AEC:', support.echoCancellation);
console.log('NS:', support.noiseSuppression);
console.log('AGC:', support.autoGainControl);
```

---

## Barge-in

### Usage
```typescript
import useBargeIn from './hooks/useBargeIn';

const bargeIn = useBargeIn(state, handleBargeIn);

// VAD-based barge-in
bargeIn.handleVADSpeech(true);

// Manual barge-in
bargeIn.handleManualBargeIn();

// Check if can barge-in
if (bargeIn.canBargeIn) {
  // User can interrupt
}
```

### Configuration
```typescript
bargeIn.updateConfig({
  vadThreshold: 3,      // Consecutive speech frames needed
  debounceMs: 100,      // Debounce time in ms
});
```

---

## Spoken Text Display

### Usage
```typescript
import useSpokenText from './hooks/useSpokenText';

const spokenText = useSpokenText();

// Add text chunks
spokenText.addTextChunk("Hello ");
spokenText.addTextChunk("world!");

// Control playback
spokenText.startPlayback();
spokenText.stopPlayback();
spokenText.clearText();

// Adjust speaking rate
spokenText.setSpeakingRate(3.5); // words per second
```

### Component
```tsx
<SpokenTextDisplay 
  words={spokenText.words} 
  isVisible={isSpeaking}
/>
```

---

## Common Tasks

### Start Recording
```typescript
const handleStartRecording = () => {
  if (isIdle) {
    transition('manual-start');
    startMic();
  }
};
```

### Stop Recording
```typescript
const handleStopRecording = () => {
  if (isListening) {
    transition('manual-stop');
    stopMic();
  }
};
```

### Handle Barge-in
```typescript
const handleBargeIn = () => {
  // Stop TTS
  streamingTTS.stop();
  
  // Clear spoken text
  spokenText.clearText();
  
  // Transition to listening
  transition('barge-in');
  
  // Start mic
  startMic();
};
```

---

## Debugging

### State Machine Diagnostics
```typescript
const diagnostics = getDiagnostics();
console.log('Current state:', diagnostics.currentState);
console.log('Previous state:', diagnostics.previousState);
console.log('History:', diagnostics.recentTransitions);
```

### Check Audio Settings
```typescript
// After starting mic, check applied settings
const track = stream.getAudioTracks()[0];
const settings = track.getSettings();
console.log('Settings:', settings);
```

### Monitor State Changes
```typescript
// In GnaniCore
useEffect(() => {
  console.log('State changed to:', state);
}, [state]);
```

---

## Configuration Files

### VAD Settings
**File**: `electron/vad/vadManager.js`
```javascript
config: {
  speechStartThreshold: 5,
  speechEndThreshold: 20,
  hysteresisMargin: 3,
}
```

### Wake-word Settings
**File**: `electron/wake/wakeEngine.js`
```javascript
this.cooldownPeriod = 2000; // 2 seconds
```

### TTS Settings
**File**: `react/src/utils/streamingTTS.ts`
```typescript
private sentenceBoundaryRegex = /([.!?]+)(\s+|$)/g;
```

---

## File Locations

### Core Files
- State Machine: `react/src/state/GnaniStateMachine.ts`
- Main Component: `react/src/components/gnani/GnaniCore.tsx`
- Microphone: `react/src/hooks/useMicrophone.ts`
- TTS Manager: `react/src/utils/streamingTTS.ts`

### Hooks
- `react/src/hooks/useGnaniState.ts`
- `react/src/hooks/useBargeIn.ts`
- `react/src/hooks/useSpokenText.ts`
- `react/src/hooks/useAudioPreprocessing.ts`

### Components
- `react/src/components/gnani/SpokenTextDisplay.tsx`
- `react/src/components/gnani/AIAvatar.tsx`
- `react/src/components/gnani/MicButton.tsx`

---

## Quick Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| State not transitioning | Console logs | Verify valid transition exists |
| Barge-in not working | Current state | Must be `thinking` or `speaking` |
| No spoken text | `spokenText.words` | Verify words array populated |
| No audio preprocessing | Browser support | Check `getSupportedConstraints()` |
| TTS not playing | StreamingTTS instance | Verify `addTextChunk()` called |

---

## Testing Checklist

- [ ] Wake-word detection triggers listening
- [ ] Manual mic click starts listening
- [ ] VAD detects end of speech
- [ ] State transitions to thinking
- [ ] LLM chunks arrive
- [ ] TTS starts playing
- [ ] Spoken text displays
- [ ] Word highlighting works
- [ ] Barge-in interrupts TTS
- [ ] Manual barge-in works
- [ ] State returns to idle after TTS

---

## Performance Tips

1. **Use React.memo** for expensive components
2. **Throttle audio level updates** to 60fps
3. **Debounce VAD** to prevent flapping
4. **Clear state history** if memory grows
5. **Lazy load** heavy components

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Echo Cancellation | ✅ | ⚠️ | ⚠️ |
| Noise Suppression | ✅ | ⚠️ | ⚠️ |
| Auto Gain Control | ✅ | ⚠️ | ⚠️ |
| Web Speech API | ✅ | ✅ | ✅ |
| AudioWorklet | ✅ | ✅ | ✅ |

✅ = Full support | ⚠️ = Partial support | ❌ = No support
