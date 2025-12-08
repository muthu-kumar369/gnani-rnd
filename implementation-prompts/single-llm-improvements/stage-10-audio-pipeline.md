# Stage 10: Audio Pipeline Enhancement

**Priority:** P1  
**Estimated Time:** 1 week  
**Dependencies:** None

---

## Objective

Enhance audio quality and reliability through preprocessing (AEC/NS/AGC), adaptive VAD, and quality monitoring for production-grade voice interactions.

---

## Implementation

### 1. Audio Preprocessing

**File:** `electron/mic/audioPreprocessor.js`

```javascript
const { spawn } = require('child_process');
const logger = require('../utils/logger');

class AudioPreprocessor {
  constructor() {
    this.aecEnabled = true;   // Acoustic Echo Cancellation
    this.nsEnabled = true;    // Noise Suppression
    this.agcEnabled = true;   // Automatic Gain Control
    
    // Audio quality thresholds
    this.minSNR = 10;  // Minimum Signal-to-Noise Ratio (dB)
    this.maxClipping = 0.01;  // Maximum allowed clipping (1%)
  }

  /**
   * Process audio buffer through preprocessing pipeline
   */
  async process(audioBuffer) {
    let processed = audioBuffer;

    try {
      if (this.aecEnabled) {
        processed = await this.applyAEC(processed);
      }

      if (this.nsEnabled) {
        processed = await this.applyNoiseSuppression(processed);
      }

      if (this.agcEnabled) {
        processed = await this.applyGainControl(processed);
      }

      // Validate quality
      const quality = this.assessQuality(processed);
      if (quality.snr < this.minSNR) {
        logger.warn(`Low SNR detected: ${quality.snr}dB`);
      }

      return processed;
    } catch (error) {
      logger.error(`Audio preprocessing failed: ${error.message}`);
      return audioBuffer; // Return original on error
    }
  }

  /**
   * Apply Acoustic Echo Cancellation using WebRTC
   */
  async applyAEC(buffer) {
    // Use WebRTC's AEC implementation via native module
    // Or use RNNoise for noise suppression
    return buffer; // Placeholder
  }

  /**
   * Apply Noise Suppression
   */
  async applyNoiseSuppression(buffer) {
    // Implement spectral subtraction or use RNNoise
    const float32Array = this.bufferToFloat32(buffer);
    
    // Simple noise gate
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
   */
  async applyGainControl(buffer) {
    const float32Array = this.bufferToFloat32(buffer);
    
    // Calculate RMS level
    const rms = this.calculateRMS(float32Array);
    const targetRMS = 0.1; // Target level
    
    if (rms > 0) {
      const gain = targetRMS / rms;
      const limitedGain = Math.min(Math.max(gain, 0.5), 2.0); // Limit gain to 0.5x-2x
      
      for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] *= limitedGain;
        // Prevent clipping
        float32Array[i] = Math.max(-1, Math.min(1, float32Array[i]));
      }
    }

    return this.float32ToBuffer(float32Array);
  }

  /**
   * Assess audio quality
   */
  assessQuality(buffer) {
    const float32Array = this.bufferToFloat32(buffer);
    
    const rms = this.calculateRMS(float32Array);
    const peakLevel = Math.max(...float32Array.map(Math.abs));
    const clippingRate = float32Array.filter(s => Math.abs(s) > 0.99).length / float32Array.length;
    
    // Estimate SNR (simplified)
    const signalPower = rms * rms;
    const noisePower = this.estimateNoisePower(float32Array);
    const snr = 10 * Math.log10(signalPower / noisePower);

    return {
      rms,
      peakLevel,
      clippingRate,
      snr,
      quality: snr > 20 ? 'high' : snr > 10 ? 'medium' : 'low'
    };
  }

  // Helper methods
  bufferToFloat32(buffer) {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  }

  float32ToBuffer(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return Buffer.from(int16Array.buffer);
  }

  calculateRMS(float32Array) {
    const sum = float32Array.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / float32Array.length);
  }

  estimateNoisePower(float32Array) {
    // Simple noise floor estimation (bottom 10% of signal)
    const sorted = [...float32Array].map(Math.abs).sort((a, b) => a - b);
    const noiseFloorIndex = Math.floor(sorted.length * 0.1);
    const noiseLevel = sorted[noiseFloorIndex];
    return noiseLevel * noiseLevel;
  }
}

module.exports = AudioPreprocessor;
```

### 2. Adaptive VAD

**File:** `electron/vad/vadManager.js`

```javascript
class VadManager extends EventEmitter {
  constructor() {
    super();
    this.sensitivity = 0.5; // Default sensitivity
    this.adaptiveMode = true;
    this.environmentNoise = 0;
    this.speechThreshold = 0.5;
    this.silenceThreshold = 0.3;
    
    // Adaptive parameters
    this.recentSNRs = [];
    this.maxSNRHistory = 10;
  }

  /**
   * Adjust VAD sensitivity based on environment
   */
  adjustSensitivity(audioQuality) {
    if (!this.adaptiveMode) return;

    const { snr, rms } = audioQuality;
    
    // Track recent SNR values
    this.recentSNRs.push(snr);
    if (this.recentSNRs.length > this.maxSNRHistory) {
      this.recentSNRs.shift();
    }

    const avgSNR = this.recentSNRs.reduce((a, b) => a + b, 0) / this.recentSNRs.length;

    // Adjust sensitivity based on SNR
    if (avgSNR > 20) {
      // High quality environment - more sensitive
      this.sensitivity = 0.7;
      this.speechThreshold = 0.4;
      this.silenceThreshold = 0.2;
    } else if (avgSNR > 10) {
      // Medium quality - balanced
      this.sensitivity = 0.5;
      this.speechThreshold = 0.5;
      this.silenceThreshold = 0.3;
    } else {
      // Low quality - less sensitive to avoid false positives
      this.sensitivity = 0.3;
      this.speechThreshold = 0.6;
      this.silenceThreshold = 0.4;
    }

    logger.debug(`VAD sensitivity adjusted`, {
      avgSNR,
      sensitivity: this.sensitivity,
      speechThreshold: this.speechThreshold
    });
  }

  /**
   * Process audio with adaptive thresholds
   */
  processAudio(audioBuffer) {
    const probability = this.vadEngine.process(audioBuffer);
    
    // Apply adaptive thresholds
    if (probability > this.speechThreshold && !this.isSpeaking) {
      this.isSpeaking = true;
      this.emit('speech:start');
    } else if (probability < this.silenceThreshold && this.isSpeaking) {
      this.isSpeaking = false;
      this.emit('speech:end');
    }

    return probability;
  }
}
```

### 3. Audio Quality Monitoring

**File:** `electron/mic/qualityMonitor.js`

```javascript
class AudioQualityMonitor {
  constructor() {
    this.qualityHistory = [];
    this.alertThresholds = {
      lowSNR: 10,
      highClipping: 0.05,
      lowLevel: 0.01
    };
  }

  /**
   * Monitor audio quality and emit alerts
   */
  monitor(audioBuffer, quality) {
    this.qualityHistory.push({
      timestamp: Date.now(),
      ...quality
    });

    // Keep last 100 measurements
    if (this.qualityHistory.length > 100) {
      this.qualityHistory.shift();
    }

    // Check for quality issues
    if (quality.snr < this.alertThresholds.lowSNR) {
      this.emit('quality:warning', {
        type: 'low_snr',
        value: quality.snr,
        message: 'Low signal-to-noise ratio detected'
      });
    }

    if (quality.clippingRate > this.alertThresholds.highClipping) {
      this.emit('quality:warning', {
        type: 'clipping',
        value: quality.clippingRate,
        message: 'Audio clipping detected'
      });
    }

    if (quality.rms < this.alertThresholds.lowLevel) {
      this.emit('quality:warning', {
        type: 'low_level',
        value: quality.rms,
        message: 'Audio level too low'
      });
    }

    return this.getAverageQuality();
  }

  getAverageQuality() {
    if (this.qualityHistory.length === 0) return null;

    const recent = this.qualityHistory.slice(-10);
    const avgSNR = recent.reduce((sum, q) => sum + q.snr, 0) / recent.length;
    const avgRMS = recent.reduce((sum, q) => sum + q.rms, 0) / recent.length;

    return {
      avgSNR,
      avgRMS,
      quality: avgSNR > 20 ? 'excellent' : avgSNR > 15 ? 'good' : avgSNR > 10 ? 'fair' : 'poor'
    };
  }
}
```

---

## Verification Checklist

- [ ] Audio preprocessing implemented (AEC/NS/AGC)
- [ ] Adaptive VAD adjusting to environment
- [ ] Quality metrics tracked (SNR, clipping, level)
- [ ] Quality warnings emitted
- [ ] Barge-in latency <100ms
- [ ] Audio quality improved by >30%

---

## Success Criteria

1. ✅ SNR improved by >30%
2. ✅ Clipping rate <1%
3. ✅ Adaptive VAD accuracy >95%
4. ✅ Barge-in latency <100ms
5. ✅ User-reported audio quality improved
