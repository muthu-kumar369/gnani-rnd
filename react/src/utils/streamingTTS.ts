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
    private streamExplicitlyEnded: boolean = false; // Track explicit stream end
    private bufferingTimeout: NodeJS.Timeout | null = null;
    private watchdogTimer: NodeJS.Timeout | null = null;
    private activeUtterances: Set<SpeechSynthesisUtterance> = new Set(); // Track active utterances for cleanup

    // Configuration
    private readonly BUFFERING_TIMEOUT_MS = 200; // 200ms for real-time speech like Google Assistant

    private voices: SpeechSynthesisVoice[] = [];

    constructor() {
        errorLogger.info('StreamingTTS initialized', { context: 'StreamingTTS' });
        this.initVoices();
    }

    private initVoices(): void {
        const updateVoices = () => {
            const available = window.speechSynthesis.getVoices();
            if (available.length > 0) {
                this.voices = available;
                errorLogger.info(`Voices loaded: ${available.length}`, { context: 'StreamingTTS' });
                this.logVoiceMappings();
            }
        };

        updateVoices();

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }

    private logVoiceMappings(): void {
        const personas = ['jarvis', 'friday', 'edith', 'atlas', 'luna', 'orion', 'nova', 'echo'];
        const mappings = personas.map(id => {
            const voice = this.getVoiceForPersona(id);
            return `${id}: ${voice ? voice.name : 'DEFAULT'}`;
        });
        errorLogger.info(`Startup Voice Mappings: ${mappings.join(', ')}`, { context: 'StreamingTTS' });
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

    private preferredVoiceId: string = 'jarvis';

    public setPreferredVoice(voiceId: string): void {
        this.preferredVoiceId = voiceId;
        errorLogger.info(`Voice persona set to: ${voiceId}`, { context: 'StreamingTTS' });
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

        // Configure utterance default
        utterance.rate = 0.9; // Slightly slower than default (1.0)
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // LOGIC FOR VOICE SELECTION MOVED TO playNextUtterance to happen at runtime
        // This allows voices to load asynchronously if they are not ready yet.

        // Set up event handlers
        utterance.onstart = () => {
            errorLogger.info(`TTS onstart: "${text}", queue length: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
            // Only send tts:started if this is the first utterance (transitioning from idle to playing)
            // Don't send it for every utterance in the queue
        };

        utterance.onend = () => {
            errorLogger.info(`TTS onend: "${text}", queue length before playNext: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });
            this.activeUtterances.delete(utterance); // Remove from active set
            this.playNextUtterance();

            // Only send tts:ended if:
            // 1. Queue is empty
            // 2. Not currently playing
            // 3. Stream has been explicitly ended (not just inactive)
            if (this.utteranceQueue.length === 0 && !this.isPlaying) {
                if (!this.isStreamActive || this.streamExplicitlyEnded) {
                    errorLogger.info('All TTS playback finished and stream ended, dispatching tts:ended event', { context: 'StreamingTTS' });
                    window.dispatchEvent(new CustomEvent('tts:ended', { detail: { text } }));
                } else {
                    errorLogger.info('Queue empty but stream active and not explicitly ended, waiting for more chunks...', { context: 'StreamingTTS' });
                }
            }
        };

        utterance.onerror = (event) => {
            errorLogger.error(`TTS error for text "${text}":`, event.error, { context: 'StreamingTTS' });
            this.activeUtterances.delete(utterance); // Remove from active set
            this.playNextUtterance();
            // Send tts:ended on error to prevent VAD from getting stuck
            if (this.utteranceQueue.length === 0 && !this.isPlaying) {
                if (!this.isStreamActive || this.streamExplicitlyEnded) {
                    errorLogger.warn('TTS error and queue empty, dispatching tts:ended event', { context: 'StreamingTTS' });
                    window.dispatchEvent(new CustomEvent('tts:ended', { detail: { text } }));
                }
            }
        };

        // Add boundary event for lip sync
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Get the word being spoken
                const charIndex = event.charIndex;
                const charLength = event.charLength || 0;
                const word = text.substring(charIndex, charIndex + charLength);

                // Dispatch event for UI/Avatar to consume
                window.dispatchEvent(new CustomEvent('tts:word', {
                    detail: {
                        word,
                        charIndex,
                        elapsedTime: event.elapsedTime
                    }
                }));
            }
        };

        // Add to queue
        this.utteranceQueue.push(utterance);
        this.activeUtterances.add(utterance); // Track active utterance
        errorLogger.debug(`Queued utterance: "${text}". Queue length: ${this.utteranceQueue.length}`, { context: 'StreamingTTS' });

        // Start playing if not already playing
        if (!this.isPlaying && !this.isStopped) {
            this.playNextUtterance();
        }
    }

    private getVoiceForPersona(personaId: string, availableVoices?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
        const voices = availableVoices || (this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices());

        // Helper to find voice by fuzzy name match
        const findVoice = (keywords: string[]) => {
            const match = voices.find(v => keywords.some(k => v.name.toLowerCase().includes(k.toLowerCase())));
            if (match) return match;
            const idMatch = voices.find(v => v.name.toLowerCase().includes(personaId.toLowerCase()));
            if (idMatch) return idMatch;
            return undefined;
        };

        switch (personaId) {
            case 'jarvis':
                let v = findVoice(['Google UK English Male', 'Daniel', 'George', 'English United Kingdom', 'UK English Male']);
                if (!v) v = findVoice(['David', 'Mark', 'Male']);
                return v;
            case 'friday':
                let f = findVoice(['Google US English Female', 'Samantha', 'Zira', 'English United States', 'US English Female']);
                if (!f) f = findVoice(['Female']);
                return f;
            case 'edith':
                return findVoice(['Google US English Male', 'Alex', 'David', 'Male']);
            case 'atlas':
                let a = findVoice(['Google UK English Male', 'Daniel', 'George', 'Human', 'UK English Male']);
                if (!a) a = findVoice(['David', 'Mark', 'Male']);
                return a;
            case 'luna':
                let l = findVoice(['Google UK English Female', 'Victoria', 'Hazel', 'Susan', 'UK English Female']);
                if (!l) l = findVoice(['Zira', 'Samantha', 'Female']);
                return l;
            case 'orion':
                return findVoice(['Google US English Male', 'David', 'Alex', 'Male']);
            case 'nova':
                return findVoice(['Google US English Female', 'Zira', 'Samantha', 'Female']);
            case 'echo':
                return findVoice(['Google US English Female', 'Samantha', 'Zira', 'Female']);
            default:
                return findVoice(['Google US English Female', 'Zira', 'Samantha', 'Female']);
        }
    }

    /**
     * Apply voice selection to an utterance immediately before speaking
     */
    private applyVoiceSelection(utterance: SpeechSynthesisUtterance): void {
        let voices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();

        if (voices.length === 0) {
            errorLogger.warn('Voices list is still empty in applyVoiceSelection', { context: 'StreamingTTS' });
            voices = window.speechSynthesis.getVoices();
        }

        const selectedVoice = this.getVoiceForPersona(this.preferredVoiceId, voices);

        // Apply pitch/rate adjustments
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            switch (this.preferredVoiceId) {
                case 'jarvis': utterance.pitch = 0.9; utterance.rate = 0.95; break;
                case 'edith': utterance.pitch = 1.0; utterance.rate = 1.05; break;
                case 'atlas': utterance.pitch = 0.8; utterance.rate = 0.9; break;
                case 'luna': utterance.pitch = 1.1; utterance.rate = 0.85; break;
                case 'orion': utterance.rate = 1.2; break;
                case 'nova': utterance.pitch = 1.2; utterance.rate = 1.1; break;
                case 'echo': utterance.rate = 0.8; break;
            }
            errorLogger.info(`Voice Selection SUCCESS: Used "${selectedVoice.name}" for persona "${this.preferredVoiceId}"`, { context: 'StreamingTTS' });
        } else {
            errorLogger.warn(`Voice Selection FAILED: No suitable voice found for "${this.preferredVoiceId}"`, { context: 'StreamingTTS' });
        }
    }

    /**
     * Play the next utterance in the queue
     */
    private playNextUtterance(): void {
        const attemptPlay = async (retries = 3) => {
            if (this.isStopped) return;
            if (this.utteranceQueue.length === 0) {
                this.isPlaying = false;
                errorLogger.debug('Utterance queue empty, playback finished', { context: 'StreamingTTS' });
                return;
            }

            // Ensure voices are loaded before adhering
            if (this.voices.length === 0 && retries > 0) {
                const available = window.speechSynthesis.getVoices();
                if (available.length > 0) {
                    this.voices = available;
                } else {
                    errorLogger.warn(`Voices not ready yet in playNext, retrying... (${retries} left)`, { context: 'StreamingTTS' });
                    await new Promise(r => setTimeout(r, 100));
                    return attemptPlay(retries - 1);
                }
            }

            const utterance = this.utteranceQueue.shift();
            if (!utterance) return;

            // Apply voice selection NOW, just before speaking
            this.applyVoiceSelection(utterance);

            // ... rest of the logic ...
            this.executePlayback(utterance);
        };

        attemptPlay();
    }

    // Extracted actual playback execution from loop
    private executePlayback(utterance: SpeechSynthesisUtterance) {
        // Clear existing watchdog
        if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }

        const wasPlaying = this.isPlaying;
        this.isPlaying = true;

        if (!wasPlaying) {
            errorLogger.info('Starting TTS playback, dispatching tts:started event', { context: 'StreamingTTS' });
            window.dispatchEvent(new CustomEvent('tts:started'));
        }

        if (!window.speechSynthesis) {
            errorLogger.error('Web Speech API not supported', null, { context: 'StreamingTTS' });
            return;
        }

        const wordCount = utterance.text.split(/\s+/).length;
        const estimatedDurationMs = Math.max(3000, (wordCount * 300) + 3000);

        this.watchdogTimer = setTimeout(() => {
            errorLogger.warn(`TTS Watchdog triggered for: "${utterance.text.substring(0, 20)}..."`, { context: 'StreamingTTS' });
            window.speechSynthesis.cancel();
            if (utterance.onend) {
                // @ts-ignore
                utterance.onend(new Event('end'));
            }
        }, estimatedDurationMs);

        if (!wasPlaying) {
            setTimeout(() => {
                if (!this.isStopped) {
                    window.speechSynthesis.speak(utterance);
                    errorLogger.debug(`Playing first utterance (delayed).`, { context: 'StreamingTTS' });
                }
            }, 200);
        } else {
            window.speechSynthesis.speak(utterance);
            errorLogger.debug(`Playing utterance.`, { context: 'StreamingTTS' });
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

        this.streamExplicitlyEnded = true; // Mark stream as explicitly ended
        this.isStreamActive = false; // Stream ended
        errorLogger.info('Stream ended (flush called), setting isStreamActive to false and streamExplicitlyEnded to true', { context: 'StreamingTTS' });

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

        // Clean up all active utterances
        this.activeUtterances.forEach(utterance => {
            utterance.onstart = null;
            utterance.onend = null;
            utterance.onerror = null;
            utterance.onboundary = null;
        });
        this.activeUtterances.clear();

        this.isStopped = true;
        this.isPlaying = false;
        this.isStreamActive = false;
        this.streamExplicitlyEnded = false;
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
        this.streamExplicitlyEnded = false; // Reset explicit end flag

        // Clean up active utterances
        this.activeUtterances.forEach(utterance => {
            utterance.onstart = null;
            utterance.onend = null;
            utterance.onerror = null;
            utterance.onboundary = null;
        });
        this.activeUtterances.clear();

        // Cancel speech
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
