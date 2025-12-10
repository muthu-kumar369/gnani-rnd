import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SearchHistory } from '../searchHistory';

describe('SearchHistory', () => {
    let history: SearchHistory;

    beforeEach(() => {
        // Mock localStorage
        const store: Record<string, string> = {};
        const localStorageMock = {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString();
            }),
            clear: vi.fn(() => {
                for (const key in store) delete store[key];
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            key: vi.fn(),
            length: 0,
        };
        global.localStorage = localStorageMock as any;

        history = new SearchHistory();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    })

    it('should add search query', () => {
        history.add('test query');
        expect(history.getHistory()).toContain('test query');
    });

    it('should limit history size', () => {
        for (let i = 0; i < 15; i++) {
            history.add(`query ${i}`);
        }

        // MAX_HISTORY is 10
        expect(history.getHistory().length).toBe(10);
    });

    it('should move existing query to front', () => {
        history.add('query 1');
        history.add('query 2');
        history.add('query 1'); // Should move to front

        expect(history.getHistory()[0]).toBe('query 1');
    });

    it('should persist to localStorage', () => {
        history.add('test');

        const newHistory = new SearchHistory();
        expect(newHistory.getHistory()).toContain('test');
    });
});
