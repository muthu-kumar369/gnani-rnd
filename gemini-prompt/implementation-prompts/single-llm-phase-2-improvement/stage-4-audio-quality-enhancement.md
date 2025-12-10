# Stage 4: Audio Quality Enhancement

**Priority:** P1 (Critical for UX)  
**Duration:** 5 days  
**Dependencies:** None (can run in parallel with other stages)  
**Current Completion:** 60%

---

## Context & Background

### Current State Analysis

**✅ What Exists:**
- `electron/mic/audioPreprocessor.js` - Basic audio preprocessing
- `electron/mic/qualityMonitor.js` - Audio quality monitoring
- `electron/vad/vadManager.js` - VAD implementation (Silero VAD)
- Whisper.cpp integration for transcription
- Audio buffering and streaming

**❌ What's Missing:**
- **Full AEC (Acoustic Echo Cancellation)**
- **NS (Noise Suppression)**
- **AGC (Automatic Gain Control)**
- **Adaptive VAD sensitivity**
- **Advanced audio quality metrics** (SNR, THD, etc.)
- **Multi-microphone support**
- **Audio preprocessing benchmarks**

### Why This Matters

Poor audio quality leads to:
- **Inaccurate transcriptions** from Whisper
- **False VAD triggers** from background noise
- **Echo feedback** loops
- **Inconsistent volume** levels
- **Poor user experience**

---

## Objectives

### Primary Goals

1. **Echo Cancellation** - Eliminate echo from speaker output
2. **Noise Suppression** - Remove background noise
3. **Gain Control** - Normalize audio levels
4. **Adaptive VAD** - Adjust sensitivity based on environment
5. **Quality Metrics** - Measure and monitor audio quality

### Success Criteria

- [ ] AEC reducing echo by >20dB
- [ ] NS reducing background noise by >15dB
- [ ] AGC maintaining consistent levels (±3dB)
- [ ] VAD false positive rate <5%
- [ ] SNR >20dB after preprocessing
- [ ] Real-time processing (<50ms latency)
- [ ] Audio quality dashboard showing metrics

---

## Technical Requirements

### 1. Acoustic Echo Cancellation (AEC)

#### Problem Statement

When the assistant speaks through speakers, the microphone picks up that audio, creating:
- Echo feedback loops
- Duplicate transcriptions
- Confused conversation state

#### Implementation Options

**Option A: WebRTC AEC (Recommended)**

WebRTC provides high-quality AEC with low latency.

Install dependencies:
```bash
npm install wrtc
```

Create `electron/audio/aec-processor.js`:

```javascript
const { RTCAudioSource } = require('wrtc').nonstandard;

class AECProcessor {
  constructor() {
    this.audioContext = null;
    this.aecNode = null;
    this.initialized = false;
  }

  async initialize(sampleRate = 16000) {
    // Create Web Audio context
    this.audioContext = new (require('web-audio-api').AudioContext)({
      sampleRate: sampleRate,
    });

    // Create AEC node using WebRTC
    this.aecNode = this.audioContext.createScriptProcessor(
      4096, // Buffer size
      1,    // Input channels
      1     // Output channels
    );

    // Configure AEC parameters
    this.aecNode.echoCancellation = true;
    this.aecNode.noiseSuppression = false; // Handle separately
    this.aecNode.autoGainControl = false;  // Handle separately

    this.initialized = true;
    console.log('AEC initialized');
  }

  /**
   * Process audio chunk with AEC
   * @param {Buffer} inputBuffer - Raw audio data
   * @param {Buffer} referenceBuffer - Speaker output (for echo cancellation)
   * @returns {Buffer} Processed audio
   */
  process(inputBuffer, referenceBuffer) {
    if (!this.initialized) {
      throw new Error('AEC not initialized');
    }

    // Convert buffers to Float32Array
    const inputFloat = this.bufferToFloat32(inputBuffer);
    const referenceFloat = this.bufferToFloat32(referenceBuffer);

    // Apply AEC algorithm
    const output = this.applyAEC(inputFloat, referenceFloat);

    // Convert back to Buffer
    return this.float32ToBuffer(output);
  }

  /**
   * Apply AEC algorithm (simplified WebRTC implementation)
   */
  applyAEC(input, reference) {
    const output = new Float32Array(input.length);
    
    // Adaptive filter implementation
    const filterLength = 512;
    const filter = new Float32Array(filterLength);
    const stepSize = 0.01;

    for (let i = 0; i < input.length; i++) {
      // Estimate echo
      let echo = 0;
      for (let j = 0; j < filterLength && i - j >= 0; j++) {
        echo += filter[j] * (reference[i - j] || 0);
      }

      // Subtract echo from input
      const error = input[i] - echo;
      output[i] = error;

      // Update filter coefficients (LMS algorithm)
      for (let j = 0; j < filterLength && i - j >= 0; j++) {
        filter[j] += stepSize * error * (reference[i - j] || 0);
      }
    }

    return output;
  }

  bufferToFloat32(buffer) {
    const float32 = new Float32Array(buffer.length / 2);
    for (let i = 0; i < float32.length; i++) {
      const int16 = buffer.readInt16LE(i * 2);
      float32[i] = int16 / 32768.0; // Normalize to [-1, 1]
    }
    return float32;
  }

  float32ToBuffer(float32) {
    const buffer = Buffer.alloc(float32.length * 2);
    for (let i = 0; i < float32.length; i++) {
      const int16 = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      buffer.writeInt16LE(int16, i * 2);
    }
    return buffer;
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.initialized = false;
  }
}

module.exports = AECProcessor;
```

**Option B: RNNoise (Alternative)**

RNNoise is a neural network-based noise suppressor that also helps with echo.

```bash
npm install rnnoise-wasm
```

---

### 2. Noise Suppression (NS)

#### Implementation: RNNoise

RNNoise uses a recurrent neural network trained on various noise types.

Create `electron/audio/noise-suppressor.js`:

```javascript
const RNNoise = require('rnnoise-wasm');

class NoiseSuppressor {
  constructor() {
    this.denoiser = null;
    this.initialized = false;
  }

  async initialize() {
    this.denoiser = await RNNoise.create();
    this.initialized = true;
    console.log('Noise suppressor initialized');
  }

  /**
   * Process audio chunk to remove noise
   * @param {Buffer} inputBuffer - Raw audio data (16kHz, mono, 16-bit PCM)
   * @returns {Buffer} Denoised audio
   */
  process(inputBuffer) {
    if (!this.initialized) {
      throw new Error('Noise suppressor not initialized');
    }

    // RNNoise expects 480 samples (30ms at 16kHz)
    const frameSize = 480;
    const numFrames = Math.floor(inputBuffer.length / 2 / frameSize);
    const output = Buffer.alloc(numFrames * frameSize * 2);

    for (let i = 0; i < numFrames; i++) {
      const frameStart = i * frameSize * 2;
      const frameEnd = frameStart + frameSize * 2;
      const frame = inputBuffer.slice(frameStart, frameEnd);

      // Convert to Float32Array
      const floatFrame = new Float32Array(frameSize);
      for (let j = 0; j < frameSize; j++) {
        floatFrame[j] = frame.readInt16LE(j * 2) / 32768.0;
      }

      // Process with RNNoise
      const denoisedFrame = this.denoiser.process(floatFrame);

      // Convert back to Int16
      for (let j = 0; j < frameSize; j++) {
        const sample = Math.max(-32768, Math.min(32767, denoisedFrame[j] * 32768));
        output.writeInt16LE(sample, frameStart + j * 2);
      }
    }

    return output;
  }

  /**
   * Get voice activity probability
   * @returns {number} Probability (0-1)
   */
  getVoiceProbability() {
    return this.denoiser?.getVoiceProbability() || 0;
  }

  destroy() {
    if (this.denoiser) {
      this.denoiser.destroy();
    }
    this.initialized = false;
  }
}

module.exports = NoiseSuppressor;
```

---

### 3. Automatic Gain Control (AGC)

#### Implementation

Create `electron/audio/agc-processor.js`:

```javascript
class AGCProcessor {
  constructor(targetLevel = -20, maxGain = 30, minGain = -10) {
    this.targetLevel = targetLevel;     // Target dBFS
    this.maxGain = maxGain;             // Max gain in dB
    this.minGain = minGain;             // Min gain in dB
    this.currentGain = 0;               // Current gain in dB
    this.smoothingFactor = 0.1;         // Gain smoothing
    this.attackTime = 0.001;            // Attack time in seconds
    this.releaseTime = 0.1;             // Release time in seconds
  }

  /**
   * Process audio chunk with AGC
   * @param {Buffer} inputBuffer - Raw audio data
   * @param {number} sampleRate - Sample rate in Hz
   * @returns {Buffer} Gain-adjusted audio
   */
  process(inputBuffer, sampleRate = 16000) {
    const samples = inputBuffer.length / 2;
    const output = Buffer.alloc(inputBuffer.length);

    // Calculate RMS level
    let sumSquares = 0;
    for (let i = 0; i < samples; i++) {
      const sample = inputBuffer.readInt16LE(i * 2) / 32768.0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / samples);
    const currentLevel = 20 * Math.log10(rms + 1e-10); // dBFS

    // Calculate required gain
    const requiredGain = this.targetLevel - currentLevel;
    const clampedGain = Math.max(this.minGain, Math.min(this.maxGain, requiredGain));

    // Smooth gain changes
    const alpha = this.smoothingFactor;
    this.currentGain = alpha * clampedGain + (1 - alpha) * this.currentGain;

    // Apply gain
    const linearGain = Math.pow(10, this.currentGain / 20);

    for (let i = 0; i < samples; i++) {
      const sample = inputBuffer.readInt16LE(i * 2) / 32768.0;
      const gained = sample * linearGain;
      
      // Soft clipping to prevent distortion
      const clipped = this.softClip(gained);
      
      const int16 = Math.max(-32768, Math.min(32767, clipped * 32768));
      output.writeInt16LE(int16, i * 2);
    }

    return output;
  }

  /**
   * Soft clipping function to prevent harsh distortion
   */
  softClip(x) {
    if (Math.abs(x) < 0.5) {
      return x;
    } else if (Math.abs(x) < 1.0) {
      return Math.sign(x) * (0.5 + 0.5 * Math.tanh(2 * (Math.abs(x) - 0.5)));
    } else {
      return Math.sign(x) * 0.9;
    }
  }

  /**
   * Get current gain in dB
   */
  getCurrentGain() {
    return this.currentGain;
  }

  /**
   * Set target level
   */
  setTargetLevel(level) {
    this.targetLevel = level;
  }
}

module.exports = AGCProcessor;
```

---

### 4. Integrated Audio Pipeline

Update `electron/mic/audioPreprocessor.js`:

```javascript
const AECProcessor = require('../audio/aec-processor');
const NoiseSuppressor = require('../audio/noise-suppressor');
const AGCProcessor = require('../audio/agc-processor');
const QualityMonitor = require('./qualityMonitor');

class AudioPreprocessor {
  constructor() {
    this.aec = new AECProcessor();
    this.noiseSuppressor = new NoiseSuppressor();
    this.agc = new AGCProcessor();
    this.qualityMonitor = new QualityMonitor();
    
    this.speakerBuffer = []; // Buffer for speaker output (for AEC)
    this.initialized = false;
  }

  async initialize(sampleRate = 16000) {
    await this.aec.initialize(sampleRate);
    await this.noiseSuppressor.initialize();
    
    this.initialized = true;
    console.log('Audio preprocessor initialized');
  }

  /**
   * Process audio chunk through full pipeline
   * @param {Buffer} inputBuffer - Raw microphone input
   * @returns {Buffer} Fully processed audio
   */
  process(inputBuffer) {
    if (!this.initialized) {
      throw new Error('Preprocessor not initialized');
    }

    let processed = inputBuffer;

    // 1. Acoustic Echo Cancellation
    const referenceBuffer = this.getSpeakerReference(inputBuffer.length);
    processed = this.aec.process(processed, referenceBuffer);

    // 2. Noise Suppression
    processed = this.noiseSuppressor.process(processed);

    // 3. Automatic Gain Control
    processed = this.agc.process(processed);

    // 4. Quality monitoring
    const quality = this.qualityMonitor.analyze(processed);
    
    return {
      audio: processed,
      quality: quality,
      metadata: {
        aecEnabled: true,
        nsEnabled: true,
        agcEnabled: true,
        currentGain: this.agc.getCurrentGain(),
        voiceProbability: this.noiseSuppressor.getVoiceProbability(),
      },
    };
  }

  /**
   * Add speaker output for echo cancellation
   */
  addSpeakerOutput(buffer) {
    this.speakerBuffer.push(buffer);
    
    // Keep only last 2 seconds
    const maxLength = 16000 * 2 * 2; // 2 seconds at 16kHz, 16-bit
    while (this.getTotalBufferLength() > maxLength) {
      this.speakerBuffer.shift();
    }
  }

  /**
   * Get speaker reference for AEC
   */
  getSpeakerReference(length) {
    const totalLength = this.getTotalBufferLength();
    
    if (totalLength === 0) {
      return Buffer.alloc(length); // Silence
    }

    // Concatenate buffers
    const combined = Buffer.concat(this.speakerBuffer);
    
    // Return last 'length' bytes
    if (combined.length >= length) {
      return combined.slice(combined.length - length);
    } else {
      // Pad with silence if not enough data
      const padded = Buffer.alloc(length);
      combined.copy(padded, length - combined.length);
      return padded;
    }
  }

  getTotalBufferLength() {
    return this.speakerBuffer.reduce((sum, buf) => sum + buf.length, 0);
  }

  destroy() {
    this.aec.destroy();
    this.noiseSuppressor.destroy();
    this.initialized = false;
  }
}

module.exports = AudioPreprocessor;
```

---

### 5. Adaptive VAD Sensitivity

Update `electron/vad/vadManager.js`:

```javascript
class AdaptiveVADManager {
  constructor() {
    this.baseSensitivity = 0.5;
    this.currentSensitivity = 0.5;
    this.noiseLevel = 0;
    this.adaptationRate = 0.1;
    
    // History for adaptation
    this.recentTriggers = [];
    this.maxHistoryLength = 100;
  }

  /**
   * Adapt sensitivity based on environment
   */
  adaptSensitivity(audioQuality) {
    const { snr, noiseLevel } = audioQuality;

    // Adjust sensitivity based on SNR
    if (snr < 10) {
      // Low SNR (noisy environment) - increase threshold
      this.currentSensitivity = Math.min(0.8, this.baseSensitivity + 0.2);
    } else if (snr > 20) {
      // High SNR (quiet environment) - decrease threshold
      this.currentSensitivity = Math.max(0.3, this.baseSensitivity - 0.1);
    } else {
      // Normal SNR - use base sensitivity
      this.currentSensitivity = this.baseSensitivity;
    }

    // Smooth adaptation
    this.currentSensitivity = 
      this.adaptationRate * this.currentSensitivity +
      (1 - this.adaptationRate) * this.currentSensitivity;

    return this.currentSensitivity;
  }

  /**
   * Detect false positives and adjust
   */
  recordTrigger(wasVoice) {
    this.recentTriggers.push(wasVoice);
    
    if (this.recentTriggers.length > this.maxHistoryLength) {
      this.recentTriggers.shift();
    }

    // Calculate false positive rate
    const falsePositives = this.recentTriggers.filter(v => !v).length;
    const falsePositiveRate = falsePositives / this.recentTriggers.length;

    // If too many false positives, increase threshold
    if (falsePositiveRate > 0.1) {
      this.baseSensitivity = Math.min(0.9, this.baseSensitivity + 0.05);
    }
  }

  getSensitivity() {
    return this.currentSensitivity;
  }
}

module.exports = AdaptiveVADManager;
```

---

### 6. Audio Quality Metrics

Update `electron/mic/qualityMonitor.js`:

```javascript
class QualityMonitor {
  /**
   * Analyze audio quality
   * @param {Buffer} audioBuffer
   * @returns {Object} Quality metrics
   */
  analyze(audioBuffer) {
    const samples = this.bufferToFloat32(audioBuffer);

    return {
      snr: this.calculateSNR(samples),
      rms: this.calculateRMS(samples),
      peak: this.calculatePeak(samples),
      crestFactor: this.calculateCrestFactor(samples),
      thd: this.calculateTHD(samples),
      clipping: this.detectClipping(samples),
      silence: this.detectSilence(samples),
    };
  }

  /**
   * Calculate Signal-to-Noise Ratio
   */
  calculateSNR(samples) {
    // Estimate signal power (top 50% of samples)
    const sorted = [...samples].map(Math.abs).sort((a, b) => b - a);
    const signalSamples = sorted.slice(0, Math.floor(sorted.length * 0.5));
    const signalPower = signalSamples.reduce((sum, s) => sum + s * s, 0) / signalSamples.length;

    // Estimate noise power (bottom 50% of samples)
    const noiseSamples = sorted.slice(Math.floor(sorted.length * 0.5));
    const noisePower = noiseSamples.reduce((sum, s) => sum + s * s, 0) / noiseSamples.length;

    // SNR in dB
    return 10 * Math.log10(signalPower / (noisePower + 1e-10));
  }

  /**
   * Calculate RMS (Root Mean Square)
   */
  calculateRMS(samples) {
    const sumSquares = samples.reduce((sum, s) => sum + s * s, 0);
    return Math.sqrt(sumSquares / samples.length);
  }

  /**
   * Calculate peak amplitude
   */
  calculatePeak(samples) {
    return Math.max(...samples.map(Math.abs));
  }

  /**
   * Calculate crest factor (peak/RMS)
   */
  calculateCrestFactor(samples) {
    const peak = this.calculatePeak(samples);
    const rms = this.calculateRMS(samples);
    return peak / (rms + 1e-10);
  }

  /**
   * Calculate Total Harmonic Distortion (simplified)
   */
  calculateTHD(samples) {
    // Simplified THD calculation using FFT
    // In production, use a proper FFT library
    return 0; // Placeholder
  }

  /**
   * Detect clipping
   */
  detectClipping(samples, threshold = 0.95) {
    const clipped = samples.filter(s => Math.abs(s) > threshold).length;
    return clipped / samples.length;
  }

  /**
   * Detect silence
   */
  detectSilence(samples, threshold = 0.01) {
    const rms = this.calculateRMS(samples);
    return rms < threshold;
  }

  bufferToFloat32(buffer) {
    const float32 = new Float32Array(buffer.length / 2);
    for (let i = 0; i < float32.length; i++) {
      float32[i] = buffer.readInt16LE(i * 2) / 32768.0;
    }
    return float32;
  }
}

module.exports = QualityMonitor;
```

---

## Implementation Checklist

### Day 1: AEC Implementation
- [ ] Install WebRTC dependencies
- [ ] Create `aec-processor.js`
- [ ] Implement adaptive filter algorithm
- [ ] Test with echo samples
- [ ] Measure echo reduction (target: >20dB)

### Day 2: Noise Suppression
- [ ] Install RNNoise
- [ ] Create `noise-suppressor.js`
- [ ] Integrate with audio pipeline
- [ ] Test with noisy samples
- [ ] Measure noise reduction (target: >15dB)

### Day 3: AGC & Integration
- [ ] Create `agc-processor.js`
- [ ] Implement soft clipping
- [ ] Integrate all processors in pipeline
- [ ] Test full pipeline
- [ ] Measure latency (target: <50ms)

### Day 4: Adaptive VAD & Quality Metrics
- [ ] Implement adaptive VAD
- [ ] Enhance quality monitor
- [ ] Add SNR, THD calculations
- [ ] Test false positive rate
- [ ] Create quality dashboard

### Day 5: Testing & Optimization
- [ ] Benchmark preprocessing latency
- [ ] Test with various audio conditions
- [ ] Optimize buffer sizes
- [ ] Document audio pipeline
- [ ] Create audio quality guide

---

## Testing & Validation

### Test Audio Samples

Create test suite with:
- Clean speech
- Speech with echo
- Speech with background noise
- Speech with music
- Multiple speakers
- Varying volumes

### Quality Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Echo (dB) | 0 | -20 | >-20 |
| Noise (dB) | 0 | -15 | >-15 |
| Volume variance (dB) | ±10 | ±3 | ±3 |
| SNR (dB) | 10 | 25 | >20 |
| Processing latency (ms) | 0 | 40 | <50 |
| VAD false positive rate | 15% | 3% | <5% |

---

## Success Metrics

- [ ] AEC reducing echo by >20dB
- [ ] NS reducing noise by >15dB
- [ ] AGC maintaining ±3dB levels
- [ ] VAD false positives <5%
- [ ] SNR >20dB
- [ ] Processing latency <50ms
- [ ] Quality dashboard functional
- [ ] Documentation complete

---

**Estimated Effort:** 5 days  
**Complexity:** High  
**Risk:** Medium (audio processing is complex)
