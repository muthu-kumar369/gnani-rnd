# Stage 5: Make Terminal Primary Interface

## Overview
Transform the terminal from a hidden panel to the primary chat interface, making it always visible and centered like ChatGPT.

## Current State Analysis

**Current Behavior**:
- Terminal is hidden by default
- Must click "TERMINAL" button to see messages
- Terminal is a small floating panel in bottom-left
- Voice UI (GnaniCore) is primary interface

**Gap**: ChatGPT's chat interface is always visible and central. Users expect to see their conversation history immediately.

---

## Implementation Steps

### Step 1: Redesign Layout Structure

**File**: `D:\learning\hey\gnani-rnd\react\src\layouts\ChatLayout.tsx`

```tsx
const ChatLayout = () => {
  return (
    <div className="flex h-screen bg-black">
      {/* Left Sidebar - Conversation History */}
      <ConversationSidebar isOpen={true} alwaysVisible={true} />

      {/* Main Chat Area - Always Visible */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ChatHeader />

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <TerminalPanel isVisible={true} isPrimary={true} />
        </div>

        {/* Input Area */}
        <ChatInput />
      </div>

      {/* Right Sidebar - Voice UI (Collapsible) */}
      <VoicePanel isCollapsed={voiceCollapsed} onToggle={setVoiceCollapsed} />
    </div>
  );
};
```

### Step 2: Update TerminalPanel for Primary Mode

**File**: `D:\learning\hey\gnani-rnd\react\src\components\terminal\TerminalPanel.tsx`

```tsx
interface TerminalPanelProps {
  isVisible: boolean;
  isPrimary?: boolean; // NEW: Indicates if terminal is primary interface
  onToggle?: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ 
  isVisible, 
  isPrimary = false,
  onToggle 
}) => {
  if (!isVisible) return null;

  // Different styles for primary vs floating mode
  const containerClasses = isPrimary
    ? "h-full flex flex-col bg-transparent" // Full height, no floating
    : "fixed left-4 bottom-4 z-50 flex flex-col glass-panel rounded-lg w-[400px] h-[450px]"; // Original floating style

  return (
    <div className={containerClasses}>
      {/* Conditional header - only show in floating mode */}
      {!isPrimary && (
        <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/50 border-b border-cyan-500/30">
          {/* ... existing header ... */}
        </div>
      )}

      {/* Messages Area - Full height in primary mode */}
      <div className={`flex-1 overflow-hidden ${isPrimary ? 'p-6' : 'p-4'}`}>
        {/* ... existing messages ... */}
      </div>

      {/* Input always at bottom in primary mode */}
      {isPrimary && <ChatInput />}
    </div>
  );
};
```

### Step 3: Create Dedicated ChatInput Component

**File**: `D:\learning\hey\gnani-rnd\react\src\components\chat\ChatInput.tsx` (NEW)

```tsx
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    // Send message logic
    setInput('');
  };

  return (
    <div className="border-t border-cyan-500/20 bg-black/50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-3">
          {/* Attachment Button */}
          <button className="p-2 hover:bg-cyan-500/20 rounded transition-colors">
            <Paperclip size={20} className="text-cyan-400" />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="flex-1 bg-transparent text-cyan-100 placeholder-cyan-500/40 resize-none focus:outline-none max-h-32"
            rows={1}
          />

          {/* Voice Button */}
          <button className="p-2 hover:bg-cyan-500/20 rounded transition-colors">
            <Mic size={20} className="text-cyan-400" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={20} className="text-black" />
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-cyan-500/40 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
```

### Step 4: Move Voice UI to Collapsible Right Panel

**File**: `D:\learning\hey\gnani-rnd\react\src\components\gnani\VoicePanel.tsx` (NEW)

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import GnaniCore from './GnaniCore';

interface VoicePanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const VoicePanel: React.FC<VoicePanelProps> = ({ isCollapsed, onToggle }) => {
  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 60 : 400 }}
      className="border-l border-cyan-500/20 bg-black/50 relative"
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-full"
      >
        {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <GnaniCore isOverlayMode={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Mic size={24} className="text-cyan-400" />
          <span className="text-xs text-cyan-500/60 writing-mode-vertical">
            Voice
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default VoicePanel;
```

---

## Testing Instructions

1. Start application
2. ✅ Verify chat interface is immediately visible
3. ✅ Verify conversation history on left
4. ✅ Verify messages in center
5. ✅ Verify input at bottom
6. ✅ Verify voice panel on right (collapsed by default)
7. Click voice panel toggle
8. ✅ Verify voice UI expands smoothly
9. Send a message via text
10. ✅ Verify message appears immediately in center
11. Click voice panel toggle again
12. ✅ Verify voice panel collapses

---

## Success Criteria

- ✅ Chat interface visible on app load (no hidden terminal)
- ✅ Layout matches ChatGPT structure (sidebar, chat, input)
- ✅ Voice UI is optional, not primary
- ✅ Smooth transitions between layouts
- ✅ Responsive design works on all screen sizes
- ✅ No functionality lost from previous design

---

## Migration Notes

**Breaking Changes**:
- Default view changes from voice UI to chat UI
- Users who prefer voice-first may need adjustment period

**Mitigation**:
- Add user preference to choose default view
- Show onboarding tooltip explaining new layout
- Keep voice panel easily accessible

---

## Estimated Time: 12 hours
