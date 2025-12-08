// electron/mic/audioPreprocessor.js
// Stage 10: Audio preprocessing pipeline with AEC/NS/AGC
const logger = require('../utils/logger');

class AudioPreprocessor {
    constructor() {
        this.aecEnabled = false;   // Acoustic Echo Cancellation (placeholder for now)
        this.nsEnabled = true;     // Noise Suppression
        this.agcEnabled = true;    // Automatic Gain Control

        // Audio quality thresholds
        this.minSNR = 10;  // Minimum Signal-to-Noise Ratio (dB)
        this.maxClipping = 0.01;  // Maximum allowed clipping (1%)

        logger.info('AudioPreprocessor initialized', {
            context: 'AudioPreprocessor',
            aec: this.aecEnabled,
            ns: this.nsEnabled,
            agc: this.agcEnabled
        });
    }

    /**
     * Process audio buffer through preprocessing pipeline
     * @param {Buffer} audioBuffer - Raw audio buffer (Int16 PCM)
     * @returns {Object} { processed: Buffer, quality: Object }
     */
    async process(audioBuffer) {
        let processed = audioBuffer;

        try {
            // Apply preprocessing stages
            if (this.aecEnabled) {
                processed = await this.applyAEC(processed);
            }

            if (this.nsEnabled) {
                processed = await this.applyNoiseSuppression(processed);
            }

            if (this.agcEnabled) {
                processed = await this.applyGainControl(processed);
            }

            // Assess quality
            const quality = this.assessQuality(processed);

            if (quality.snr < this.minSNR) {
                logger.warn(`Low SNR detected: ${quality.snr.toFixed(2)}dB`, { context: 'AudioPreprocessor' });
            }

            if (quality.clippingRate > this.maxClipping) {
                logger.warn(`High clipping detected: ${(quality.clippingRate * 100).toFixed(2)}%`, { context: 'AudioPreprocessor' });
            }

            return { processed, quality };
        } catch (error) {
            logger.error(`Audio preprocessing failed: ${error.message}`, { context: 'AudioPreprocessor' });
            // Return original on error with basic quality assessment
            return {
                processed: audioBuffer,
                quality: this.assessQuality(audioBuffer)
            };
        }
    }

    /**
     * Apply Acoustic Echo Cancellation (placeholder)
     * In production, use WebRTC AEC or RNNoise
     */
    async applyAEC(buffer) {
        // Placeholder - would integrate with WebRTC AEC or native module
        return buffer;
    }

    /**
     * Apply Noise Suppression using simple noise gate
     */
    async applyNoiseSuppression(buffer) {
        const float32Array = this.bufferToFloat32(buffer);

        // Simple noise gate threshold
        const threshold = 0.01;

        for (let i = 0; i < float32Array.length; i++) {
            if (Math.abs(float32Array[i]) < threshold) {
                float32Array[i] = 0;
            }
        }

        return this.float32ToBuffer(float32Array);
    }

    /**
     * Apply Automatic Gain Control
     * Normalizes audio level to target RMS
     */
    async applyGainControl(buffer) {
        const float32Array = this.bufferToFloat32(buffer);

        // Calculate RMS level
        const rms = this.calculateRMS(float32Array);
        const targetRMS = 0.1; // Target level (10% of max)

        if (rms > 0) {
            const gain = targetRMS / rms;
            // Limit gain to prevent extreme amplification
            const limitedGain = Math.min(Math.max(gain, 0.5), 2.0); // 0.5x to 2x

            for (let i = 0; i < float32Array.length; i++) {
                float32Array[i] *= limitedGain;
                // Prevent clipping
                float32Array[i] = Math.max(-1, Math.min(1, float32Array[i]));
            }
        }

        return this.float32ToBuffer(float32Array);
    }

    /**
     * Assess audio quality metrics
     * @returns {Object} Quality metrics (SNR, RMS, peak, clipping, quality grade)
     */
    assessQuality(buffer) {
        const float32Array = this.bufferToFloat32(buffer);

        const rms = this.calculateRMS(float32Array);
        const peakLevel = Math.max(...float32Array.map(Math.abs));
        const clippingRate = float32Array.filter(s => Math.abs(s) > 0.99).length / float32Array.length;

        // Estimate SNR (simplified)
        const signalPower = rms * rms;
        const noisePower = this.estimateNoisePower(float32Array);
        const snr = noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : 0;

        return {
            rms,
            peakLevel,
            clippingRate,
            snr,
            quality: snr > 20 ? 'high' : snr > 10 ? 'medium' : 'low'
        };
    }

    // ============================================
    // Helper Methods
    // ============================================

    /**
     * Convert Int16 PCM buffer to Float32 array
     */
    bufferToFloat32(buffer) {
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        return float32Array;
    }

    /**
     * Convert Float32 array to Int16 PCM buffer
     */
    float32ToBuffer(float32Array) {
        const int16Array = new Int16Array(float32Array.length);

        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 32768 : s * 32767;
        }

        return Buffer.from(int16Array.buffer);
    }

    /**
     * Calculate RMS (Root Mean Square) level
     */
    calculateRMS(float32Array) {
        const sum = float32Array.reduce((acc, val) => acc + val * val, 0);
        return Math.sqrt(sum / float32Array.length);
    }

    /**
     * Estimate noise power (bottom 10% of signal)
     */
    estimateNoisePower(float32Array) {
        const sorted = [...float32Array].map(Math.abs).sort((a, b) => a - b);
        const noiseFloorIndex = Math.floor(sorted.length * 0.1);
        const noiseLevel = sorted[noiseFloorIndex];
        return noiseLevel * noiseLevel;
    }

    /**
     * Enable/disable preprocessing stages
     */
    setEnabled(stage, enabled) {
        switch (stage) {
            case 'aec':
                this.aecEnabled = enabled;
                break;
            case 'ns':
                this.nsEnabled = enabled;
                break;
            case 'agc':
                this.agcEnabled = enabled;
                break;
            default:
                logger.warn(`Unknown preprocessing stage: ${stage}`, { context: 'AudioPreprocessor' });
        }

        logger.info(`Preprocessing stage ${stage} ${enabled ? 'enabled' : 'disabled'}`, { context: 'AudioPreprocessor' });
    }
}

module.exports = AudioPreprocessor;
