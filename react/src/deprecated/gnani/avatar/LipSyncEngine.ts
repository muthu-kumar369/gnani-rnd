// react/src/components/gnani/avatar/LipSyncEngine.ts
import { eventManager } from '../../../utils/eventManager';
import { type Viseme } from './AvatarConfig';

export class LipSyncEngine {
    private listeners: ((viseme: Viseme) => void)[] = [];
    private timeoutId: NodeJS.Timeout | null = null;
    private cleanupFn: (() => void) | null = null;

    constructor() {
        // Bind to window event
        this.cleanupFn = eventManager.addEventListener('tts:word', this.handleWordEvent as EventListener, undefined, 'LipSyncEngine');
        console.log('[LipSyncEngine] Initialized');
    }

    public subscribe(callback: (viseme: Viseme) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify(viseme: Viseme) {
        this.listeners.forEach(l => l(viseme));
    }

    private handleWordEvent = (event: Event) => {
        const customEvent = event as CustomEvent<{ word: string }>;
        const word = customEvent.detail.word;
        // console.log('[LipSyncEngine] Word:', word);

        const viseme = this.getVisemeForWord(word);
        this.notify(viseme);

        // Reset to neutral after a short delay
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            this.notify('neutral');
        }, 150);
    };

    private getVisemeForWord(word: string): Viseme {
        if (!word) return 'neutral';
        const w = word.toLowerCase();

        if (w.includes('ee') || w.includes('ea') || w.includes('i')) return 'ee';
        if (w.includes('oo') || w.includes('u') || w.includes('o')) return 'oo';
        if (w.includes('m') || w.includes('b') || w.includes('p')) return 'm';
        if (w.includes('a')) return 'aa';

        return 'aa'; // Default open mouth
    }

    public cleanup() {
        if (this.cleanupFn) this.cleanupFn();
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }
}
