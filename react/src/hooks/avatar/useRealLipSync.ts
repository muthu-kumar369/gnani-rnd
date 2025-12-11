import { useEffect, useState, useRef } from 'react';
import { eventManager } from '../../utils/eventManager';

// Viseme types mapping to mouth shapes
export type Viseme = 'sil' | 'aa' | 'ee' | 'oh' | 'ou' | 'mm' | 'th' | 'ss' | 'ff' | 'kk';

// Simple mapping of phonemes/letters to visemes
const getVisemeForWord = (word: string): Viseme => {
    if (!word) return 'sil';

    const w = word.toLowerCase();

    // Check end sounds first
    if (w.endsWith('ing')) return 'ee';

    // Check specific sounds
    if (w.includes('th')) return 'th';
    if (w.includes('sh') || w.includes('ch')) return 'ss';
    if (w.includes('oo') || w.includes('u')) return 'ou';
    if (w.includes('ee') || w.includes('ea') || w.includes('i')) return 'ee';
    if (w.includes('oh') || w.includes('oa') || w.includes('ow')) return 'oh';
    if (w.includes('a')) return 'aa';
    if (w.includes('m') || w.includes('b') || w.includes('p')) return 'mm';
    if (w.includes('f') || w.includes('v')) return 'ff';

    return 'aa'; // Default open
};

export const useRealLipSync = (isSpeaking: boolean) => {
    const [currentViseme, setCurrentViseme] = useState<Viseme>('sil');
    const [mouthOpenness, setMouthOpenness] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isSpeaking) {
            setCurrentViseme('sil');
            setMouthOpenness(0);
            return;
        }

        const handleWord = (event: Event) => {
            const customEvent = event as CustomEvent;
            const word = customEvent.detail.word;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Determine viseme
            const viseme = getVisemeForWord(word);
            setCurrentViseme(viseme);
            setMouthOpenness(0.8); // Open mouth

            // Reset to silence after a short duration (approx word length)
            // This prevents mouth staying open if no next word comes immediately
            timeoutRef.current = setTimeout(() => {
                setCurrentViseme('sil');
                setMouthOpenness(0);
            }, 300); // Average word duration
        };

        const cleanup = eventManager.addEventListener('tts:word', handleWord as EventListener, undefined, 'useRealLipSync');

        return () => {
            cleanup();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isSpeaking]);

    return { currentViseme, mouthOpenness };
};
