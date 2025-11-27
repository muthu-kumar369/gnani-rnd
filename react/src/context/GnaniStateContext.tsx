import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import GnaniStateMachine from '../state/GnaniStateMachine';
import type { GnaniState, StateChangeEvent, StateTrigger } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

interface GnaniStateContextValue {
    state: GnaniState;
    previousState: GnaniState | null;
    transition: (trigger: StateTrigger) => void;
    isIdle: boolean;
    isListening: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
}

const GnaniStateContext = createContext<GnaniStateContextValue | undefined>(undefined);

interface GnaniStateProviderProps {
    children: ReactNode;
}

export const GnaniStateProvider: React.FC<GnaniStateProviderProps> = ({ children }) => {
    const [currentState, setCurrentState] = useState<GnaniState>('idle');
    const [previousState, setPreviousState] = useState<GnaniState | null>(null);
    const stateMachineRef = useRef<GnaniStateMachine | null>(null);

    // Initialize state machine on mount
    useEffect(() => {
        // Create state machine if it doesn't exist
        if (!stateMachineRef.current) {
            console.log('[GnaniStateContext] Initializing state machine');
            stateMachineRef.current = new GnaniStateMachine();
            errorLogger.info('GnaniStateContext initialized', { context: 'GnaniStateContext' });
        } else {
            console.log('[GnaniStateContext] State machine already exists, re-registering listener');
        }

        // Always subscribe to state changes (handles React Strict Mode double-mounting)
        const handleStateChange = (event: StateChangeEvent) => {
            console.log('[GnaniStateContext] State change event received:', event);
            setCurrentState(event.to);
            setPreviousState(event.from);
            errorLogger.debug(`State changed: ${event.from} -> ${event.to}`, { context: 'GnaniStateContext' });
        };

        stateMachineRef.current.on('stateChange', handleStateChange);
        console.log('[GnaniStateContext] Event listener registered');

        // Cleanup - remove this specific listener
        return () => {
            console.log('[GnaniStateContext] Cleaning up event listener');
            if (stateMachineRef.current) {
                stateMachineRef.current.removeListener('stateChange', handleStateChange);
            }
        };
    }, []);

    /**
     * Trigger a state transition
     */
    const transition = (trigger: StateTrigger) => {
        if (stateMachineRef.current) {
            stateMachineRef.current.transition(trigger);
        } else {
            errorLogger.warn('Attempted to transition before state machine initialized', { context: 'GnaniStateContext' });
        }
    };

    // Computed boolean helpers
    const isIdle = currentState === 'idle';
    const isListening = currentState === 'listening';
    const isThinking = currentState === 'thinking';
    const isSpeaking = currentState === 'speaking';

    const value: GnaniStateContextValue = {
        state: currentState,
        previousState,
        transition,
        isIdle,
        isListening,
        isThinking,
        isSpeaking,
    };

    return (
        <GnaniStateContext.Provider value={value}>
            {children}
        </GnaniStateContext.Provider>
    );
};

/**
 * Hook to access Gnani state from any component
 */
export const useGnaniStateContext = (): GnaniStateContextValue => {
    const context = useContext(GnaniStateContext);
    if (context === undefined) {
        throw new Error('useGnaniStateContext must be used within a GnaniStateProvider');
    }
    return context;
};

export default GnaniStateContext;
