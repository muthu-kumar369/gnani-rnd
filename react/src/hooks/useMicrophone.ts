// /react/src/hooks/useMicrophone.ts
// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from 'react';

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
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null); // For AudioWorklet alternative
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    }
    return audioContextRef.current;
  }, []);

  const processAudio = useCallback((audioBuffer: Float32Array) => {
    if (window.gnani && window.gnani.send) {
      // Convert Float32Array to 16-bit PCM (Int16Array)
      const pcm16 = new Int16Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, audioBuffer[i])) * 0x7FFF; // Scale to +/-32767
      }
      window.gnani.send('mic:chunk', Buffer.from(pcm16.buffer));
    }
  }, []);

  const startMic = useCallback(async () => {
    if (isMicActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Smaller FFT for quicker level changes
      analyserRef.current = analyser;

      source.connect(analyser);

      if (audioContext.audioWorklet) {
        try {
          await audioContext.audioWorklet.addModule('audio-processor.js'); 
          const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
          audioWorkletNodeRef.current = audioWorkletNode;

          analyser.connect(audioWorkletNode);
          audioWorkletNode.connect(audioContext.destination);

          audioWorkletNode.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'audioBuffer') {
              processAudio(event.data.audioBuffer);
            }
          };
          console.log('Using AudioWorkletNode for microphone processing.');
        } catch (workletError) {
          console.warn('AudioWorklet failed, falling back to ScriptProcessorNode:', workletError);
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;

          scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
            processAudio(event.inputBuffer.getChannelData(0));
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            const average = array.reduce((acc, val) => acc + val, 0) / array.length;
            setAudioLevel(average / 255);
          };

          analyser.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
          console.log('Using ScriptProcessorNode for microphone processing.');
        }
      } else {
        console.warn('AudioWorklet not available, falling back to ScriptProcessorNode.');
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptProcessor;

        scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
          processAudio(event.inputBuffer.getChannelData(0));
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          const average = array.reduce((acc, val) => acc + val, 0) / array.length;
          setAudioLevel(average / 255);
        };

        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
      }

      setIsMicActive(true);
      window.gnani?.send('mic:start');
      console.log('Microphone started.');

    } catch (error) {
      console.error('Error starting microphone:', error);
      setIsMicActive(false);
    }
  }, [isMicActive, getAudioContext, processAudio]);

  const stopMic = useCallback(() => {
    if (!isMicActive) return;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
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
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.onmessage = null;
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend().catch(e => console.error('Error suspending AudioContext:', e));
    }

    setIsMicActive(false);
    setAudioLevel(0);
    window.gnani?.send('mic:stop');
    console.log('Microphone stopped.');
  }, [isMicActive]);

  useEffect(() => {
    let animationFrameId: number;
    const analyser = analyserRef.current;
    const audioContext = audioContextRef.current;

    const updateLevel = () => {
      if (isMicActive && analyser && audioContext && audioContext.state === 'running' && !audioWorkletNodeRef.current) {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const average = array.reduce((acc, val) => acc + val, 0) / array.length;
        setAudioLevel(average / 255);
      }
      animationFrameId = requestAnimationFrame(updateLevel);
    };

    if (isMicActive && !audioWorkletNodeRef.current) {
      animationFrameId = requestAnimationFrame(updateLevel);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isMicActive]);

  useEffect(() => {
    const audioWorkletProcessorCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            this.port.postMessage({ type: 'audioBuffer', audioBuffer: input[0] });
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;
    const blob = new Blob([audioWorkletProcessorCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, []);

  return { audioLevel, isMicActive, startMic, stopMic };
};

export default useMicrophone;
