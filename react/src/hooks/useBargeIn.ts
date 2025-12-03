// react/src/hooks/useBargeIn.ts

import { useEffect, useRef, useCallback } from 'react';
import type { GnaniState } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

/**
 * Barge-in configuration
 */
export interface BargeInConfig {
    enabled: boolean;
    vadThreshold: number;        // Number of consecutive speech frames needed
    debounceMs: number;           // Debounce time to prevent spurious triggers
}

/**
 * Hook for managing barge-in (interruption) functionality
 * 
 * Allows user to interrupt the assistant while it's thinking or speaking
 * by either:
 * 1. VAD detecting user speech
 * 2. Manual mic button click
 */
export function useBargeIn(
    currentState: GnaniState,
    onBargeIn: () => void,
    initialConfig?: Partial<BargeInConfig>
) {
    const config = useRef<BargeInConfig>({
        enabled: true,
        vadThreshold: 3,      // 3 consecutive speech frames (~90ms at 30fps)
        debounceMs: 100,      // 100ms debounce
        ...initialConfig,
    });

    const speechFrameCount = useRef<number>(0);
    const lastBargeInTime = useRef<number>(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    /**
     * Check if barge-in is allowed in current state
     */
    const canBargeIn = useCallback((): boolean => {
        if (!config.current.enabled) {
            return false;
        }

        // Can only barge-in during thinking or speaking states
        return currentState === 'thinking' || currentState === 'speaking';
    }, [currentState]);

    /**
     * Trigger barge-in with debouncing
     */
    const triggerBargeIn = useCallback(() => {
        if (!canBargeIn()) {
            errorLogger.debug('Barge-in not allowed in current state', {
                context: 'useBargeIn',
                state: currentState,
            });
            return;
        }

        const now = Date.now();
        const timeSinceLastBargeIn = now - lastBargeInTime.current;

        // Check debounce
        if (timeSinceLastBargeIn < config.current.debounceMs) {
            errorLogger.debug('Barge-in debounced', {
                context: 'useBargeIn',
                timeSinceLastBargeIn,
            });
            return;
        }

        // Clear any pending debounce timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }

        // Trigger barge-in
        lastBargeInTime.current = now;
        errorLogger.info('Barge-in triggered', {
            context: 'useBargeIn',
            state: currentState,
        });

        onBargeIn();
    }, [canBargeIn, currentState, onBargeIn]);

    /**
     * Handle VAD speech detection for barge-in
     * Call this when VAD detects speech
     */
    const handleVADSpeech = useCallback((isSpeech: boolean) => {
        if (!canBargeIn()) {
            speechFrameCount.current = 0;
            return;
        }

        if (isSpeech) {
            speechFrameCount.current++;

            // Check if threshold is met
            if (speechFrameCount.current >= config.current.vadThreshold) {
                errorLogger.debug('VAD threshold met for barge-in', {
                    context: 'useBargeIn',
                    frameCount: speechFrameCount.current,
                });

                // Use debounce timer to prevent rapid triggers
                if (!debounceTimer.current) {
                    debounceTimer.current = setTimeout(() => {
                        triggerBargeIn();
                        speechFrameCount.current = 0;
                        debounceTimer.current = null;
                    }, config.current.debounceMs);
                }
            }
        } else {
            // Reset count on non-speech
            speechFrameCount.current = 0;
        }
    }, [canBargeIn, triggerBargeIn]);

    /**
     * Handle manual barge-in (mic button click)
     */
    const handleManualBargeIn = useCallback(() => {
        if (canBargeIn()) {
            errorLogger.info('Manual barge-in triggered', {
                context: 'useBargeIn',
                state: currentState,
            });
            triggerBargeIn();
        }
    }, [canBargeIn, currentState, triggerBargeIn]);

    /**
     * Update configuration
     */
    const updateConfig = useCallback((updates: Partial<BargeInConfig>) => {
        config.current = {
            ...config.current,
            ...updates,
        };
        errorLogger.info('Barge-in config updated', {
            context: 'useBargeIn',
            config: config.current,
        });
    }, []);

    /**
     * Enable/disable barge-in
     */
    const setEnabled = useCallback((enabled: boolean) => {
        config.current.enabled = enabled;
        errorLogger.info(`Barge-in ${enabled ? 'enabled' : 'disabled'}`, {
            context: 'useBargeIn',
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return {
        // State
        canBargeIn: canBargeIn(),
        isEnabled: config.current.enabled,

        // Actions
        handleVADSpeech,
        handleManualBargeIn,

        // Configuration
        updateConfig,
        setEnabled,
        getConfig: () => config.current,
    };
}

export default useBargeIn;
