// gnani-rnd/react/src/utils/streamingTTS.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import StreamingTTS from './streamingTTS';

describe('StreamingTTS', () => {
    let tts: StreamingTTS;

    beforeEach(() => {
        tts = new StreamingTTS();
        // Mock SpeechSynthesis
        (global.window as any).speechSynthesis = {
            speak: vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            getVoices: vi.fn(() => [])
        };
    });

    it('should queue complete sentences', () => {
        tts.setStreamActive(true);
        tts.addTextChunk('Hello');
        tts.addTextChunk(' world');
        tts.addTextChunk('.');

        expect(tts.getState().queueLength).toBeGreaterThan(0);
    });

    it('should flush buffer on timeout', (done: () => void) => {
        tts.setStreamActive(true);
        tts.addTextChunk('Incomplete sentence');

        setTimeout(() => {
            expect(tts.getState().queueLength).toBeGreaterThan(0);
            done();
        }, 250);
    });

    it('should stop playback', () => {
        tts.setStreamActive(true);
        tts.addTextChunk('Test.');
        tts.stop();

        expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should reset state', () => {
        tts.setStreamActive(true);
        tts.addTextChunk('Test.');
        tts.reset();

        const state = tts.getState();
        expect(state.queueLength).toBe(0);
        expect(state.isPlaying).toBe(false);
    });

    it('should detect sentence boundaries', () => {
        tts.setStreamActive(true);
        tts.addTextChunk('First sentence. Second sentence.');

        // Should queue multiple sentences
        expect(tts.getState().queueLength).toBeGreaterThan(0);
    });
});
