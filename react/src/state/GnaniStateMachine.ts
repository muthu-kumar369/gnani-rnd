// react/src/state/GnaniStateMachine.ts

import { EventEmitter } from 'events';
import errorLogger from '../utils/errorLogger';

/**
 * Canonical states for the Gnani voice assistant
 */
export type GnaniState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Triggers that cause state transitions
 */
export type StateTrigger =
    | 'wake-word-detected'
    | 'manual-start'
    | 'vad-end'
    | 'manual-stop'
    | 'llm-start'
    | 'tts-start'
    | 'tts-complete'
    | 'barge-in'
    | 'error'
    | 'reset'
    | 'text-input';

/**
 * State transition definition
 */
interface StateTransition {
    from: GnaniState;
    to: GnaniState;
    trigger: StateTrigger;
    guard?: () => boolean;
    action?: () => void | Promise<void>;
}

/**
 * State change event payload
 */
export interface StateChangeEvent {
    from: GnaniState;
    to: GnaniState;
    trigger: StateTrigger;
    timestamp: number;
}

/**
 * GnaniStateMachine - Deterministic state machine for voice assistant
 * 
 * States:
 * - idle: Waiting for wake-word or manual start
 * - listening: Microphone active, streaming audio to backend
 * - thinking: Audio stream stopped, backend processing
 * - speaking: TTS audio playing
 * 
 * This is the single source of truth for the application state.
 */
class GnaniStateMachine extends EventEmitter {
    private currentState: GnaniState = 'idle';
    private previousState: GnaniState | null = null;
    private transitions: StateTransition[] = [];
    private stateHistory: StateChangeEvent[] = [];
    private maxHistorySize = 50;

    constructor() {
        super();
        this.initializeTransitions();
        errorLogger.info('GnaniStateMachine initialized', { context: 'StateMachine' });
    }

    /**
     * Initialize all valid state transitions
     */
    private initializeTransitions(): void {
        this.transitions = [
            // idle → listening (wake-word or manual start)
            {
                from: 'idle',
                to: 'listening',
                trigger: 'wake-word-detected',
                action: () => errorLogger.info('Wake-word detected, starting listening', { context: 'StateMachine' }),
            },
            {
                from: 'idle',
                to: 'listening',
                trigger: 'manual-start',
                action: () => errorLogger.info('Manual start, beginning listening', { context: 'StateMachine' }),
            },

            // listening → thinking (VAD end or manual stop)
            {
                from: 'listening',
                to: 'thinking',
                trigger: 'vad-end',
                action: () => errorLogger.info('VAD detected end of speech, transitioning to thinking', { context: 'StateMachine' }),
            },
            {
                from: 'listening',
                to: 'thinking',
                trigger: 'manual-stop',
                action: () => errorLogger.info('Manual stop, transitioning to thinking', { context: 'StateMachine' }),
            },

            // thinking → speaking (TTS starts)
            {
                from: 'thinking',
                to: 'speaking',
                trigger: 'tts-start',
                action: () => errorLogger.info('TTS started, transitioning to speaking', { context: 'StateMachine' }),
            },

            // speaking → idle (TTS completes)
            {
                from: 'speaking',
                to: 'idle',
                trigger: 'tts-complete',
                action: () => errorLogger.info('TTS completed, returning to idle', { context: 'StateMachine' }),
            },

            // Barge-in transitions (interruption)
            {
                from: 'speaking',
                to: 'listening',
                trigger: 'barge-in',
                action: () => errorLogger.info('Barge-in during speaking, transitioning to listening', { context: 'StateMachine' }),
            },
            {
                from: 'thinking',
                to: 'listening',
                trigger: 'barge-in',
                action: () => errorLogger.info('Barge-in during thinking, transitioning to listening', { context: 'StateMachine' }),
            },

            // Error handling - can go to idle from any state
            {
                from: 'listening',
                to: 'idle',
                trigger: 'error',
                action: () => errorLogger.error('Error during listening, returning to idle', null, { context: 'StateMachine' }),
            },
            {
                from: 'thinking',
                to: 'idle',
                trigger: 'error',
                action: () => errorLogger.error('Error during thinking, returning to idle', null, { context: 'StateMachine' }),
            },
            {
                from: 'speaking',
                to: 'idle',
                trigger: 'error',
                action: () => errorLogger.error('Error during speaking, returning to idle', null, { context: 'StateMachine' }),
            },

            // Reset - can go to idle from any state
            {
                from: 'listening',
                to: 'idle',
                trigger: 'reset',
            },
            {
                from: 'thinking',
                to: 'idle',
                trigger: 'reset',
            },
            {
                from: 'speaking',
                to: 'idle',
                trigger: 'reset',
            },

            // Text Input Transitions
            {
                from: 'idle',
                to: 'thinking',
                trigger: 'text-input',
                action: () => errorLogger.info('Text input received, transitioning to thinking', { context: 'StateMachine' }),
            },
            {
                from: 'listening',
                to: 'thinking',
                trigger: 'text-input',
                action: () => errorLogger.info('Text input received during listening, transitioning to thinking', { context: 'StateMachine' }),
            },
            {
                from: 'speaking',
                to: 'thinking',
                trigger: 'text-input',
                action: () => errorLogger.info('Text input received during speaking, transitioning to thinking', { context: 'StateMachine' }),
            },
            {
                from: 'thinking',
                to: 'thinking',
                trigger: 'text-input',
                action: () => errorLogger.info('Text input received during thinking, re-processing', { context: 'StateMachine' }),
            },
        ];
    }

    /**
     * Attempt a state transition
     * @param trigger - The trigger causing the transition
     * @returns true if transition was successful, false otherwise
     */
    public transition(trigger: StateTrigger): boolean {
        const validTransition = this.transitions.find(
            (t) =>
                t.from === this.currentState &&
                t.trigger === trigger &&
                (!t.guard || t.guard())
        );

        if (!validTransition) {
            errorLogger.warn(
                `Invalid transition: ${this.currentState} -> ${trigger}`,
                { context: 'StateMachine' }
            );
            return false;
        }

        const previousState = this.currentState;
        this.previousState = previousState;
        this.currentState = validTransition.to;

        // Record state change
        const stateChange: StateChangeEvent = {
            from: previousState,
            to: this.currentState,
            trigger,
            timestamp: Date.now(),
        };

        this.stateHistory.push(stateChange);
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }

        // Execute transition action
        if (validTransition.action) {
            try {
                const result = validTransition.action();
                if (result instanceof Promise) {
                    result.catch((error) =>
                        errorLogger.error('Error in transition action', error, { context: 'StateMachine' })
                    );
                }
            } catch (error) {
                errorLogger.error('Error executing transition action', error, { context: 'StateMachine' });
            }
        }

        // Emit state change event
        this.emit('stateChange', stateChange);
        errorLogger.debug(
            `State transition: ${previousState} -> ${this.currentState} (trigger: ${trigger})`,
            { context: 'StateMachine' }
        );

        return true;
    }

    /**
     * Get the current state
     */
    public getState(): GnaniState {
        return this.currentState;
    }

    /**
     * Get the previous state
     */
    public getPreviousState(): GnaniState | null {
        return this.previousState;
    }

    /**
     * Get state history
     */
    public getHistory(): StateChangeEvent[] {
        return [...this.stateHistory];
    }

    /**
     * Check if a transition is valid from current state
     */
    public canTransition(trigger: StateTrigger): boolean {
        return this.transitions.some(
            (t) =>
                t.from === this.currentState &&
                t.trigger === trigger &&
                (!t.guard || t.guard())
        );
    }

    /**
     * Force set state (use with caution, mainly for testing)
     */
    public setState(state: GnaniState): void {
        errorLogger.warn(`Force setting state to: ${state}`, { context: 'StateMachine' });
        this.previousState = this.currentState;
        this.currentState = state;
        this.emit('stateChange', {
            from: this.previousState,
            to: this.currentState,
            trigger: 'reset' as StateTrigger,
            timestamp: Date.now(),
        });
    }

    /**
     * Reset to idle state
     */
    public reset(): void {
        if (this.currentState !== 'idle') {
            this.transition('reset');
        }
    }

    /**
     * Get diagnostic information
     */
    public getDiagnostics(): {
        currentState: GnaniState;
        previousState: GnaniState | null;
        historySize: number;
        recentTransitions: StateChangeEvent[];
    } {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            historySize: this.stateHistory.length,
            recentTransitions: this.stateHistory.slice(-5),
        };
    }
}

export default GnaniStateMachine;
