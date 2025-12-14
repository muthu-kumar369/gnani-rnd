import React, { useEffect } from 'react';
import { eventManager } from '../../utils/eventManager';
import errorLogger from '../../utils/errorLogger';
import { useGnaniStore } from '../../store/useGnaniStore';
import type { GnaniState } from '../../store/useGnaniStore';
import type { BargeInConfig } from '../../hooks/useBargeIn';

interface BargeInHandle {
    canBargeIn: boolean;
    isEnabled: boolean;
    handleVADSpeech: (isSpeech: boolean) => void;
    handleManualBargeIn: () => void;
    updateConfig: (updates: Partial<BargeInConfig>) => void;
    setEnabled: (enabled: boolean) => void;
    getConfig: () => BargeInConfig;
}

interface AudioManagerProps {
    state: GnaniState;
    isIdle: boolean;
    isListening: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
    isMicActive: boolean;
    startMic: () => void;
    stopMic: () => void;
    isTtsEnded: boolean;
    bargeIn: BargeInHandle;
    handleBargeIn: () => void; // The callback passed to useBargeIn, or logic to trigger it? 
    // Wait, bargeIn.handleManualBargeIn calls a callback. 
    // We need to trigger handleBargeIn logic when tts:interrupted event fires.
}

export const AudioManager: React.FC<AudioManagerProps> = React.memo(({
    state,
    isIdle,
    isSpeaking,
    isThinking,
    isMicActive,
    startMic,
    stopMic,
    isTtsEnded,
    bargeIn,
    handleBargeIn
}) => {

    // Helper to abstract window access
    const getElectron = () => window.electron?.ipcRenderer;
    const getGnani = () => window.gnani;

    // Handle TTS Interruption Event
    useEffect(() => {
        const handleInterruption = () => {
            errorLogger.info('TTS Interrupted event received', { context: 'AudioManager' });
            handleBargeIn();
        };

        const cleanup = eventManager.addEventListener('tts:interrupted', handleInterruption as EventListener, undefined, 'AudioManager');
        return cleanup;
    }, [handleBargeIn]);

    // Connect VAD to Barge-in
    useEffect(() => {
        const handleVadSpeechFrame = (_event: any, data: { speech: boolean }) => {
            if (data.speech) {
                // Debug logging removed or reduced to avoid spam, or kept as in GnaniCore
            }
            bargeIn.handleVADSpeech(data.speech);
        };

        const ipcRenderer = getElectron();
        if (ipcRenderer) {
            // console.log('[AudioManager] Registering VAD speech frame listener');
            ipcRenderer.on('vad:speech-frame', handleVadSpeechFrame);
        }

        return () => {
            if (ipcRenderer) {
                // console.log('[AudioManager] Removing VAD speech frame listener');
                ipcRenderer.removeAllListeners('vad:speech-frame');
            }
        };
    }, [bargeIn, getElectron]);

    // Sync Speaking State & Config
    useEffect(() => {
        // Sync speaking state to VAD manager
        const vad = getGnani()?.vad;
        if (vad?.setSpeaking) {
            vad.setSpeaking(isSpeaking);
        }

        if (isSpeaking) {
            // CRITICAL: Stop mic while speaking to prevent self-hearing (barge-in loop)
            errorLogger.info('[AudioManager] Agent speaking, stopping microphone', { context: 'AudioManager' });
            stopMic();
            // Also increase VAD threshold just in case, though mic is stopped
            bargeIn.updateConfig({ vadThreshold: 50 });
        } else {
            // Auto-restart mic logic when not speaking (e.g. finished TTS)
            if (!isMicActive && !isThinking) {
                setTimeout(() => {
                    // Double check we are still not speaking and explicitly not mic active
                    if (!useGnaniStore.getState().isSpeaking && !isMicActive) {
                        // Ensure stream is started before mic
                        if (window.gnani?.stream?.startStream) {
                            window.gnani.stream.startStream();
                        }
                        startMic();
                    }
                }, 300); // Increased delay slightly to ensure audio echo dies down
            }
        }
    }, [isSpeaking, isMicActive, isThinking, startMic, stopMic, bargeIn]);

    // Idle State Mic Management (Wake Word)
    useEffect(() => {
        if (isIdle && !isMicActive) {
            errorLogger.info('Transitioning to idle, ensuring microphone is ready', { context: 'AudioManager' });
            setTimeout(() => {
                const wake = getGnani()?.wake;
                if (wake?.startWakeWord) {
                    wake.startWakeWord();
                }
                // Ensure stream is active for idle listening
                if (window.gnani?.stream?.startStream) {
                    window.gnani.stream.startStream();
                }
                startMic();
            }, 300);
        }
    }, [isIdle, isMicActive, startMic]);

    return null;
});

AudioManager.displayName = 'AudioManager';
