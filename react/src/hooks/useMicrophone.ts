// /react/src/hooks/useMicrophone.ts
// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";

// Define the shape of the gnani API on the window object for TypeScript
declare global {
  interface Window {
    gnani?: {
      send: (channel: string, data?: any) => void;
    };
  }
}

const useMicrophone = () => {
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0); // Normalized 0-1
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({ sampleRate: 16000 });
    }
    return audioContextRef.current;
  }, []);
  
  const startMic = useCallback(async () => {
    if (isMicActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = getAudioContext();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);
      // We connect the analyser to the destination to keep the audio graph running.
      // AnalyserNode does not alter the audio, so this is safe.
      analyser.connect(audioContext.destination);

      // The renderer no longer processes or forwards audio, so no worklet or script processor is needed.
      // This eliminates the ScriptProcessorNode deprecation warning.

      setIsMicActive(true);
      window.gnani?.send("mic:start");
      console.log("Microphone started.");
    } catch (error) {
      console.error("Error starting microphone:", error);
      setIsMicActive(false);
    }
  }, [isMicActive, getAudioContext]);

  const stopMic = useCallback(() => {
    if (!isMicActive) return;

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

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current
        .suspend()
        .catch((e) => console.error("Error suspending AudioContext:", e));
    }

    setIsMicActive(false);
    setAudioLevel(0);
    window.gnani?.send("mic:stop");
    console.log("Microphone stopped.");
  }, [isMicActive]);

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

  return { audioLevel, isMicActive, startMic, stopMic };
};

export default useMicrophone;