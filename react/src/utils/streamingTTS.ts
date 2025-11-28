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
    private isStreamActive: boolean = false;
    private bufferingTimeout: NodeJS.Timeout | null = null;
    private watchdogTimer: NodeJS.Timeout | null = null;

    // Configuration
    private readonly BUFFERING_TIMEOUT_MS = 200; // 200ms for real-time speech like Google Assistant

    constructor() {
        errorLogger.info('StreamingTTS initialized', { context: 'StreamingTTS' });
    }

    public setStreamActive(active: boolean): void {
        this.isStreamActive = active;
        errorLogger.debug(`Stream active state set to: ${active}`, { context: 'StreamingTTS' });
    }

    /**
     * Add a text chunk from the streaming backend
     * Automatically detects sentence boundaries and queues complete sentences
     */
    public addTextChunk(text: string): void {
        // Auto-resume if we receive new chunks (fixes case where it was stopped but not resumed)
        if (this.isStopped) {
            errorLogger.info('Auto-resuming StreamingTTS on new chunk', { context: 'StreamingTTS' });
            this.isStopped = false;
        }

        errorLogger.debug(`addTextChunk (raw): "${text}"`, { context: 'StreamingTTS' });
        
        // Clean text: remove markdown bold/italic markers (*, _), headers (#), and code blocks (`)
        // Also remove emojis using a broad regex range
        const cleanText = text
            .replace(/[*_#`]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        
        errorLogger.debug(`addTextChunk (clean): "${cleanText}"`, { context: 'StreamingTTS' });

        // CRITICAL: Skip empty chunks to prevent infinite timeout reset
        if (cleanText.trim().length === 0) {
            // errorLogger.debug('Skipping empty/whitespace chunk', { context: 'StreamingTTS' });
            return;
        }

        // Add to buffer
        this.textBuffer += cleanText;
        
        // Implicitly active if receiving data
        this.isStreamActive = true;
        
        this.processBuffer();
        this.resetBufferingTimeout();
    }

    private resetBufferingTimeout() {
        if (this.bufferingTimeout) {
            // errorLogger.debug('Clearing existing buffering timeout', { context: 'StreamingTTS' });
            clearTimeout(this.bufferingTimeout);
        }

        const bufferContent = this.textBuffer.trim();
        if (bufferContent.length > 0) {
            errorLogger.debug(`Setting buffering timeout (buffer="${bufferContent}")`, { context: 'StreamingTTS' });
            this.bufferingTimeout = setTimeout(() => {
                errorLogger.info('Buffering timeout reached, forcing flush of buffer', { context: 'StreamingTTS' });
                this.flushBuffer();
            }, this.BUFFERING_TIMEOUT_MS);
        } else {
            errorLogger.debug('Buffer empty (trimmed), not setting timeout', { context: 'StreamingTTS' });
        }
    }

    /**
     * Flushes the current buffer as a sentence, but keeps stream active
     */
    private flushBuffer() {
        if (this.textBuffer.trim().length > 0) {
            errorLogger.info(`Force flushing buffer: "${this.textBuffer}"`, { context: 'StreamingTTS' });
            this.queueUtterance(this.textBuffer.trim());
            this.textBuffer = '';
        }
    }

    /**
     * Process the text buffer to extract and queue complete sentences
     */
    private processBuffer(): void {
        // Special case: if buffer starts with punctuation, it's orphaned from a previous sentence
        // This happens when punctuation arrives as a standalone chunk after sentence was already queued
        // Just discard it to prevent it from being prepended to the next sentence
        if (this.textBuffer.length > 0 && /^[.?!]+\s*$/.test(this.textBuffer)) {
            errorLogger.debug(`Discarding orphaned punctuation: "${this.textBuffer}"`, { context: 'StreamingTTS' });
            this.textBuffer = '';
            return;
        }

        // Match complete sentences: text followed by punctuation
        // This regex finds: (any characters) followed by (one or more punctuation marks)
        const sentenceRegex = /(.+?)([.?!]+)/g;
        let match;
        let lastIndex = 0;

        // Find all complete sentences in the buffer
        while ((match = sentenceRegex.exec(this.textBuffer)) !== null) {
            const fullSentence = match[1] + match[2]; // text + punctuation
            errorLogger.debug(`Queueing sentence: "${fullSentence}"`, { context: 'StreamingTTS' });
            this.queueUtterance(fullSentence.trim());
            lastIndex = sentenceRegex.lastIndex;
        }

        // Keep any remaining text (incomplete sentence) in the buffer
        if (lastIndex > 0) {
            this.textBuffer = this.textBuffer.substring(lastIndex).trim();
            errorLogger.debug(`Remaining buffer: "${this.textBuffer}"`, { context: 'StreamingTTS' });
        }
    }

    /**
     * Queue an utterance for playback
     */
    private queueUtterance(text: string): void {
        // CRITICAL: Skip utterances that are only punctuation/whitespace
        // This prevents queueing hundreds of individual "." characters
        const textWithoutPunctuation = text.replace(/[.!?,\s]/g, '');
        if (textWithoutPunctuation.length === 0) {
            errorLogger.debug(`Skipping punctuation-only utterance: "${text}"`, { context: 'StreamingTTS' });
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Configure utterance - reduced rate for more natural speech
        utterance.rate = 0.9; // Slightly slower than default (1.0)
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Select Female Voice
        const voices = window.speechSynthesis.getVoices();
        // Prefer Google US English Female, or Microsoft Zira, or any female voice
        const femaleVoice = voices.find(v => 
            v.name.includes('Google US English') || 
            v.name.includes('Zira') || 
            v.name.includes('Female')
        );
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
            errorLogger.debug(`Selected voice: ${femaleVoice.name}`, { context: 'StreamingTTS' });
        } else {
            errorLogger.warn('No female voice found, using default', { context: 'StreamingTTS' });
        }

        // Set up event handlers
        utterance.onstart = () => {
            errorLogger.info(`TTS onstart: "${text}", queue length: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
            // Only send tts:started if this is the first utterance (transitioning from idle to playing)
            // Don't send it for every utterance in the queue
        };

        utterance.onend = () => {
            errorLogger.info(`TTS onend: "${text}", queue length before playNext: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
            this.playNextUtterance();
            // Notify main process that ALL playback has ended (queue is empty)
            errorLogger.debug(`After playNext - queue: ${this.utteranceQueue.length}, isPlaying: ${this.isPlaying}, isStreamActive: ${this.isStreamActive}`, { context: 'StreamingTTS' });
            
            // Only send tts:ended if queue is empty AND stream is NOT active (meaning no more chunks are coming)
            if (this.utteranceQueue.length === 0 && !this.isPlaying && !this.isStreamActive) {
                errorLogger.info('All TTS playback finished and stream ended, dispatching tts:ended event', { context: 'StreamingTTS' });
                window.dispatchEvent(new CustomEvent('tts:ended', { detail: { text } }));
            } else if (this.utteranceQueue.length === 0 && !this.isPlaying && this.isStreamActive) {
                errorLogger.info('Queue empty but stream active, waiting for more chunks...', { context: 'StreamingTTS' });
            }
        };

        utterance.onerror = (event) => {
            errorLogger.error(`TTS error for text "${text}":`, event.error, { context: 'StreamingTTS' });
            this.playNextUtterance();
            // Send tts:ended on error to prevent VAD from getting stuck
            if (this.utteranceQueue.length === 0 && !this.isPlaying && !this.isStreamActive) {
                errorLogger.warn('TTS error and queue empty, dispatching tts:ended event', { context: 'StreamingTTS' });
                window.dispatchEvent(new CustomEvent('tts:ended', { detail: { text } }));
            }
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

        // Clear existing watchdog
        if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }

        if (this.utteranceQueue.length === 0) {
            this.isPlaying = false;
            errorLogger.debug('Utterance queue empty, playback finished', { context: 'StreamingTTS' });
            return;
        }

        const utterance = this.utteranceQueue.shift();
        if (utterance) {
            // Send tts:started only when transitioning from idle to playing
            const wasPlaying = this.isPlaying;
            this.isPlaying = true;
            
            if (!wasPlaying) {
                errorLogger.info('Starting TTS playback, dispatching tts:started event', { context: 'StreamingTTS' });
                window.dispatchEvent(new CustomEvent('tts:started'));
            }

            // Check if speech synthesis is available
            if (!window.speechSynthesis) {
                errorLogger.error('Web Speech API not supported', null, { context: 'StreamingTTS' });
                return;
            }

            // Set watchdog: Estimate duration based on word count (approx 300ms per word) + 3s buffer
            // Minimum 3s
            const wordCount = utterance.text.split(/\s+/).length;
            const estimatedDurationMs = Math.max(3000, (wordCount * 300) + 3000);
            
            this.watchdogTimer = setTimeout(() => {
                errorLogger.warn(`TTS Watchdog triggered for: "${utterance.text.substring(0, 20)}..."`, { context: 'StreamingTTS' });
                window.speechSynthesis.cancel(); // Force cancel current
                // Manually trigger onend logic
                if (utterance.onend) {
                    // @ts-ignore - Constructing a fake event for fallback
                    utterance.onend(new Event('end'));
                }
            }, estimatedDurationMs);

            // Speak the utterance
            // If starting from silence, add a small delay to allow VAD threshold to update (prevent self-interruption)
            if (!wasPlaying) {
                setTimeout(() => {
                    if (!this.isStopped) {
                        window.speechSynthesis.speak(utterance);
                        errorLogger.debug(`Playing first utterance (delayed). Remaining in queue: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
                    }
                }, 200);
            } else {
                window.speechSynthesis.speak(utterance);
                errorLogger.debug(`Playing utterance. Remaining in queue: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
            }
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

        this.isStreamActive = false; // Stream ended
        errorLogger.info('Stream ended (flush called), setting isStreamActive to false', { context: 'StreamingTTS' });

        if (this.textBuffer.trim().length > 0) {
            errorLogger.info(`Flushing remaining text: "${this.textBuffer}"`, { context: 'StreamingTTS' });
            this.queueUtterance(this.textBuffer.trim());
            this.textBuffer = '';
        } else {
             // If buffer is empty, we might need to trigger tts:ended if queue is also empty
             // This handles the case where the last chunk was a complete sentence and queue emptied before flush
             if (this.utteranceQueue.length === 0 && !this.isPlaying) {
                errorLogger.info('Flush called with empty buffer and queue, dispatching tts:ended event', { context: 'StreamingTTS' });
                window.dispatchEvent(new CustomEvent('tts:ended', { detail: { text: '' } }));
             }
        }
    }

    /**
     * Stop all playback immediately and clear queue
     */
    public stop(): void {
        errorLogger.info('Stopping StreamingTTS', { context: 'StreamingTTS' });

        if (this.bufferingTimeout) {
            clearTimeout(this.bufferingTimeout);
            this.bufferingTimeout = null;
        }

        if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }

        this.isStopped = true;
        this.isPlaying = false;
        this.isStreamActive = false;
        this.textBuffer = ''; // CRITICAL: Clear buffer to prevent repetition
        this.utteranceQueue = [];

        // Cancel any ongoing speech
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Reset internal state (buffer, queue, flags) without stopping playback engine if not needed
     * Useful for starting a fresh turn
     */
    public reset(): void {
        errorLogger.info('Resetting StreamingTTS state', { context: 'StreamingTTS' });
        this.textBuffer = '';
        this.utteranceQueue = [];
        this.isStopped = false;
        this.isStreamActive = false;
        // Don't necessarily cancel speech here if we just want to clear future buffer
        // But for a full reset, we probably should:
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isPlaying = false;
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
