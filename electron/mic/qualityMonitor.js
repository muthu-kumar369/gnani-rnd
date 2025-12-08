// electron/mic/qualityMonitor.js
// Stage 10: Audio quality monitoring service
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class AudioQualityMonitor extends EventEmitter {
    constructor() {
        super();
        this.qualityHistory = [];
        this.maxHistorySize = 100;

        // Alert thresholds
        this.alertThresholds = {
            lowSNR: 10,           // dB
            highClipping: 0.05,   // 5%
            lowLevel: 0.01        // RMS
        };

        logger.info('AudioQualityMonitor initialized', {
            context: 'AudioQualityMonitor',
            thresholds: this.alertThresholds
        });
    }

    /**
     * Monitor audio quality and emit alerts
     * @param {Object} quality - Quality metrics from preprocessor
     * @returns {Object} Average quality over recent history
     */
    monitor(quality) {
        // Add to history with timestamp
        this.qualityHistory.push({
            timestamp: Date.now(),
            ...quality
        });

        // Keep last N measurements
        if (this.qualityHistory.length > this.maxHistorySize) {
            this.qualityHistory.shift();
        }

        // Check for quality issues and emit warnings
        this.checkQualityIssues(quality);

        return this.getAverageQuality();
    }

    /**
     * Check for quality issues and emit warnings
     */
    checkQualityIssues(quality) {
        if (quality.snr < this.alertThresholds.lowSNR) {
            this.emit('quality:warning', {
                type: 'low_snr',
                value: quality.snr,
                message: `Low signal-to-noise ratio detected: ${quality.snr.toFixed(2)}dB`
            });
        }

        if (quality.clippingRate > this.alertThresholds.highClipping) {
            this.emit('quality:warning', {
                type: 'clipping',
                value: quality.clippingRate,
                message: `Audio clipping detected: ${(quality.clippingRate * 100).toFixed(2)}%`
            });
        }

        if (quality.rms < this.alertThresholds.lowLevel) {
            this.emit('quality:warning', {
                type: 'low_level',
                value: quality.rms,
                message: `Audio level too low: ${quality.rms.toFixed(4)}`
            });
        }
    }

    /**
     * Get average quality over recent history
     * @param {number} sampleSize - Number of recent samples to average (default: 10)
     * @returns {Object} Average quality metrics
     */
    getAverageQuality(sampleSize = 10) {
        if (this.qualityHistory.length === 0) {
            return null;
        }

        const recent = this.qualityHistory.slice(-sampleSize);
        const avgSNR = recent.reduce((sum, q) => sum + q.snr, 0) / recent.length;
        const avgRMS = recent.reduce((sum, q) => sum + q.rms, 0) / recent.length;
        const avgClipping = recent.reduce((sum, q) => sum + q.clippingRate, 0) / recent.length;
        const avgPeak = recent.reduce((sum, q) => sum + q.peakLevel, 0) / recent.length;

        return {
            avgSNR,
            avgRMS,
            avgClipping,
            avgPeak,
            quality: this.gradeQuality(avgSNR),
            sampleCount: recent.length
        };
    }

    /**
     * Grade quality based on SNR
     */
    gradeQuality(snr) {
        if (snr > 20) return 'excellent';
        if (snr > 15) return 'good';
        if (snr > 10) return 'fair';
        return 'poor';
    }

    /**
     * Get quality statistics
     */
    getStatistics() {
        if (this.qualityHistory.length === 0) {
            return null;
        }

        const snrValues = this.qualityHistory.map(q => q.snr);
        const rmsValues = this.qualityHistory.map(q => q.rms);

        return {
            totalSamples: this.qualityHistory.length,
            snr: {
                min: Math.min(...snrValues),
                max: Math.max(...snrValues),
                avg: snrValues.reduce((a, b) => a + b, 0) / snrValues.length
            },
            rms: {
                min: Math.min(...rmsValues),
                max: Math.max(...rmsValues),
                avg: rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length
            },
            qualityDistribution: this.getQualityDistribution()
        };
    }

    /**
     * Get distribution of quality grades
     */
    getQualityDistribution() {
        const distribution = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0
        };

        this.qualityHistory.forEach(q => {
            const grade = this.gradeQuality(q.snr);
            distribution[grade]++;
        });

        return distribution;
    }

    /**
     * Update alert thresholds
     */
    updateThresholds(newThresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
        logger.info('Quality monitor thresholds updated', {
            context: 'AudioQualityMonitor',
            thresholds: this.alertThresholds
        });
    }

    /**
     * Clear quality history
     */
    clearHistory() {
        this.qualityHistory = [];
        logger.info('Quality history cleared', { context: 'AudioQualityMonitor' });
    }

    /**
     * Get current quality status
     */
    getStatus() {
        const avg = this.getAverageQuality();
        const stats = this.getStatistics();

        return {
            current: this.qualityHistory[this.qualityHistory.length - 1] || null,
            average: avg,
            statistics: stats,
            thresholds: this.alertThresholds
        };
    }
}

module.exports = AudioQualityMonitor;
