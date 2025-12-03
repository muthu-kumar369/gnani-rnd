// gnani-rnd/react/src/store/useGnaniStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGnaniStore } from './useGnaniStore';

describe('useGnaniStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useGnaniStore());
        act(() => {
            result.current._init();
        });
    });

    it('should initialize with idle state', () => {
        const { result } = renderHook(() => useGnaniStore());
        expect(result.current.state).toBe('idle');
        expect(result.current.isIdle).toBe(true);
    });

    it('should update state on transition', () => {
        const { result } = renderHook(() => useGnaniStore());
        act(() => {
            result.current.transition('wake-word-detected');
        });
        expect(result.current.state).toBe('listening');
        expect(result.current.isListening).toBe(true);
    });

    it('should track previous state', () => {
        const { result } = renderHook(() => useGnaniStore());
        act(() => {
            result.current.transition('wake-word-detected');
        });
        expect(result.current.previousState).toBe('idle');
    });

    it('should have correct boolean flags', () => {
        const { result } = renderHook(() => useGnaniStore());

        // Idle
        expect(result.current.isIdle).toBe(true);
        expect(result.current.isListening).toBe(false);

        // Listening
        act(() => {
            result.current.transition('wake-word-detected');
        });
        expect(result.current.isIdle).toBe(false);
        expect(result.current.isListening).toBe(true);

        // Thinking
        act(() => {
            result.current.transition('vad-end');
        });
        expect(result.current.isThinking).toBe(true);

        // Speaking
        act(() => {
            result.current.transition('tts-start');
        });
        expect(result.current.isSpeaking).toBe(true);
    });
});
