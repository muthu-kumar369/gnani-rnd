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

  // Queue state
  transitionQueue: StateTrigger[];
  isTransitioning: boolean;
}

// Singleton instance outside the store to persist across re-renders
let stateMachine: GnaniStateMachine | null = null;
let stateChangeListener: ((event: StateChangeEvent) => void) | null = null;
let isListenerRegistered = false;

export const useGnaniStore = create<GnaniStore>((set, get) => ({
  state: 'idle',
  previousState: null,
  isIdle: true,
  isListening: false,
  isThinking: false,
  isSpeaking: false,
  transitionQueue: [],
  isTransitioning: false,

  transition: (trigger: StateTrigger) => {
    const { isTransitioning } = get();

    // Queue transition if currently transitioning
    if (isTransitioning) {
      console.log('[useGnaniStore] Queuing transition:', trigger);
      // Store the trigger in a queue to be processed later
      // We need to extend the store interface to hold this queue
      // For now, we'll just log a warning and return if we can't queue effectively without major refactor
      // But let's try to implement a simple queue in the store state
      set((state) => ({
        transitionQueue: [...state.transitionQueue, trigger]
      }));
      return;
    }

    if (stateMachine) {
      console.log('[useGnaniStore] Calling transition:', trigger, 'from state:', get().state);
      set({ isTransitioning: true });

      try {
        stateMachine.transition(trigger);
      } finally {
        // Process next item in queue
        setTimeout(() => {
          set({ isTransitioning: false });
          const currentQueue = get().transitionQueue;
          if (currentQueue.length > 0) {
            const [nextTrigger, ...rest] = currentQueue;
            set({ transitionQueue: rest });
            get().transition(nextTrigger);
          }
        }, 0);
      }
    } else {
      errorLogger.warn('Attempted to transition before state machine initialized', { context: 'useGnaniStore' });
    }
  },

  _init: () => {
    // Create state machine if it doesn't exist
    if (!stateMachine) {
      console.log('[useGnaniStore] Creating new state machine');
      stateMachine = new GnaniStateMachine();
      errorLogger.info('GnaniStateMachine initialized', { context: 'useGnaniStore' });
    }

    // Remove old listener if it exists to prevent duplicates
    if (stateChangeListener && isListenerRegistered) {
      console.log('[useGnaniStore] Removing old state change listener');
      stateMachine.removeListener('stateChange', stateChangeListener);
      isListenerRegistered = false;
    }

    // Create new listener with current 'set' closure
    stateChangeListener = (event: StateChangeEvent) => {
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

    // Register the listener
    console.log('[useGnaniStore] Registering state change listener');
    stateMachine.on('stateChange', stateChangeListener);
    isListenerRegistered = true;

    // Log current state for debugging
    console.log('[useGnaniStore] Current state machine state:', stateMachine.getState());
  },

  _cleanup: () => {
    if (stateMachine && stateChangeListener && isListenerRegistered) {
      console.log('[useGnaniStore] Cleaning up state change listener');
      stateMachine.removeListener('stateChange', stateChangeListener);
      isListenerRegistered = false;
    }
  }
}));
