// /react/src/hooks/useIPC.ts
// @ts-nocheck
import { useEffect, useCallback, useRef } from 'react';

// Define the shape of the gnani API on the window object for TypeScript
declare global {
  interface Window {
    gnani?: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      startMic: () => void;
      stopMic: () => void;
      wake: {
        startWakeWord: () => void;
        stopWakeWord: () => void;
        getWakeStatus: () => Promise<any>;
      };
      vad: {
        startVAD: () => void;
        stopVAD: () => void;
        getVADStatus: () => Promise<any>;
        setAggressiveness: (level: number) => void;
      };
      stream: {
        startStream: (options?: any) => void;
        stopStream: () => void;
        setEndpoint: (cfg: any) => void;
        getStatus: () => Promise<any>;
      };
    };
  }
}

const useIPC = () => {
  const listenersRef = useRef({});

  useEffect(() => {
    if (!window.gnani) {
      console.warn("window.gnani API not available. Running in a non-Electron environment or preload script not loaded.");
      return;
    }
  }, []);

  const send = useCallback((channel: string, data?: any) => {
    window.gnani?.send(channel, data);
  }, []);

  const on = useCallback((channel: string, callback: (...args: any[]) => void) => {
    return window.gnani?.on(channel, callback);
  }, []);

  const invoke = useCallback(async (channel: string, ...args: any[]) => {
    return window.gnani?.invoke(channel, ...args);
  }, []);

  const startMic = useCallback(() => window.gnani?.startMic(), []);
  const stopMic = useCallback(() => window.gnani?.stopMic(), []);
  const startWakeWord = useCallback(() => window.gnani?.wake?.startWakeWord(), []);
  const stopWakeWord = useCallback(() => window.gnani?.wake?.stopWakeWord(), []);
  const startVAD = useCallback(() => window.gnani?.vad?.startVAD(), []);
  const stopVAD = useCallback(() => window.gnani?.vad?.stopVAD(), []);
  const setVADAggressiveness = useCallback((level: number) => window.gnani?.vad?.setAggressiveness(level), []);
  const startStream = useCallback((options?: any) => window.gnani?.stream?.startStream(options), []);
  const stopStream = useCallback(() => window.gnani?.stream?.stopStream(), []);
  const setStreamEndpoint = useCallback((cfg: any) => window.gnani?.stream?.setEndpoint(cfg), []);

  return {
    send,
    invoke,
    on,
    startMic,
    stopMic,
    startWakeWord,
    stopWakeWord,
    startVAD,
    stopVAD,
    setVADAggressiveness,
    startStream,
    stopStream,
    setStreamEndpoint,
  };
};

export default useIPC;
