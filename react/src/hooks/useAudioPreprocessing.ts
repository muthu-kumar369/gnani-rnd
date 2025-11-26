// react/src/hooks/useAudioPreprocessing.ts

import { useEffect, useState, useCallback } from 'react';
import errorLogger from '../utils/errorLogger';

/**
 * Audio preprocessing configuration
 */
export interface AudioPreprocessingConfig {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate: number;
    channelCount: number;
}

/**
 * Supported preprocessing features by platform
 */
export interface PreprocessingSupport {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

/**
 * Hook for managing audio preprocessing
 * 
 * Applies echo cancellation, noise suppression, and automatic gain control
 * to improve audio quality for ASR and wake-word detection.
 */
export function useAudioPreprocessing(initialConfig?: Partial<AudioPreprocessingConfig>) {
    const [config, setConfig] = useState<AudioPreprocessingConfig>({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1,
        ...initialConfig,
    });

    const [support, setSupport] = useState<PreprocessingSupport>({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
    });

    const [isSupported, setIsSupported] = useState<boolean>(false);

    /**
     * Detect platform support for preprocessing features
     */
    useEffect(() => {
        const detectSupport = async () => {
            try {
                // Check if getUserMedia is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    errorLogger.warn('getUserMedia not supported', { context: 'useAudioPreprocessing' });
                    setIsSupported(false);
                    return;
                }

                // Try to get supported constraints
                const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

                const detectedSupport: PreprocessingSupport = {
                    echoCancellation: supportedConstraints.echoCancellation || false,
                    noiseSuppression: supportedConstraints.noiseSuppression || false,
                    autoGainControl: supportedConstraints.autoGainControl || false,
                };

                setSupport(detectedSupport);
                setIsSupported(
                    detectedSupport.echoCancellation ||
                    detectedSupport.noiseSuppression ||
                    detectedSupport.autoGainControl
                );

                errorLogger.info('Audio preprocessing support detected', {
                    context: 'useAudioPreprocessing',
                    support: detectedSupport,
                });
            } catch (error) {
                errorLogger.error('Error detecting audio preprocessing support', error, {
                    context: 'useAudioPreprocessing',
                });
                setIsSupported(false);
            }
        };

        detectSupport();
    }, []);

    /**
     * Get audio constraints for getUserMedia
     */
    const getAudioConstraints = useCallback((): MediaTrackConstraints => {
        const constraints: MediaTrackConstraints = {
            sampleRate: config.sampleRate,
            channelCount: config.channelCount,
        };

        // Only add constraints that are supported
        if (support.echoCancellation && config.echoCancellation) {
            constraints.echoCancellation = true;
        }

        if (support.noiseSuppression && config.noiseSuppression) {
            constraints.noiseSuppression = true;
        }

        if (support.autoGainControl && config.autoGainControl) {
            constraints.autoGainControl = true;
        }

        errorLogger.debug('Generated audio constraints', {
            context: 'useAudioPreprocessing',
            constraints,
        });

        return constraints;
    }, [config, support]);

    /**
     * Update preprocessing configuration
     */
    const updateConfig = useCallback((updates: Partial<AudioPreprocessingConfig>) => {
        setConfig((prev) => ({
            ...prev,
            ...updates,
        }));
        errorLogger.info('Audio preprocessing config updated', {
            context: 'useAudioPreprocessing',
            updates,
        });
    }, []);

    /**
     * Toggle individual preprocessing features
     */
    const toggleEchoCancellation = useCallback(() => {
        setConfig((prev) => ({
            ...prev,
            echoCancellation: !prev.echoCancellation,
        }));
    }, []);

    const toggleNoiseSuppression = useCallback(() => {
        setConfig((prev) => ({
            ...prev,
            noiseSuppression: !prev.noiseSuppression,
        }));
    }, []);

    const toggleAutoGainControl = useCallback(() => {
        setConfig((prev) => ({
            ...prev,
            autoGainControl: !prev.autoGainControl,
        }));
    }, []);

    /**
     * Get active preprocessing features
     */
    const getActiveFeatures = useCallback((): string[] => {
        const active: string[] = [];

        if (config.echoCancellation && support.echoCancellation) {
            active.push('Echo Cancellation');
        }
        if (config.noiseSuppression && support.noiseSuppression) {
            active.push('Noise Suppression');
        }
        if (config.autoGainControl && support.autoGainControl) {
            active.push('Auto Gain Control');
        }

        return active;
    }, [config, support]);

    return {
        // Configuration
        config,
        updateConfig,

        // Support detection
        support,
        isSupported,

        // Constraints
        getAudioConstraints,

        // Toggle functions
        toggleEchoCancellation,
        toggleNoiseSuppression,
        toggleAutoGainControl,

        // Utilities
        getActiveFeatures,
    };
}

export default useAudioPreprocessing;
