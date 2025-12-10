import { create } from 'zustand';
import type { ParsedError } from '../utils/errorParser';

interface ErrorState {
    errors: Array<{
        id: string;
        error: ParsedError | string; // Support both ParsedError objects and plain strings
        type: 'error' | 'warning' | 'info';
        retryFn?: () => void;
    }>;

    addError: (error: ParsedError | string, retryFn?: () => void) => void;
    removeError: (id: string) => void;
    clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
    errors: [],

    addError: (error, retryFn) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            errors: [...state.errors, { id, error, type: 'error', retryFn }],
        }));
    },

    removeError: (id) => {
        set((state) => ({
            errors: state.errors.filter((e) => e.id !== id),
        }));
    },

    clearErrors: () => set({ errors: [] }),
}));
