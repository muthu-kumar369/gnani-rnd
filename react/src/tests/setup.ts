// gnani-rnd/react/src/tests/setup.ts

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Electron APIs
global.window = global.window || {};
(global.window as any).gnani = {
    wake: {
        startWakeWord: vi.fn(),
        stopWakeWord: vi.fn()
    },
    stream: {
        on: vi.fn(),
        sendAudioFrame: vi.fn(),
        startStream: vi.fn(),
        stopStream: vi.fn(),
        sendText: vi.fn()
    },
    send: vi.fn()
};

(global.window as any).electron = {
    ipcRenderer: {
        on: vi.fn(),
        removeAllListeners: vi.fn()
    }
};
