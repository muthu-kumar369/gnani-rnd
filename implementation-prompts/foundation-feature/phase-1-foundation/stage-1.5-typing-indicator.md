# Stage 1.5: Typing Indicator

## Summary
Implement a visual typing indicator that displays when the assistant is generating a response. This provides critical UX feedback during LLM response generation, showing users that their request is being processed.

## Goals
- Display "Gnani is typing..." indicator during response generation
- Show indicator when LLM is processing
- Hide indicator when response starts streaming
- Support different states (thinking, generating, processing tools)
- Integrate with existing animation system
- Work with both text and voice interactions

## Files to Modify / Create

### Backend
- `/src/modules/conversation/conversation.service.ts` → Emit typing events
- `/src/websocket/assistant.socket.ts` → Add typing event handlers
- `/src/types/socket-events.ts` → Add typing event types

### Frontend
- `/src/components/Terminal/TypingIndicator.tsx` → **[NEW]** Typing indicator component
- `/src/components/Terminal/Terminal.tsx` → Integrate typing indicator
- `/src/stores/gnaniStore.ts` → Add typing state management
- `/src/styles/typingIndicator.css` → **[NEW]** Typing indicator styles

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Define Typing Events
In `/src/types/socket-events.ts`:

```typescript
export enum AssistantEvent {
  // Existing events...
  TYPING_START = 'assistant:typing-start',
  TYPING_STOP = 'assistant:typing-stop',
  TYPING_STATUS = 'assistant:typing-status'
}

export interface TypingStatusPayload {
  conversationId: string;
  status: 'thinking' | 'generating' | 'processing-tool' | 'idle';
  message?: string; // Optional status message
}
```

#### Step 2: Emit Typing Events in Conversation Service
In `/src/modules/conversation/conversation.service.ts`:

```typescript
async generateResponse(conversationId: string, userMessage: string) {
  try {
    // Emit typing start
    this.socketService.emit(AssistantEvent.TYPING_START, {
      conversationId,
      status: 'thinking'
    });
    
    // Build context
    const context = await this.buildContext(conversationId);
    
    // Update status to generating
    this.socketService.emit(AssistantEvent.TYPING_STATUS, {
      conversationId,
      status: 'generating'
    });
    
    // Call LLM (streaming)
    const stream = await this.llmService.generateStream(context);
    
    // Stop typing indicator when first token arrives
    stream.on('data', (chunk) => {
      if (firstChunk) {
        this.socketService.emit(AssistantEvent.TYPING_STOP, {
          conversationId
        });
        firstChunk = false;
      }
    });
    
    // Handle tool execution
    if (requiresToolExecution) {
      this.socketService.emit(AssistantEvent.TYPING_STATUS, {
        conversationId,
        status: 'processing-tool',
        message: `Executing ${toolName}...`
      });
    }
    
  } catch (error) {
    // Stop typing on error
    this.socketService.emit(AssistantEvent.TYPING_STOP, {
      conversationId
    });
    throw error;
  }
}
```

#### Step 3: Add WebSocket Handlers
In `/src/websocket/assistant.socket.ts`:

```typescript
// Broadcast typing events to connected clients
socket.on(AssistantEvent.TYPING_START, (payload) => {
  socket.broadcast.to(payload.conversationId).emit(
    AssistantEvent.TYPING_START,
    payload
  );
});

socket.on(AssistantEvent.TYPING_STATUS, (payload) => {
  socket.broadcast.to(payload.conversationId).emit(
    AssistantEvent.TYPING_STATUS,
    payload
  );
});

socket.on(AssistantEvent.TYPING_STOP, (payload) => {
  socket.broadcast.to(payload.conversationId).emit(
    AssistantEvent.TYPING_STOP,
    payload
  );
});
```

### Frontend Implementation

#### Step 4: Create TypingIndicator Component
Create `/src/components/Terminal/TypingIndicator.tsx`:

```typescript
interface TypingIndicatorProps {
  status: 'thinking' | 'generating' | 'processing-tool' | 'idle';
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ status, message }) => {
  if (status === 'idle') return null;
  
  const getStatusText = () => {
    switch (status) {
      case 'thinking':
        return 'Gnani is thinking...';
      case 'generating':
        return 'Gnani is typing...';
      case 'processing-tool':
        return message || 'Processing...';
      default:
        return 'Gnani is working...';
    }
  };
  
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <GnaniIcon />
      </div>
      <div className="typing-content">
        <span className="typing-text">{getStatusText()}</span>
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};
```

#### Step 5: Add State Management
In `/src/stores/gnaniStore.ts`:

```typescript
interface GnaniState {
  // Existing state...
  typingStatus: 'thinking' | 'generating' | 'processing-tool' | 'idle';
  typingMessage?: string;
  
  setTypingStatus: (status: TypingStatus, message?: string) => void;
}

export const useGnaniStore = create<GnaniState>((set) => ({
  // Existing state...
  typingStatus: 'idle',
  typingMessage: undefined,
  
  setTypingStatus: (status, message) => set({ 
    typingStatus: status,
    typingMessage: message 
  }),
}));
```

#### Step 6: Listen to Typing Events
In the WebSocket connection setup (likely in a hook or service):

```typescript
useEffect(() => {
  const socket = getSocket();
  
  socket.on(AssistantEvent.TYPING_START, (payload) => {
    gnaniStore.setTypingStatus(payload.status);
  });
  
  socket.on(AssistantEvent.TYPING_STATUS, (payload) => {
    gnaniStore.setTypingStatus(payload.status, payload.message);
  });
  
  socket.on(AssistantEvent.TYPING_STOP, () => {
    gnaniStore.setTypingStatus('idle');
  });
  
  return () => {
    socket.off(AssistantEvent.TYPING_START);
    socket.off(AssistantEvent.TYPING_STATUS);
    socket.off(AssistantEvent.TYPING_STOP);
  };
}, []);
```

#### Step 7: Integrate into Terminal
In `/src/components/Terminal/Terminal.tsx`:

```typescript
const Terminal: React.FC = () => {
  const { typingStatus, typingMessage } = useGnaniStore();
  
  return (
    <div className="terminal">
      {/* Message list */}
      <MessageList messages={messages} />
      
      {/* Typing indicator */}
      <TypingIndicator status={typingStatus} message={typingMessage} />
      
      {/* Input area */}
      <InputArea />
    </div>
  );
};
```

#### Step 8: Style Typing Indicator
Create `/src/styles/typingIndicator.css`:

```css
.typing-indicator {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin: 8px 0;
  background: rgba(0, 255, 255, 0.05);
  border-left: 2px solid #00ffff;
  border-radius: 8px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ffff, #0080ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.typing-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.typing-text {
  color: #00ffff;
  font-size: 14px;
  font-weight: 500;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots .dot {
  width: 6px;
  height: 6px;
  background: #00ffff;
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.typing-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Integration with Existing Animation System

#### Step 9: Sync with Gnani Animation States
If you have existing Gnani animation states (Idle, Listening, Thinking, Speaking):

```typescript
// When typing starts, set animation to "Thinking"
socket.on(AssistantEvent.TYPING_START, () => {
  gnaniStore.setAnimationState('Thinking');
  gnaniStore.setTypingStatus('thinking');
});

// When response starts streaming, set to "Speaking"
socket.on('message:stream-start', () => {
  gnaniStore.setAnimationState('Speaking');
  gnaniStore.setTypingStatus('idle');
});

// When response completes, set to "Idle"
socket.on('message:stream-end', () => {
  gnaniStore.setAnimationState('Idle');
});
```

### Voice Interaction Support

#### Step 10: Handle Voice Mode Typing Indicator
For voice interactions, the typing indicator should still show:

```typescript
// When user speaks and audio is being transcribed
socket.on('audio:transcribing', () => {
  gnaniStore.setTypingStatus('thinking', 'Transcribing audio...');
});

// When LLM is generating voice response
socket.on('audio:generating-response', () => {
  gnaniStore.setTypingStatus('generating');
});

// When TTS is synthesizing speech
socket.on('audio:synthesizing-speech', () => {
  gnaniStore.setTypingStatus('processing-tool', 'Generating speech...');
});
```

### Error Handling

1. **Timeout:** If typing indicator shows for > 30 seconds, show warning
2. **Connection Lost:** Clear typing indicator if WebSocket disconnects
3. **Multiple Conversations:** Ensure typing indicator only shows for active conversation
4. **Rapid Messages:** Debounce typing events to avoid flickering

### Performance Considerations

1. **Debouncing:** Debounce typing status updates (100ms) to avoid excessive re-renders
2. **Cleanup:** Always clear typing indicator on component unmount
3. **Memory:** Remove event listeners when conversation changes

## Acceptance Criteria

- [ ] Typing indicator appears when assistant starts processing
- [ ] Indicator shows "Gnani is thinking..." during context building
- [ ] Indicator shows "Gnani is typing..." during response generation
- [ ] Indicator shows tool name when executing tools (e.g., "Executing web search...")
- [ ] Indicator disappears when first response token arrives
- [ ] Indicator has smooth fade-in/fade-out animation
- [ ] Animated dots pulse continuously while typing
- [ ] Indicator matches Jarvis HUD theme (cyan accents)
- [ ] Indicator works in both text and voice modes
- [ ] Indicator clears on error or timeout
- [ ] Indicator syncs with Gnani animation states
- [ ] Multiple rapid messages don't cause flickering
- [ ] Indicator only shows for active conversation
- [ ] Typing status is cleared when switching conversations
