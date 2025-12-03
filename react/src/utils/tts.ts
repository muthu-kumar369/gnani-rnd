// react/src/utils/tts.ts

import errorLogger from './errorLogger';

/**
 * Uses the Web Speech API to speak the given text.
 * @param text The text to be spoken.
 */
export const speakText = (text: string) => {
  if (!window.speechSynthesis) {
    errorLogger.error('Web Speech API not supported in this browser.', null, { context: 'TTS' });
    return;
  }

  // Cancel any ongoing speech to prevent overlap
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);

  // Optional: Configure voice, pitch, rate, etc.
  // const voices = window.speechSynthesis.getVoices();
  // utterance.voice = voices[0]; // Example: Use the first available voice
  // utterance.pitch = 1;
  // utterance.rate = 1;

  utterance.onstart = () => {
    errorLogger.info('TTS playback started.', { context: 'TTS' });
  };

  utterance.onend = () => {
    errorLogger.info('TTS playback finished.', { context: 'TTS' });
  };

  utterance.onerror = (event) => {
    errorLogger.error('An error occurred during TTS playback:', event.error, { context: 'TTS' });
  };

  window.speechSynthesis.speak(utterance);
};
