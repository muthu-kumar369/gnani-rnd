// react/src/hooks/useGnaniState.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import GnaniStateMachine from '../state/GnaniStateMachine';
import type { GnaniState, StateTrigger, StateChangeEvent } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

/**
 * React hook for managing Gnani state machine
 * 
 * This is the single source of truth for application state.
 * All components should use this hook instead of managing state independently.
 */
export function useGnaniState() {
    const stateMachineRef = useRef<GnaniStateMachine | null>(null);
    const [currentState, setCurrentState] = useState<GnaniState>('idle');
    const [previousState, setPreviousState] = useState<GnaniState | null>(null);

    // Initialize state machine on mount
    useEffect(() => {
        if (!stateMachineRef.current) {
            stateMachineRef.current = new GnaniStateMachine();

            // Subscribe to state changes
            const handleStateChange = (event: StateChangeEvent) => {
                setCurrentState(event.to);
                setPreviousState(event.from);
                errorLogger.debug(`State changed: ${event.from} -> ${event.to}`, { context: 'useGnaniState' });
            };

            stateMachineRef.current.on('stateChange', handleStateChange);

            errorLogger.info('useGnaniState initialized', { context: 'useGnaniState' });

            // Cleanup
            return () => {
                if (stateMachineRef.current) {
                    stateMachineRef.current.removeListener('stateChange', handleStateChange);
                }
            };
        }
    }, []);

    /**
     * Trigger a state transition
     */
    const transition = useCallback((trigger: StateTrigger): boolean => {
        if (!stateMachineRef.current) {
            errorLogger.error('State machine not initialized', null, { context: 'useGnaniState' });
            return false;
        }
        return stateMachineRef.current.transition(trigger);
    }, []);

    /**
     * Check if a transition is valid
     */
    const canTransition = useCallback((trigger: StateTrigger): boolean => {
        if (!stateMachineRef.current) return false;
        return stateMachineRef.current.canTransition(trigger);
    }, []);

    /**
     * Reset to idle state
     */
    const reset = useCallback(() => {
        if (stateMachineRef.current) {
            stateMachineRef.current.reset();
        }
    }, []);

    /**
     * Get state history
     */
    const getHistory = useCallback((): StateChangeEvent[] => {
        if (!stateMachineRef.current) return [];
        return stateMachineRef.current.getHistory();
    }, []);

    /**
     * Get diagnostics
     */
    const getDiagnostics = useCallback(() => {
        if (!stateMachineRef.current) return null;
        return stateMachineRef.current.getDiagnostics();
    }, []);

    // Convenience boolean flags for common state checks
    const isIdle = currentState === 'idle';
    const isListening = currentState === 'listening';
    const isThinking = currentState === 'thinking';
    const isSpeaking = currentState === 'speaking';

    return {
        // Current state
        state: currentState,
        previousState,

        // State checks
        isIdle,
        isListening,
        isThinking,
        isSpeaking,

        // Actions
        transition,
        canTransition,
        reset,

        // Diagnostics
        getHistory,
        getDiagnostics,
    };
}

export default useGnaniState;
