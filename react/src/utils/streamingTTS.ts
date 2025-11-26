// react/src/utils/streamingTTS.ts

import errorLogger from './errorLogger';

/**
 * StreamingTTS - Intelligent text-to-speech manager for streaming text chunks
 * 
 * Handles streaming text from backend by:
 * 1. Accumulating text chunks in a buffer
 * 2. Detecting sentence boundaries (. ! ?)
 * 3. Queueing complete sentences as utterances
 * 4. Playing utterances sequentially without gaps
 * 5. Flushing remaining text on stream end
 */
class StreamingTTS {
    private textBuffer: string = '';
    private utteranceQueue: SpeechSynthesisUtterance[] = [];
    private isPlaying: boolean = false;
    private isStopped: boolean = false;

    // Configuration
    private readonly sentenceBoundaryRegex = /([.!?]+)(\s+|$)/g;
    private readonly minChunkLength = 10; // Minimum characters before attempting to detect sentence

    constructor() {
        errorLogger.info('StreamingTTS initialized', { context: 'StreamingTTS' });
    }

    /**
     * Add a text chunk from the streaming backend
     * Automatically detects sentence boundaries and queues complete sentences
     */
    public addTextChunk(text: string): void {
        if (this.isStopped) {
            errorLogger.warn('StreamingTTS is stopped, ignoring text chunk', { context: 'StreamingTTS' });
            return;
        }

        // Add to buffer
        this.textBuffer += text;
        errorLogger.debug(`Added text chunk: "${text}". Buffer now: "${this.textBuffer}"`, { context: 'StreamingTTS' });

        // Try to extract complete sentences
        this.processBuffer();
    }

    /**
     * Process the text buffer to extract and queue complete sentences
     */
    private processBuffer(): void {
        // Only process if buffer has minimum length
        if (this.textBuffer.length < this.minChunkLength) {
            return;
        }

        const result = this.detectSentenceBoundary(this.textBuffer);

        // Queue each complete sentence
        result.complete.forEach(sentence => {
            if (sentence.trim().length > 0) {
                this.queueUtterance(sentence.trim());
            }
        });

        // Keep the partial sentence in buffer
        this.textBuffer = result.partial;
    }

    /**
     * Detect sentence boundaries in text
     * Returns complete sentences and remaining partial text
     */
    private detectSentenceBoundary(text: string): { complete: string[], partial: string } {
        const complete: string[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // Reset regex state
        this.sentenceBoundaryRegex.lastIndex = 0;

        while ((match = this.sentenceBoundaryRegex.exec(text)) !== null) {
            // Extract sentence including the punctuation
            const sentence = text.substring(lastIndex, match.index + match[1].length);
            complete.push(sentence);
            lastIndex = match.index + match[0].length;
        }

        // Remaining text is partial
        const partial = text.substring(lastIndex);

        return { complete, partial };
    }

    /**
     * Queue an utterance for playback
     */
    private queueUtterance(text: string): void {
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure utterance
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Set up event handlers
        utterance.onstart = () => {
            errorLogger.debug(`Started speaking: "${text}"`, { context: 'StreamingTTS' });
        };

        utterance.onend = () => {
            errorLogger.debug(`Finished speaking: "${text}"`, { context: 'StreamingTTS' });
            this.playNextUtterance();
        };

        utterance.onerror = (event) => {
            errorLogger.error(`TTS error for text "${text}":`, event.error, { context: 'StreamingTTS' });
            this.playNextUtterance();
        };

        // Add to queue
        this.utteranceQueue.push(utterance);
        errorLogger.debug(`Queued utterance: "${text}". Queue length: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });

        // Start playing if not already playing
        if (!this.isPlaying && !this.isStopped) {
            this.playNextUtterance();
        }
    }

    /**
     * Play the next utterance in the queue
     */
    private playNextUtterance(): void {
        if (this.isStopped) {
            errorLogger.debug('StreamingTTS is stopped, not playing next utterance', { context: 'StreamingTTS' });
            return;
        }

        if (this.utteranceQueue.length === 0) {
            this.isPlaying = false;
            errorLogger.debug('Utterance queue empty, playback finished', { context: 'StreamingTTS' });
            return;
        }

        const utterance = this.utteranceQueue.shift();
        if (utterance) {
            this.isPlaying = true;

            // Check if speech synthesis is available
            if (!window.speechSynthesis) {
                errorLogger.error('Web Speech API not supported', null, { context: 'StreamingTTS' });
                return;
            }

            // Speak the utterance
            window.speechSynthesis.speak(utterance);
            errorLogger.debug(`Playing utterance. Remaining in queue: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
        }
    }

    /**
     * Flush remaining buffered text (call when stream ends)
     * Speaks any partial sentence that remains in the buffer
     */
    public flush(): void {
        if (this.isStopped) {
            errorLogger.warn('StreamingTTS is stopped, cannot flush', { context: 'StreamingTTS' });
            return;
        }

        if (this.textBuffer.trim().length > 0) {
            errorLogger.info(`Flushing remaining text: "${this.textBuffer}"`, { context: 'StreamingTTS' });
            this.queueUtterance(this.textBuffer.trim());
            this.textBuffer = '';
        }
    }

    /**
     * Stop all playback immediately and clear queue
     */
    public stop(): void {
        errorLogger.info('Stopping StreamingTTS', { context: 'StreamingTTS' });

        this.isStopped = true;
        this.isPlaying = false;
        this.textBuffer = '';
        this.utteranceQueue = [];

        // Cancel any ongoing speech
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Resume playback after stop (resets stopped state)
     */
    public resume(): void {
        errorLogger.info('Resuming StreamingTTS', { context: 'StreamingTTS' });
        this.isStopped = false;
    }

    /**
     * Get current playback state
     */
    public getState(): {
        isPlaying: boolean;
        isStopped: boolean;
        bufferLength: number;
        queueLength: number;
    } {
        return {
            isPlaying: this.isPlaying,
            isStopped: this.isStopped,
            bufferLength: this.textBuffer.length,
            queueLength: this.utteranceQueue.length,
        };
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        errorLogger.info('Cleaning up StreamingTTS', { context: 'StreamingTTS' });
        this.stop();
    }
}

export default StreamingTTS;
