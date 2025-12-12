# STAGE 5: VOICE MODE INTEGRATION & VERIFICATION

**Duration:** 1 week  
**Complexity:** Medium  
**Risk:** Medium  
**Dependencies:** Stages 1-4 complete

---

## 🎯 OBJECTIVE

Ensure voice mode (GnaniCore + TerminalPanel) continues to work correctly after all chat enhancements. Verify smooth transitions between chat and voice modes, and ensure no regressions were introduced.

---

## 📋 SCOPE

### Areas to Verify

1. **Voice Mode Functionality** - GnaniCore + TerminalPanel still work
2. **Mode Transitions** - Smooth switching between chat and voice
3. **Shared Components** - Components used by both modes work correctly
4. **State Synchronization** - Conversation state syncs across modes
5. **Integration Testing** - End-to-end testing of both modes

---

## 🔧 TASK 1: VOICE MODE VERIFICATION (2-3 days)

### Step 1.1: Test GnaniCore Component (1 day)

**File:** `src/components/gnani/GnaniCore.tsx`

**Test Cases:**

1. **Wake Word Detection:**
   - [ ] Wake word triggers voice mode
   - [ ] Visual feedback shows listening state
   - [ ] Audio input starts correctly

2. **Speech-to-Text:**
   - [ ] Microphone captures audio
   - [ ] Partial transcripts display
   - [ ] Final transcript appears
   - [ ] Whisper.cpp integration works

3. **LLM Response:**
   - [ ] LLM generates response
   - [ ] Streaming chunks display
   - [ ] Response completes correctly

4. **Text-to-Speech:**
   - [ ] TTS audio plays
   - [ ] Audio quality is good
   - [ ] Playback controls work

5. **Barge-in:**
   - [ ] User can interrupt AI
   - [ ] Audio stops immediately
   - [ ] New input starts

**Verification Commands:**

```bash
# Check Electron IPC events
# In browser console:
window.electron.on('mic:data', (data) => console.log('Mic data:', data));
window.electron.on('vad:speech-start', () => console.log('Speech started'));
window.electron.on('vad:speech-end', () => console.log('Speech ended'));

# Check state machine
# In React DevTools, inspect gnaniMachine state
```

### Step 1.2: Test TerminalPanel Component (1 day)

**File:** `src/components/terminal/TerminalPanel.tsx`

**Test Cases:**

1. **Message Display:**
   - [ ] Messages render correctly
   - [ ] MessageBubble shows rich content
   - [ ] Code blocks work
   - [ ] Images display
   - [ ] Mermaid diagrams render

2. **Terminal Features:**
   - [ ] BranchTree displays
   - [ ] GenerationNavigator works
   - [ ] InlineMessageEditor works
   - [ ] FeedbackButtons work
   - [ ] Model/template selectors work

3. **Input:**
   - [ ] TextInput accepts text
   - [ ] File upload works
   - [ ] Attachments display
   - [ ] Send button works

4. **Status Indicators:**
   - [ ] StateIndicator shows correct state
   - [ ] ActionIndicator shows actions
   - [ ] TypingIndicator animates
   - [ ] Progress indicators work

**Verification:**

```bash
# Check terminal rendering
# Open voice mode and verify all features work
# Compare with chat mode to ensure parity
```

### Step 1.3: Test State Machine (1 day)

**File:** `src/machines/gnaniStateMachine.ts`

**Test Cases:**

1. **State Transitions:**
   - [ ] idle → wakeWordListening
   - [ ] wakeWordListening → micRecording
   - [ ] micRecording → streaming
   - [ ] streaming → receivingSTT
   - [ ] receivingSTT → thinking
   - [ ] thinking → responding
   - [ ] responding → idle
   - [ ] Any state → error → idle

2. **Context Updates:**
   - [ ] transcript updates correctly
   - [ ] partialTranscript updates
   - [ ] response accumulates chunks
   - [ ] conversationMessages array updates

3. **Event Handling:**
   - [ ] WAKE_WORD_DETECTED
   - [ ] START_RECORDING
   - [ ] STOP_RECORDING
   - [ ] STT_PARTIAL
   - [ ] STT_FINAL
   - [ ] LLM_CHUNK
   - [ ] LLM_DONE
   - [ ] ERROR

**Verification:**

```tsx
// Add state machine inspector
import { inspect } from '@xstate/inspect';

if (process.env.NODE_ENV === 'development') {
    inspect({
        iframe: false,
    });
}

// In component
const [state, send] = useMachine(gnaniMachine, {
    devTools: true,
});
```

---

## 🔧 TASK 2: MODE TRANSITION TESTING (2 days)

### Step 2.1: Chat to Voice Transition (1 day)

**Test Flow:**

1. **Start in Chat Mode:**
   - [ ] Chat interface loads
   - [ ] Send a message
   - [ ] Receive response

2. **Switch to Voice Mode:**
   - [ ] Click voice button / say wake word
   - [ ] Voice mode activates
   - [ ] TerminalPanel displays
   - [ ] Conversation history loads

3. **Verify State:**
   - [ ] Same conversation ID
   - [ ] Messages appear in terminal
   - [ ] No data loss

**Implementation:**

```tsx
// src/pages/ChatPage.tsx
const handleVoiceMode = () => {
    // Save current state
    const currentState = {
        conversationId,
        messages,
        scrollPosition: messageListRef.current?.scrollTop,
    };
    
    // Transition to voice mode
    setMode('voice');
    
    // Restore state in voice mode
    restoreState(currentState);
};
```

### Step 2.2: Voice to Chat Transition (1 day)

**Test Flow:**

1. **Start in Voice Mode:**
   - [ ] Voice mode active
   - [ ] Say something
   - [ ] Receive voice response

2. **Switch to Chat Mode:**
   - [ ] Click chat button / exit voice mode
   - [ ] Chat interface displays
   - [ ] Conversation history loads

3. **Verify State:**
   - [ ] Same conversation ID
   - [ ] Messages appear in chat
   - [ ] No data loss
   - [ ] Scroll position preserved

**Implementation:**

```tsx
// src/components/gnani/GnaniCore.tsx
const handleExitVoiceMode = () => {
    // Save voice mode state
    const voiceState = {
        conversationId,
        messages,
        currentBranch,
    };
    
    // Transition to chat mode
    setMode('chat');
    
    // Restore state in chat mode
    restoreState(voiceState);
};
```

---

## 🔧 TASK 3: SHARED COMPONENT TESTING (1-2 days)

### Step 3.1: Test Shared Components (1 day)

**Components Used by Both Modes:**

1. **FeedbackButtons:**
   - [ ] Works in terminal/MessageBubble
   - [ ] Works in chat/MessageItem
   - [ ] Same API integration
   - [ ] Same styling

2. **CodeBlock:**
   - [ ] Renders in terminal
   - [ ] Renders in chat
   - [ ] Syntax highlighting works
   - [ ] Copy button works

3. **ImageGallery:**
   - [ ] Displays in terminal
   - [ ] Displays in chat
   - [ ] Preview modal works
   - [ ] Same behavior

4. **DateSeparator:**
   - [ ] Shows in terminal
   - [ ] Shows in chat
   - [ ] Same date formatting

**Verification:**

```bash
# Test in both modes
# 1. Send message with code block in chat
# 2. Switch to voice mode
# 3. Verify code block renders correctly
# 4. Test copy button in both modes
```

### Step 3.2: Test State Synchronization (1 day)

**State to Sync:**

1. **Conversation State:**
   - [ ] conversationId syncs
   - [ ] messages array syncs
   - [ ] title syncs
   - [ ] metadata syncs

2. **User Preferences:**
   - [ ] Model selection syncs
   - [ ] Template selection syncs
   - [ ] Settings sync

3. **UI State:**
   - [ ] Scroll position (optional)
   - [ ] Selected message (optional)
   - [ ] Expanded branches (optional)

**Implementation:**

```tsx
// src/store/useConversationStore.ts
// Ensure store is shared across modes

export const useConversationStore = create<ConversationStore>((set, get) => ({
    // ... existing state ...
    
    // Sync method
    syncState: () => {
        const state = get();
        // Broadcast state to all components
        eventManager.emit('conversation:sync', state);
    },
}));
```

---

## 🔧 TASK 4: INTEGRATION TESTING (2-3 days)

### Step 4.1: End-to-End Testing (1-2 days)

**Test Scenarios:**

1. **Full Chat Flow:**
   - [ ] Create new conversation
   - [ ] Send multiple messages
   - [ ] Edit message
   - [ ] Regenerate response
   - [ ] Create branch
   - [ ] Give feedback
   - [ ] Share conversation
   - [ ] Delete conversation

2. **Full Voice Flow:**
   - [ ] Activate voice mode
   - [ ] Say wake word
   - [ ] Speak query
   - [ ] Receive voice response
   - [ ] Interrupt (barge-in)
   - [ ] Switch to chat
   - [ ] Verify conversation synced

3. **Mixed Flow:**
   - [ ] Start in chat
   - [ ] Send text message
   - [ ] Switch to voice
   - [ ] Speak query
   - [ ] Switch back to chat
   - [ ] Continue text conversation
   - [ ] Verify all messages present

**Automated Tests:**

```typescript
// tests/e2e/voice-chat-integration.spec.ts
import { test, expect } from '@playwright/test';

test('chat to voice transition', async ({ page }) => {
    // Start in chat
    await page.goto('/');
    await page.fill('[data-testid="chat-input"]', 'Hello');
    await page.click('[data-testid="send-button"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]');
    
    // Switch to voice
    await page.click('[data-testid="voice-button"]');
    
    // Verify voice mode active
    await expect(page.locator('[data-testid="terminal-panel"]')).toBeVisible();
    
    // Verify messages synced
    const messages = await page.locator('[data-testid="message-bubble"]').count();
    expect(messages).toBeGreaterThan(0);
});

test('voice to chat transition', async ({ page }) => {
    // Similar test for voice → chat
});
```

### Step 4.2: Performance Testing (1 day)

**Metrics to Measure:**

1. **Mode Transition Speed:**
   - [ ] Chat → Voice: < 500ms
   - [ ] Voice → Chat: < 500ms

2. **State Sync Speed:**
   - [ ] Conversation load: < 1s
   - [ ] Message sync: < 100ms

3. **Memory Usage:**
   - [ ] No memory leaks
   - [ ] Reasonable memory footprint

**Tools:**

```bash
# Use Chrome DevTools Performance tab
# Record mode transition
# Analyze:
# - Layout shifts
# - Paint operations
# - JavaScript execution time
# - Memory allocation

# Use React DevTools Profiler
# Measure component render times
```

### Step 4.3: Regression Testing (1 day)

**Areas to Check:**

1. **Chat Features:**
   - [ ] All chat features still work
   - [ ] No new bugs introduced
   - [ ] Performance not degraded

2. **Voice Features:**
   - [ ] All voice features still work
   - [ ] Audio quality maintained
   - [ ] State machine stable

3. **Shared Features:**
   - [ ] Conversation management works
   - [ ] File upload works
   - [ ] Search works
   - [ ] Analytics works

**Regression Test Suite:**

```bash
# Run full test suite
npm run test

# Run E2E tests
npm run test:e2e

# Run visual regression tests (if available)
npm run test:visual

# Check bundle size
npm run build
# Verify bundle size hasn't increased significantly
```

---

## 🔧 TASK 5: BUG FIXES & POLISH (1-2 days)

### Step 5.1: Fix Identified Issues (1 day)

**Common Issues:**

1. **State Sync Issues:**
   - Messages not syncing between modes
   - Conversation ID mismatch
   - Lost scroll position

2. **UI Issues:**
   - Layout shifts during transition
   - Flickering
   - Incorrect styling

3. **Performance Issues:**
   - Slow transitions
   - Memory leaks
   - Laggy animations

**Fix Process:**

```typescript
// Example fix: State sync issue
// Before:
const switchMode = (newMode) => {
    setMode(newMode);
};

// After:
const switchMode = (newMode) => {
    // Save current state
    const currentState = captureState();
    
    // Switch mode
    setMode(newMode);
    
    // Restore state in new mode
    setTimeout(() => {
        restoreState(currentState);
    }, 0);
};
```

### Step 5.2: Polish Transitions (1 day)

**Enhancements:**

1. **Smooth Animations:**

```tsx
// Add transition animation
<AnimatePresence mode="wait">
    {mode === 'chat' ? (
        <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <ChatPage />
        </motion.div>
    ) : (
        <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <GnaniCore />
        </motion.div>
    )}
</AnimatePresence>
```

2. **Loading States:**

```tsx
// Show loading during transition
{isTransitioning && (
    <div className="transition-overlay">
        <Loader />
        <p>Switching to {targetMode} mode...</p>
    </div>
)}
```

---

## ✅ ACCEPTANCE CRITERIA

### Voice Mode
- [ ] GnaniCore works correctly
- [ ] TerminalPanel displays properly
- [ ] All terminal features work
- [ ] State machine transitions correctly
- [ ] Audio input/output works
- [ ] Wake word detection works
- [ ] Barge-in works

### Mode Transitions
- [ ] Chat → Voice transition smooth
- [ ] Voice → Chat transition smooth
- [ ] State syncs correctly
- [ ] No data loss
- [ ] Animations smooth
- [ ] Loading states clear

### Shared Components
- [ ] FeedbackButtons work in both modes
- [ ] CodeBlock renders in both modes
- [ ] ImageGallery works in both modes
- [ ] All shared components functional

### Integration
- [ ] End-to-end tests pass
- [ ] Performance metrics met
- [ ] No regressions
- [ ] Memory usage acceptable

### Quality
- [ ] All bugs fixed
- [ ] Transitions polished
- [ ] User experience smooth
- [ ] Documentation updated

---

## 📊 SUCCESS METRICS

- **Test Coverage:** >80% for voice mode
- **Transition Speed:** <500ms
- **Bug Count:** 0 critical, <3 high priority
- **Performance:** No degradation from baseline
- **User Experience:** Smooth, no jarring transitions

---

## 📚 DOCUMENTATION

### Update Documentation

1. **README.md:**
   - Document voice mode usage
   - Document mode switching
   - Document keyboard shortcuts

2. **ARCHITECTURE.md:**
   - Document state synchronization
   - Document mode transition flow
   - Document shared components

3. **TESTING.md:**
   - Document test scenarios
   - Document E2E test setup
   - Document performance benchmarks

---

## 🚨 ROLLBACK PLAN

If critical issues found:

1. **Identify Issue:**
   - Determine if issue is in chat or voice mode
   - Check if regression or new bug

2. **Isolate:**
   - Disable problematic feature
   - Revert to previous working state

3. **Fix:**
   - Create hotfix branch
   - Fix issue
   - Test thoroughly
   - Deploy fix

---

**End of Stage 5 Prompt**

---

## 🎉 PROJECT COMPLETION

After completing all 5 stages:

1. **Final Verification:**
   - [ ] All features working
   - [ ] All tests passing
   - [ ] Performance metrics met
   - [ ] Documentation complete

2. **Deployment:**
   - [ ] Build production bundle
   - [ ] Run final tests
   - [ ] Deploy to staging
   - [ ] User acceptance testing
   - [ ] Deploy to production

3. **Monitoring:**
   - [ ] Monitor error rates
   - [ ] Monitor performance
   - [ ] Collect user feedback
   - [ ] Plan next iteration

**Congratulations! UI Upgrade Complete! 🎊**
