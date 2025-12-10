import { useEffect, useRef, useCallback } from 'react';
import { useWakeWordStore } from '../store/useWakeWordStore';

export const useWakeWordDetection = () => {
    const { wakeWords, isListening, setListening, setDetectedWord } = useWakeWordStore();
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startListening = useCallback(async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Create audio context and analyser
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            setListening(true);

            // Start detection loop
            detectWakeWord();
        } catch (error) {
            console.error('Failed to start wake word detection:', error);
            setListening(false);
        }
    }, [setListening]);

    const stopListening = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setListening(false);
    }, [setListening]);

    const detectWakeWord = useCallback(() => {
        if (!analyserRef.current || !isListening) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Simple energy-based detection (in production, use proper wake word detection)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Check if energy exceeds threshold for any enabled wake word
        const enabledWords = wakeWords.filter((w) => w.enabled);
        for (const wakeWord of enabledWords) {
            if (rms > wakeWord.sensitivity) {
                setDetectedWord(wakeWord.word);
                // Trigger wake word event
                window.dispatchEvent(new CustomEvent('wakeword:detected', {
                    detail: { word: wakeWord.word }
                }));
                break;
            }
        }

        // Continue detection loop
        if (isListening) {
            requestAnimationFrame(detectWakeWord);
        }
    }, [wakeWords, isListening, setDetectedWord]);

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return {
        startListening,
        stopListening,
        isListening,
    };
};
