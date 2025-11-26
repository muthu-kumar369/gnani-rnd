// react/src/hooks/useSpokenText.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import errorLogger from '../utils/errorLogger';

/**
 * Word with metadata for highlighting
 */
export interface SpokenWord {
    text: string;
    index: number;
    isCurrent: boolean;
}

/**
 * Hook for managing spoken text display
 * 
 * Shows the text that Gnani is currently speaking in real-time,
 * with word-by-word highlighting synced to audio playback.
 */
export function useSpokenText() {
    const [fullText, setFullText] = useState<string>('');
    const [words, setWords] = useState<SpokenWord[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const startTime = useRef<number>(0);
    const wordsPerSecond = useRef<number>(3); // Average speaking rate
    const animationFrameId = useRef<number | null>(null);

    /**
     * Add text chunk from LLM stream
     */
    const addTextChunk = useCallback((chunk: string) => {
        setFullText((prev) => {
            const newText = prev + chunk;

            // Split into words
            const wordArray = newText.split(/\s+/).filter((w) => w.length > 0);
            const wordObjects: SpokenWord[] = wordArray.map((text, index) => ({
                text,
                index,
                isCurrent: false,
            }));

            setWords(wordObjects);

            errorLogger.debug(`Added text chunk, total words: ${wordObjects.length}`, {
                context: 'useSpokenText',
            });

            return newText;
        });
    }, []);

    /**
     * Clear all text
     */
    const clearText = useCallback(() => {
        setFullText('');
        setWords([]);
        setCurrentWordIndex(-1);
        setIsPlaying(false);
        startTime.current = 0;

        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }

        errorLogger.debug('Cleared spoken text', { context: 'useSpokenText' });
    }, []);

    /**
     * Start playback animation
     */
    const startPlayback = useCallback(() => {
        if (words.length === 0) {
            errorLogger.warn('No words to play', { context: 'useSpokenText' });
            return;
        }

        setIsPlaying(true);
        startTime.current = Date.now();
        setCurrentWordIndex(0);

        errorLogger.info('Started spoken text playback', {
            context: 'useSpokenText',
            wordCount: words.length,
        });
    }, [words.length]);

    /**
     * Stop playback animation
     */
    const stopPlayback = useCallback(() => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);

        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }

        errorLogger.info('Stopped spoken text playback', { context: 'useSpokenText' });
    }, []);

    /**
     * Set speaking rate (words per second)
     */
    const setSpeakingRate = useCallback((rate: number) => {
        wordsPerSecond.current = Math.max(1, Math.min(5, rate)); // Clamp between 1-5 wps
        errorLogger.debug(`Speaking rate set to ${wordsPerSecond.current} wps`, {
            context: 'useSpokenText',
        });
    }, []);

    /**
     * Animation loop for word highlighting
     */
    useEffect(() => {
        if (!isPlaying || words.length === 0) {
            return;
        }

        const animate = () => {
            const elapsed = (Date.now() - startTime.current) / 1000; // seconds
            const estimatedWordIndex = Math.floor(elapsed * wordsPerSecond.current);

            if (estimatedWordIndex < words.length) {
                setCurrentWordIndex(estimatedWordIndex);
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                // Playback complete
                setCurrentWordIndex(words.length - 1);
                setIsPlaying(false);
                errorLogger.debug('Spoken text playback complete', { context: 'useSpokenText' });
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isPlaying, words.length]);

    /**
     * Update word highlighting based on current index
     */
    useEffect(() => {
        setWords((prevWords) =>
            prevWords.map((word, index) => ({
                ...word,
                isCurrent: index === currentWordIndex,
            }))
        );
    }, [currentWordIndex]);

    /**
     * Get formatted text with current word highlighted
     */
    const getFormattedText = useCallback((): string => {
        if (words.length === 0) return '';

        return words
            .map((word, index) => {
                if (index === currentWordIndex) {
                    return `**${word.text}**`; // Markdown bold for current word
                }
                return word.text;
            })
            .join(' ');
    }, [words, currentWordIndex]);

    return {
        // State
        fullText,
        words,
        currentWordIndex,
        isPlaying,

        // Actions
        addTextChunk,
        clearText,
        startPlayback,
        stopPlayback,
        setSpeakingRate,

        // Utilities
        getFormattedText,
        wordCount: words.length,
    };
}

export default useSpokenText;
