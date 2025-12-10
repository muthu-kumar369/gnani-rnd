import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WakeWord {
    id: string;
    word: string;
    enabled: boolean;
    sensitivity: number; // 0-1
}

interface WakeWordState {
    wakeWords: WakeWord[];
    isListening: boolean;
    detectedWord: string | null;
    addWakeWord: (word: string) => void;
    removeWakeWord: (id: string) => void;
    toggleWakeWord: (id: string) => void;
    updateSensitivity: (id: string, sensitivity: number) => void;
    setListening: (isListening: boolean) => void;
    setDetectedWord: (word: string | null) => void;
}

export const useWakeWordStore = create<WakeWordState>()(
    persist(
        (set) => ({
            wakeWords: [
                { id: 'gnani', word: 'Gnani', enabled: true, sensitivity: 0.7 },
                { id: 'hey-gnani', word: 'Hey Gnani', enabled: true, sensitivity: 0.7 },
            ],
            isListening: false,
            detectedWord: null,

            addWakeWord: (word: string) => {
                const newWakeWord: WakeWord = {
                    id: word.toLowerCase().replace(/\s+/g, '-'),
                    word,
                    enabled: true,
                    sensitivity: 0.7,
                };
                set((state) => ({
                    wakeWords: [...state.wakeWords, newWakeWord],
                }));
            },

            removeWakeWord: (id: string) => {
                set((state) => ({
                    wakeWords: state.wakeWords.filter((w) => w.id !== id),
                }));
            },

            toggleWakeWord: (id: string) => {
                set((state) => ({
                    wakeWords: state.wakeWords.map((w) =>
                        w.id === id ? { ...w, enabled: !w.enabled } : w
                    ),
                }));
            },

            updateSensitivity: (id: string, sensitivity: number) => {
                set((state) => ({
                    wakeWords: state.wakeWords.map((w) =>
                        w.id === id ? { ...w, sensitivity } : w
                    ),
                }));
            },

            setListening: (isListening: boolean) => set({ isListening }),

            setDetectedWord: (word: string | null) => set({ detectedWord: word }),
        }),
        {
            name: 'gnani-wake-words',
        }
    )
);
