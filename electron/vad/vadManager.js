// electron/vad/vadManager.js
const { EventEmitter } = require("events");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const VadEngine = require("./vadEngine");

class VadManager extends EventEmitter {
  constructor() {
    super();
    this.vadEngine = new VadEngine();
    this.state = "idle";
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.segmentId = null;
    this.config = {
      sampleRate: 16000,
      frameSize: 480,
      aggressiveness: 3,
      speechStartThreshold: 5, // Increased from 3 to reduce false positives
      speechEndThreshold: 25, // Increased from 20 to prevent cutting off ends (~750ms)
      hysteresisMargin: 3, // Increased from 2 for more stability
    };

    // Adaptive VAD with noise profiling
    this.noiseProfile = null;
    this.adaptiveThreshold = 0.5; // Default threshold
    this.calibrationSamples = [];
    this.isCalibrated = false;
    this.calibrationFramesNeeded = 100; // 2 seconds at 50fps
    this.energyHistory = [];

    logger.info("VadManager initialized.", { context: 'VadManager' });
  }

  async init() {
    await this.vadEngine.init(this.config);
    logger.info("VadManager initialized with config:", this.config, { context: 'VadManager' });
  }

  processAudioFrame(frame) {
    if (this.state === "idle") {
      return;
    }

    // Perform noise calibration if not yet calibrated
    if (!this.isCalibrated && this.state === "monitoring") {
      this.calibrateNoise(frame);
    }

    this.vadEngine
      .processAudioFrame(frame)
      .then(({ speech }) => {
        // Use adaptive threshold if calibrated
        let isSpeech = speech;
        if (this.isCalibrated && this.energyHistory.length > 0) {
          const currentEnergy = this.calculateEnergy(frame);
          isSpeech = currentEnergy > this.adaptiveThreshold;
        }
        // Emit frame if we're in speech segment
        if (this.state === "speech_started") {
          this.emit("audio:frame", frame);
        }

        // Emit speech frame for barge-in detection (frontend needs this)
        if (this.state === "speech_started" || this.state === "monitoring") {
          this.emit("vad:speech-frame", { speech });
        }

        if (isSpeech) {
          this.nonSpeechFramesCount = 0;
          this.speechFramesCount++;

          // Start speech segment with hysteresis
          if (
            this.state === "monitoring" &&
            this.speechFramesCount >= (this.config.speechStartThreshold + this.config.hysteresisMargin)
          ) {
            this._startSpeechSegment();
          }
        } else {
          this.speechFramesCount = 0;

          // End speech segment with hysteresis
          if (this.state === "speech_started") {
            this.nonSpeechFramesCount++;
            if (this.nonSpeechFramesCount >= (this.config.speechEndThreshold + this.config.hysteresisMargin)) {
              this._endSpeechSegment();
            }
          }
        }

        // Log state transitions for debugging
        if (this.speechFramesCount > 0 || this.nonSpeechFramesCount > 0) {
          logger.debug(
            `VAD state: ${this.state}, speech frames: ${this.speechFramesCount}, non-speech frames: ${this.nonSpeechFramesCount}`,
            { context: 'VadManager' }
          );
        }
      })
      .catch((error) => {
        logger.error("Error processing audio frame with VAD engine:", error, { context: 'VadManager' });
      });
  }

  _startSpeechSegment() {
    this.setState("speech_started");
    this.segmentId = uuidv4();
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0; // Reset after starting
    this.emit("audio:listening", true);
    this.emit("speech:start");
    logger.info(`Speech segment started. ID: ${this.segmentId}`, { context: 'VadManager' });
  }

  _endSpeechSegment() {
    this.setState("monitoring");
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.emit("audio:listening", false);
    this.emit("speech:end");
    logger.info(`Speech segment ended. ID: ${this.segmentId}`, { context: 'VadManager' });
    this.segmentId = null;
  }

  startProcessing() {
    if (this.state !== "idle") {
      logger.warn(`VAD is already active. Current state: ${this.state}.`, { context: 'VadManager' });
      return;
    }
    logger.info("Starting VAD monitoring.", { context: 'VadManager' });
    this.setState("monitoring");
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.emit("vad:status", { state: this.state });
  }

  stopProcessing() {
    if (this.state === "idle") {
      logger.warn("VAD is already stopped.", { context: 'VadManager' });
      return;
    }
    logger.info("Stopping VAD monitoring.", { context: 'VadManager' });
    if (this.state === "speech_started") {
      this._endSpeechSegment();
    }
    this.setState("idle");
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.emit("vad:status", { state: this.state });
  }

  setState(newState) {
    if (this.state !== newState) {
      logger.info(`VADManager state change: ${this.state} -> ${newState}`, { context: 'VadManager' });
      this.state = newState;
    }
  }

  setAggressiveness(level) {
    if (this.vadEngine.getBackendName() === "webrtc") {
      this.config.aggressiveness = Math.max(0, Math.min(3, level));
      if (this.state !== "idle") {
        logger.warn(
          "Changing aggressiveness on the fly. Re-initializing VAD engine.", { context: 'VadManager' }
        );
        this.vadEngine.init(this.config);
      }
      logger.info(`VAD aggressiveness set to: ${this.config.aggressiveness}`, { context: 'VadManager' });
    } else {
      logger.warn("Aggressiveness setting only applies to WebRTC VAD backend.", { context: 'VadManager' });
    }
  }

  /**
   * Update VAD configuration thresholds
   * @param {Object} newConfig - Configuration object with optional properties:
   *   - speechStartThreshold: frames of speech needed to start
   *   - speechEndThreshold: frames of silence needed to end
   *   - hysteresisMargin: additional frames for state change
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    logger.info(`VAD config updated from ${JSON.stringify(oldConfig)} to ${JSON.stringify(this.config)}`, { context: 'VadManager' });
  }

  /**
   * Calibrate noise floor using audio samples
   * Automatically called during first 2 seconds of monitoring
   */
  calibrateNoise(audioFrame) {
    if (this.calibrationSamples.length < this.calibrationFramesNeeded) {
      this.calibrationSamples.push(audioFrame);

      // Log progress every 25 frames (~0.5 seconds)
      if (this.calibrationSamples.length % 25 === 0) {
        logger.debug(`VAD calibration progress: ${this.calibrationSamples.length}/${this.calibrationFramesNeeded}`, { context: 'VadManager' });
      }
      return;
    }

    // Calculate noise floor from calibration samples
    const noiseEnergies = this.calibrationSamples.map(sample => this.calculateEnergy(sample));

    const avgNoise = noiseEnergies.reduce((a, b) => a + b, 0) / noiseEnergies.length;
    const stdNoise = this.calculateStdDev(noiseEnergies, avgNoise);

    // Set adaptive threshold: 3 standard deviations above noise floor
    this.adaptiveThreshold = avgNoise + (3 * stdNoise);
    this.noiseProfile = { avgNoise, stdNoise };
    this.isCalibrated = true;

    logger.info('VAD calibrated successfully', {
      context: 'VadManager',
      avgNoise: avgNoise.toFixed(4),
      stdNoise: stdNoise.toFixed(4),
      threshold: this.adaptiveThreshold.toFixed(4)
    });

    // Emit calibration complete event
    this.emit('vad:calibrated', {
      avgNoise,
      stdNoise,
      threshold: this.adaptiveThreshold
    });
  }

  /**
   * Calculate energy of audio frame
   */
  calculateEnergy(audioFrame) {
    if (!audioFrame || audioFrame.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < audioFrame.length; i += 2) {
      // Convert bytes to 16-bit PCM sample
      const sample = audioFrame.readInt16LE(i);
      sum += sample * sample;
    }

    const energy = Math.sqrt(sum / (audioFrame.length / 2));
    this.energyHistory.push(energy);

    // Keep only last 100 energy values
    if (this.energyHistory.length > 100) {
      this.energyHistory.shift();
    }

    return energy;
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values, mean) {
    if (values.length === 0) return 0;

    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Manually trigger recalibration
   * Useful when environment noise changes
   */
  recalibrate() {
    logger.info('Manual VAD recalibration triggered', { context: 'VadManager' });
    this.isCalibrated = false;
    this.calibrationSamples = [];
    this.energyHistory = [];
    this.adaptiveThreshold = 0.5; // Reset to default
    this.noiseProfile = null;

    this.emit('vad:recalibrating');
  }

  getStatus() {
    return {
      state: this.state,
      backend: this.vadEngine.getBackendName(),
      config: this.config,
      speechFramesCount: this.speechFramesCount,
      nonSpeechFramesCount: this.nonSpeechFramesCount,
      isCalibrated: this.isCalibrated,
      calibrationProgress: this.isCalibrated ? 100 : Math.floor((this.calibrationSamples.length / this.calibrationFramesNeeded) * 100),
      noiseProfile: this.noiseProfile,
      adaptiveThreshold: this.adaptiveThreshold,
    };
  }

  cleanup() {
    this.vadEngine.cleanup();
    logger.info("VadManager cleaned up.", { context: 'VadManager' });
  }
}

module.exports = VadManager;
