// gnani-rnd/react/src/state/GnaniStateMachine.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import GnaniStateMachine from './GnaniStateMachine';

describe('GnaniStateMachine', () => {
    let stateMachine: GnaniStateMachine;

    beforeEach(() => {
        stateMachine = new GnaniStateMachine();
    });

    it('should initialize in idle state', () => {
        expect(stateMachine.getState()).toBe('idle');
    });

    it('should transition from idle to listening on wake-word', () => {
        const result = stateMachine.transition('wake-word-detected');
        expect(result).toBe(true);
        expect(stateMachine.getState()).toBe('listening');
    });

    it('should transition from listening to thinking on vad-end', () => {
        stateMachine.transition('wake-word-detected');
        stateMachine.transition('vad-end');
        expect(stateMachine.getState()).toBe('thinking');
    });

    it('should transition from thinking to speaking on tts-start', () => {
        stateMachine.transition('wake-word-detected');
        stateMachine.transition('vad-end');
        stateMachine.transition('tts-start');
        expect(stateMachine.getState()).toBe('speaking');
    });

    it('should transition from speaking to idle on tts-complete', () => {
        stateMachine.transition('wake-word-detected');
        stateMachine.transition('vad-end');
        stateMachine.transition('tts-start');
        stateMachine.transition('tts-complete');
        expect(stateMachine.getState()).toBe('idle');
    });

    it('should reject invalid transitions', () => {
        const result = stateMachine.transition('tts-start'); // Can't start TTS from idle
        expect(result).toBe(false);
        expect(stateMachine.getState()).toBe('idle');
    });

    it('should handle barge-in from speaking to listening', () => {
        stateMachine.transition('wake-word-detected');
        stateMachine.transition('vad-end');
        stateMachine.transition('tts-start');
        stateMachine.transition('barge-in');
        expect(stateMachine.getState()).toBe('listening');
    });

    it('should emit stateChange events', async () => {
        return new Promise<void>((resolve) => {
            stateMachine.on('stateChange', (event: any) => {
                expect(event.from).toBe('idle');
                expect(event.to).toBe('listening');
                resolve();
            });
            stateMachine.transition('wake-word-detected');
        });
    });

    it('should track previous state', () => {
        stateMachine.transition('wake-word-detected');
        expect(stateMachine.getPreviousState()).toBe('idle');
    });
});
