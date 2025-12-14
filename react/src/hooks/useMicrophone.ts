// /react/src/hooks/useMicrophone.ts
import { useState, useRef, useEffect, useCallback } from "react";
import errorLogger from '../utils/errorLogger';

const useMicrophone = () => {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0); // Normalized 0-1
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStateRef = useRef<'idle' | 'starting' | 'active' | 'stopping'>('idle');

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    return audioContextRef.current;
  }, []);

  const startMic = useCallback(async () => {
    if (micStateRef.current !== 'idle') {
      errorLogger.warn(`Mic is already in state: ${micStateRef.current}. Skipping startMic.`, { context: 'useMicrophone' });
      return;
    }
    micStateRef.current = 'starting';
    setIsMicActive(true); // Optimistically set to true for UI feedback

    try {
      const audioContext = getAudioContext();

      // Ensure AudioContext is running
      if (audioContext.state === "suspended") {
        errorLogger.info('AudioContext is suspended, resuming...', { context: 'useMicrophone' });
        await audioContext.resume();
      }

      // Audio preprocessing constraints for better quality
      const audioConstraints: MediaTrackConstraints = {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,      // Enable echo cancellation
        noiseSuppression: true,       // Enable noise suppression
        autoGainControl: true,        // Enable automatic gain control
      };

      errorLogger.info('Requesting microphone with preprocessing', {
        context: 'useMicrophone',
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

      // CRITICAL CHECK: If stopMic was called while we were awaiting, abort immediately
      if (micStateRef.current !== 'starting') {
        errorLogger.warn('startMic aborted because state changed during initialization', { context: 'useMicrophone', currentState: micStateRef.current });
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      mediaStreamRef.current = stream;

      // Log actual applied settings
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      errorLogger.info('Microphone settings applied', {
        context: 'useMicrophone',
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl,
      });

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      await audioContext.audioWorklet.addModule('/audio-processor.js');

      // Double check state again after second await
      if (micStateRef.current !== 'starting') {
        errorLogger.warn('startMic aborted after audioWorklet loading', { context: 'useMicrophone' });
        source.disconnect();
        analyser.disconnect();
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      audioWorkletNodeRef.current = audioWorkletNode;

      source.connect(audioWorkletNode);

      audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioBuffer' && window.gnani?.stream?.sendAudioFrame) {
          const float32Data = event.data.audioBuffer;
          const int16Data = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            int16Data[i] = Math.min(1, Math.max(-1, float32Data[i])) * 0x7FFF;
          }
          window.gnani.stream.sendAudioFrame(int16Data.buffer);
        }
      };

      micStateRef.current = 'active';
      setIsMicActive(true);
      window.gnani?.send("mic:start");
      errorLogger.info("Microphone started and streaming audio via AudioWorklet.", { context: 'useMicrophone' });
    } catch (error) {
      errorLogger.error("Error starting microphone or AudioWorklet:", error, { context: 'useMicrophone' });
      micStateRef.current = 'idle';
      setIsMicActive(false);
    }
  }, [getAudioContext]);

  const stopMic = useCallback(() => {
    if (micStateRef.current !== 'active' && micStateRef.current !== 'starting') {
      errorLogger.warn(`Mic is not active or starting. Current state: ${micStateRef.current}. Skipping stopMic.`, { context: 'useMicrophone' });
      return;
    }
    micStateRef.current = 'stopping';

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current
        .suspend()
        .catch((e) => errorLogger.error("Error suspending AudioContext:", e, { context: 'useMicrophone' }));
    }

    micStateRef.current = 'idle';
    setIsMicActive(false);
    setAudioLevel(0);
    window.gnani?.send("mic:stop");
    errorLogger.info("Microphone stopped.", { context: 'useMicrophone' });
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;

    const updateLevel = () => {
      if (
        isMicActive &&
        analyser &&
        audioContext &&
        audioContext.state === "running"
      ) {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const average = array.reduce((acc, val) => acc + val, 0) / array.length;
        setAudioLevel(average / 255);
      }
      animationFrameId = requestAnimationFrame(updateLevel);
    };

    if (isMicActive) {
      animationFrameId = requestAnimationFrame(updateLevel);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMicActive]);

  // Cleanup effect to stop mic and close AudioContext when component unmounts
  useEffect(() => {
    return () => {
      errorLogger.info("Cleaning up useMicrophone hook.", { context: 'useMicrophone' });
      stopMic(); // Ensure mic is stopped
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => errorLogger.error("Error closing AudioContext on unmount:", e, { context: 'useMicrophone' }));
      }
    };
  }, [stopMic]);

  return { audioLevel, isMicActive, startMic, stopMic };
};

export default useMicrophone;
