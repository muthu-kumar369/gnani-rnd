# Stage 11: State Machine Implementation

**Priority:** P1  
**Estimated Time:** 1 week  
**Dependencies:** Stage 9 (Security)

---

## Objective

Implement a deterministic state machine for assistant behavior to eliminate race conditions, improve reliability, and provide clear state transitions.

---

## Implementation

### 1. State Machine Definition

**File:** `src/core/state-machine/assistant-states.ts`

```typescript
export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  THINKING = 'THINKING',
  GENERATING = 'GENERATING',
  SPEAKING = 'SPEAKING',
  TOOL_EXECUTING = 'TOOL_EXECUTING',
  ERROR = 'ERROR'
}

export enum AssistantEvent {
  ACTIVATE = 'ACTIVATE',
  SPEECH_START = 'SPEECH_START',
  SPEECH_END = 'SPEECH_END',
  TRANSCRIPT_READY = 'TRANSCRIPT_READY',
  CONTEXT_READY = 'CONTEXT_READY',
  LLM_START = 'LLM_START',
  LLM_COMPLETE = 'LLM_COMPLETE',
  TTS_START = 'TTS_START',
  TTS_COMPLETE = 'TTS_COMPLETE',
  TOOL_START = 'TOOL_START',
  TOOL_COMPLETE = 'TOOL_COMPLETE',
  ERROR = 'ERROR',
  CANCEL = 'CANCEL',
  RESET = 'RESET'
}

export interface StateTransition {
  from: AssistantState;
  event: AssistantEvent;
  to: AssistantState;
  guard?: () => boolean;
  action?: () => void | Promise<void>;
}
```

### 2. State Machine Implementation

**File:** `src/core/state-machine/assistant.machine.ts`

```typescript
import { EventEmitter } from 'events';
import { AssistantState, AssistantEvent, StateTransition } from './assistant-states.js';
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'StateMachine' });

export class AssistantStateMachine extends EventEmitter {
  private state: AssistantState = AssistantState.IDLE;
  private transitions: Map<string, StateTransition> = new Map();
  private stateHistory: Array<{ state: AssistantState; timestamp: Date }> = [];

  constructor() {
    super();
    this.defineTransitions();
  }

  private defineTransitions() {
    const transitions: StateTransition[] = [
      // From IDLE
      { from: AssistantState.IDLE, event: AssistantEvent.ACTIVATE, to: AssistantState.LISTENING },
      
      // From LISTENING
      { from: AssistantState.LISTENING, event: AssistantEvent.SPEECH_END, to: AssistantState.PROCESSING },
      { from: AssistantState.LISTENING, event: AssistantEvent.CANCEL, to: AssistantState.IDLE },
      
      // From PROCESSING
      { from: AssistantState.PROCESSING, event: AssistantEvent.TRANSCRIPT_READY, to: AssistantState.THINKING },
      { from: AssistantState.PROCESSING, event: AssistantEvent.ERROR, to: AssistantState.ERROR },
      
      // From THINKING
      { from: AssistantState.THINKING, event: AssistantEvent.CONTEXT_READY, to: AssistantState.GENERATING },
      { from: AssistantState.THINKING, event: AssistantEvent.ERROR, to: AssistantState.ERROR },
      
      // From GENERATING
      { from: AssistantState.GENERATING, event: AssistantEvent.LLM_COMPLETE, to: AssistantState.SPEAKING },
      { from: AssistantState.GENERATING, event: AssistantEvent.TOOL_START, to: AssistantState.TOOL_EXECUTING },
      { from: AssistantState.GENERATING, event: AssistantEvent.CANCEL, to: AssistantState.IDLE },
      { from: AssistantState.GENERATING, event: AssistantEvent.ERROR, to: AssistantState.ERROR },
      
      // From TOOL_EXECUTING
      { from: AssistantState.TOOL_EXECUTING, event: AssistantEvent.TOOL_COMPLETE, to: AssistantState.GENERATING },
      { from: AssistantState.TOOL_EXECUTING, event: AssistantEvent.ERROR, to: AssistantState.ERROR },
      
      // From SPEAKING
      { from: AssistantState.SPEAKING, event: AssistantEvent.TTS_COMPLETE, to: AssistantState.IDLE },
      { from: AssistantState.SPEAKING, event: AssistantEvent.SPEECH_START, to: AssistantState.LISTENING }, // Barge-in
      
      // From ERROR
      { from: AssistantState.ERROR, event: AssistantEvent.RESET, to: AssistantState.IDLE },
      
      // Global transitions
      { from: AssistantState.IDLE, event: AssistantEvent.ERROR, to: AssistantState.ERROR }
    ];

    transitions.forEach(t => {
      const key = `${t.from}:${t.event}`;
      this.transitions.set(key, t);
    });
  }

  /**
   * Transition to new state
   */
  async transition(event: AssistantEvent): Promise<boolean> {
    const key = `${this.state}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      logger.warn(`Invalid transition`, { from: this.state, event });
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard()) {
      logger.debug(`Transition guard failed`, { from: this.state, event });
      return false;
    }

    const previousState = this.state;
    
    // Exit current state
    await this.onExit(previousState);
    
    // Update state
    this.state = transition.to;
    
    // Record history
    this.stateHistory.push({
      state: this.state,
      timestamp: new Date()
    });

    // Keep last 100 states
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    // Enter new state
    await this.onEnter(this.state);

    // Execute transition action
    if (transition.action) {
      await transition.action();
    }

    logger.info(`State transition`, {
      from: previousState,
      event,
      to: this.state
    });

    // Emit state change event
    this.emit('stateChange', {
      from: previousState,
      to: this.state,
      event
    });

    return true;
  }

  private async onEnter(state: AssistantState): Promise<void> {
    logger.debug(`Entering state: ${state}`);
    
    // State-specific entry actions
    switch (state) {
      case AssistantState.LISTENING:
        this.emit('action:startListening');
        break;
      case AssistantState.GENERATING:
        this.emit('action:startGenerating');
        break;
      case AssistantState.SPEAKING:
        this.emit('action:startSpeaking');
        break;
    }
  }

  private async onExit(state: AssistantState): Promise<void> {
    logger.debug(`Exiting state: ${state}`);
    
    // State-specific exit actions
    switch (state) {
      case AssistantState.LISTENING:
        this.emit('action:stopListening');
        break;
      case AssistantState.GENERATING:
        this.emit('action:stopGenerating');
        break;
    }
  }

  /**
   * Get current state
   */
  getState(): AssistantState {
    return this.state;
  }

  /**
   * Check if in specific state
   */
  isInState(state: AssistantState): boolean {
    return this.state === state;
  }

  /**
   * Get state history
   */
  getHistory(): Array<{ state: AssistantState; timestamp: Date }> {
    return [...this.stateHistory];
  }

  /**
   * Reset to IDLE
   */
  async reset(): Promise<void> {
    await this.transition(AssistantEvent.RESET);
  }
}

export default new AssistantStateMachine();
```

### 3. Integration with Session Coordinator

**File:** `src/modules/session/session.coordinator.ts`

```typescript
import assistantStateMachine from '../../core/state-machine/assistant.machine.js';
import { AssistantEvent } from '../../core/state-machine/assistant-states.js';

export class SessionCoordinator {
  constructor() {
    // Listen to state machine events
    assistantStateMachine.on('stateChange', ({ from, to, event }) => {
      logger.info(`Assistant state changed`, { from, to, event });
      
      // Emit to frontend via gRPC
      this.broadcastStateChange(from, to, event);
    });

    assistantStateMachine.on('action:startListening', () => {
      // Start microphone
    });

    assistantStateMachine.on('action:stopListening', () => {
      // Stop microphone
    });
  }

  async processAudioChunk(sessionId: string, audioChunk: Buffer): Promise<void> {
    // Trigger state transition
    if (assistantStateMachine.isInState(AssistantState.IDLE)) {
      await assistantStateMachine.transition(AssistantEvent.SPEECH_START);
    }

    // Process audio...
  }

  async handleFinalTranscript(sessionId: string, transcript: string): Promise<void> {
    // Transition through states
    await assistantStateMachine.transition(AssistantEvent.TRANSCRIPT_READY);
    
    // Build context
    const context = await this.contextBuilder.build(...);
    await assistantStateMachine.transition(AssistantEvent.CONTEXT_READY);
    
    // Generate LLM response
    await assistantStateMachine.transition(AssistantEvent.LLM_START);
    const response = await this.llmExecutor.generate(context);
    await assistantStateMachine.transition(AssistantEvent.LLM_COMPLETE);
    
    // Start TTS
    await assistantStateMachine.transition(AssistantEvent.TTS_START);
  }
}
```

---

## Verification Checklist

- [ ] State machine implemented with all states
- [ ] All transitions defined
- [ ] Invalid transitions prevented
- [ ] State changes logged
- [ ] Frontend synced with state
- [ ] Barge-in handled correctly
- [ ] Error states handled
- [ ] State history tracked

---

## Success Criteria

1. ✅ Zero race conditions
2. ✅ All state transitions deterministic
3. ✅ Invalid transitions prevented
4. ✅ State visible in UI
5. ✅ Error recovery working
