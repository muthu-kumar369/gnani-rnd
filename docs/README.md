# Gnani Voice Assistant - Documentation Index

Welcome to the Gnani Voice Assistant documentation! This directory contains comprehensive guides for understanding, using, and extending the voice assistant system.

## 📚 Documentation Files

### 1. [Phase 2 Walkthrough](./phase-2-walkthrough.md)
**Comprehensive implementation guide**
- Complete feature documentation
- Architecture diagrams
- Testing procedures
- Configuration options
- Troubleshooting guides

**Read this for**: Understanding what was implemented and how to test it

---

### 2. [Quick Reference](./quick-reference.md)
**Fast API reference and common tasks**
- State machine quick guide
- Code snippets for common tasks
- Configuration locations
- Debugging tips
- Browser compatibility

**Read this for**: Quick lookups while coding

---

## 🎯 Quick Start

### For Developers
1. Read [Phase 2 Walkthrough](./phase-2-walkthrough.md) - Sections 1-5
2. Review [Quick Reference](./quick-reference.md) - State Machine section
3. Check file locations in Quick Reference
4. Start coding!

### For Testers
1. Read [Phase 2 Walkthrough](./phase-2-walkthrough.md) - Testing Guide section
2. Follow test procedures step-by-step
3. Use Troubleshooting section if issues arise

### For Configuration
1. Check [Quick Reference](./quick-reference.md) - Configuration Files section
2. Adjust settings as needed
3. Test changes with procedures from Walkthrough

---

## 🏗️ Architecture Overview

```
Gnani Voice Assistant
├── State Machine (idle → listening → thinking → speaking)
├── Audio Preprocessing (AEC/NS/AGC)
├── Barge-in System (VAD + Manual)
├── Spoken Text Display (Real-time highlighting)
└── Streaming TTS (Sentence-based queueing)
```

---

## 📁 Project Structure

```
gnani-rnd/
├── docs/                          # 📖 Documentation (you are here)
│   ├── README.md                  # This file
│   ├── phase-2-walkthrough.md     # Complete implementation guide
│   └── quick-reference.md         # Quick API reference
│
├── react/src/
│   ├── state/
│   │   └── GnaniStateMachine.ts   # Core state machine
│   ├── hooks/
│   │   ├── useGnaniState.ts       # State machine hook
│   │   ├── useBargeIn.ts          # Barge-in hook
│   │   ├── useSpokenText.ts       # Spoken text hook
│   │   ├── useAudioPreprocessing.ts
│   │   └── useMicrophone.ts       # Microphone with preprocessing
│   ├── components/gnani/
│   │   ├── GnaniCore.tsx          # Main orchestration
│   │   ├── SpokenTextDisplay.tsx  # Spoken text UI
│   │   ├── AIAvatar.tsx
│   │   ├── MicButton.tsx
│   │   └── ...
│   └── utils/
│       └── streamingTTS.ts        # TTS manager
│
└── electron/
    ├── wake/
    │   ├── wakeEngine.js          # Wake-word detection
    │   └── wakeManager.js
    └── vad/
        ├── vadEngine.js           # VAD engine
        └── vadManager.js          # VAD with hysteresis
```

---

## 🔑 Key Concepts

### State Machine
Single source of truth for application state. All components react to state changes.

### Barge-in
User can interrupt the assistant at any time by speaking or clicking the mic button.

### Audio Preprocessing
Echo cancellation, noise suppression, and automatic gain control improve audio quality.

### Spoken Text Display
Shows what Gnani is currently saying with word-by-word highlighting.

---

## 🚀 Features Implemented

- ✅ Deterministic state machine
- ✅ Audio preprocessing (AEC/NS/AGC)
- ✅ Barge-in system (VAD + manual)
- ✅ Spoken text display with highlighting
- ✅ Full GnaniCore integration
- ✅ Jarvis theme maintained
- ✅ TypeScript type safety
- ✅ Comprehensive error logging

---

## 📋 Common Tasks

### Check Current State
```typescript
const { state } = useGnaniState();
console.log('Current state:', state);
```

### Trigger Barge-in
```typescript
const bargeIn = useBargeIn(state, handleBargeIn);
bargeIn.handleManualBargeIn();
```

### Display Spoken Text
```tsx
<SpokenTextDisplay 
  words={spokenText.words} 
  isVisible={isSpeaking}
/>
```

---

## 🐛 Troubleshooting

### Quick Checks
1. **State not changing?** → Check console for transition logs
2. **Barge-in not working?** → Verify state is `thinking` or `speaking`
3. **No spoken text?** → Check `spokenText.words` array
4. **Audio quality poor?** → Verify preprocessing is applied

### Detailed Guides
See [Phase 2 Walkthrough - Troubleshooting](./phase-2-walkthrough.md#troubleshooting) for detailed solutions.

---

## 🔧 Configuration

### VAD Sensitivity
```javascript
// electron/vad/vadManager.js
config: {
  speechStartThreshold: 5,
  speechEndThreshold: 20,
  hysteresisMargin: 3,
}
```

### Barge-in Threshold
```typescript
// react/src/hooks/useBargeIn.ts
vadThreshold: 3,      // Consecutive speech frames
debounceMs: 100,      // Debounce time
```

### Speaking Rate
```typescript
// In your component
spokenText.setSpeakingRate(3.5); // words per second
```

---

## 📊 Testing

### Manual Testing
Follow procedures in [Phase 2 Walkthrough - Testing Guide](./phase-2-walkthrough.md#testing-guide)

### Automated Testing
Coming in Phase 2.3

---

## 🔮 Future Enhancements

### Phase 2.1
- Session management
- Advanced animations
- UI toggles for preprocessing

### Phase 2.2
- Voice selection
- Latency metrics
- Accessibility improvements

### Phase 2.3
- Unit tests
- Integration tests
- Performance benchmarks

---

## 📞 Support

### Documentation Issues
If you find errors or have suggestions for improving this documentation:
1. Check existing issues
2. Create detailed bug report
3. Suggest improvements

### Code Issues
For bugs or feature requests:
1. Check console logs
2. Review troubleshooting guide
3. Create issue with reproduction steps

---

## 📝 Version History

### Phase 2 (Current)
- State machine implementation
- Audio preprocessing
- Barge-in system
- Spoken text display
- Full integration

### Phase 1
- TTS streaming with sentence detection
- Wake-word frame buffering
- VAD hysteresis

---

## 🎓 Learning Resources

### Understanding State Machines
- [Phase 2 Walkthrough - State Machine](./phase-2-walkthrough.md#1-deterministic-state-machine-)

### Audio Processing
- [Phase 2 Walkthrough - Audio Preprocessing](./phase-2-walkthrough.md#2-audio-preprocessing-aecnsagc-)

### React Hooks
- [Quick Reference - Hooks](./quick-reference.md#hooks)

---

## 📄 License

See project root for license information.

---

**Last Updated**: 2025-11-26  
**Version**: Phase 2 Complete  
**Status**: Production Ready ✅
