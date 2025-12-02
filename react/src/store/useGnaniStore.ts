import { create } from 'zustand';
import GnaniStateMachine from '../state/GnaniStateMachine';
import type { GnaniState, StateTrigger, StateChangeEvent } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

interface GnaniStore {
  state: GnaniState;
  previousState: GnaniState | null;
  isIdle: boolean;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  
  // Actions
  transition: (trigger: StateTrigger) => void;
  
  // Internal (used for initialization)
  _init: () => void;
  _cleanup: () => void;
}

// Singleton instance outside the store to persist across re-renders
let stateMachine: GnaniStateMachine | null = null;

export const useGnaniStore = create<GnaniStore>((set) => ({
  state: 'idle',
  previousState: null,
  isIdle: true,
  isListening: false,
  isThinking: false,
  isSpeaking: false,

  transition: (trigger: StateTrigger) => {
    if (stateMachine) {
      stateMachine.transition(trigger);
    } else {
      errorLogger.warn('Attempted to transition before state machine initialized', { context: 'useGnaniStore' });
    }
  },

  _init: () => {
    if (!stateMachine) {
      console.log('[useGnaniStore] Initializing state machine');
      stateMachine = new GnaniStateMachine();
      errorLogger.info('GnaniStateMachine initialized', { context: 'useGnaniStore' });
    }

    const handleStateChange = (event: StateChangeEvent) => {
      console.log('[useGnaniStore] State change event received:', event);
      set({
        state: event.to,
        previousState: event.from,
        isIdle: event.to === 'idle',
        isListening: event.to === 'listening',
        isThinking: event.to === 'thinking',
        isSpeaking: event.to === 'speaking',
      });
      errorLogger.debug(`State changed: ${event.from} -> ${event.to}`, { context: 'useGnaniStore' });
    };

    stateMachine.on('stateChange', handleStateChange);
  },

  _cleanup: () => {
    // In a global store, we might not want to fully cleanup the machine itself,
    // but we should handle listener cleanup if necessary.
    // For now, we'll leave the machine active as it's a singleton.
  }
}));
