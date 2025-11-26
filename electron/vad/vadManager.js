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
      speechStartThreshold: 3, // Frames of speech needed to start
      speechEndThreshold: 45, // Frames of silence needed to end (increased to ~1.35s for natural pauses)
      hysteresisMargin: 2, // Additional frames needed to change state (prevents flapping)
    };
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

    this.vadEngine
      .processAudioFrame(frame)
      .then(({ speech }) => {
        // Emit frame if we're in speech segment
        if (this.state === "speech_started") {
          this.emit("audio:frame", frame);
        }

        if (speech) {
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

  getStatus() {
    return {
      state: this.state,
      backend: this.vadEngine.getBackendName(),
      config: this.config,
      speechFramesCount: this.speechFramesCount,
      nonSpeechFramesCount: this.nonSpeechFramesCount,
    };
  }

  cleanup() {
    this.vadEngine.cleanup();
    logger.info("VadManager cleaned up.", { context: 'VadManager' });
  }
}

module.exports = VadManager;
