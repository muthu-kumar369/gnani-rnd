// /react/src/hooks/useIPC.ts
import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    gnani?: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}

export type AppStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isFinal?: boolean;
}

export const useIPC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWakeWordReady, setIsWakeWordReady] = useState(false);
  const [isVADReady, setIsVADReady] = useState(false);
  
  // Ref to track if TTS is playing for a more robust state transition
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (!window.gnani) return;

    const unsubs: (() => void)[] = [];

    // System Status Listeners
    unsubs.push(window.gnani.on('wake:status', ({ state }) => setIsWakeWordReady(state === 'ready')));
    unsubs.push(window.gnani.on('vad:status', ({ state }) => setIsVADReady(state === 'ready')));

    // Main State Machine Logic
    unsubs.push(window.gnani.on('wake:triggered', () => {
      console.log('Wake triggered, setting status to listening');
      setStatus('listening');
    }));
    
    unsubs.push(window.gnani.on('audio:listening', (isListening) => {
      setStatus(prevStatus => {
        if (isListening) {
          return 'listening';
        }
        // Only transition from listening to thinking if mic turns off
        if (!isListening && prevStatus === 'listening') {
          return 'thinking';
        }
        return prevStatus;
      });
    }));
    
    unsubs.push(window.gnani.on('audio:ended', () => {
      setStatus(prevStatus => prevStatus === 'listening' ? 'thinking' : prevStatus);
    }));

    // AI Response (LLM) Listeners
    unsubs.push(window.gnani.on('stream:partial', (response) => {
      setStatus('speaking');
      setMessages(prev => {
          const existingMessage = prev.find(m => m.id === response.segment_id);
          if (existingMessage) {
              return prev.map(m => m.id === response.segment_id ? { ...m, text: response.text, isFinal: false } : m);
          }
          return [...prev, { id: response.segment_id, text: response.text, sender: 'ai', isFinal: false }];
      });
    }));

    unsubs.push(window.gnani.on('stream:final', (response) => {
      setMessages(prev => prev.map(m => m.id === response.segment_id ? { ...m, text: response.text, isFinal: true } : m));
    }));
    
    // TTS Listeners
    unsubs.push(window.gnani.on('tts:started', () => {
      isSpeakingRef.current = true;
      setStatus('speaking');
    }));
    
    unsubs.push(window.gnani.on('tts:ended', () => {
      isSpeakingRef.current = false;
      setStatus('idle');
    }));

    // Cleanup on unmount
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []); // Empty dependency array is crucial to prevent re-subscribing

  const sendUserMessage = (text: string) => {
    const newMessage: Message = { id: Date.now().toString(), text, sender: 'user', isFinal: true };
    setMessages(prev => [...prev, newMessage]);
    if (window.gnani) {
        window.gnani.send('user:message', text);
    }
    setStatus('thinking');
  };

  return { status, messages, isWakeWordReady, isVADReady, setStatus, setMessages, sendUserMessage };
};
