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
      speechStartThreshold: 3,
      speechEndThreshold: 10,
    };
    logger.info("VadManager initialized.", { context: 'VadManager' });
  }

  async init() {
    await this.vadEngine.init(this.config);
    logger.info("VadManager initialized.", { context: 'VadManager' });
  }

  processAudioFrame(frame) {
    if (this.state === "idle") {
      return;
    }

    this.vadEngine
      .processAudioFrame(frame)
      .then(({ speech }) => {
        if (this.state === "speech_started") {
          this.emit("audio:frame", frame);
        }

        if (speech) {
          this.nonSpeechFramesCount = 0;
          this.speechFramesCount++;
          if (
            this.state === "monitoring" &&
            this.speechFramesCount >= this.config.speechStartThreshold
          ) {
            this._startSpeechSegment();
          }
        } else {
          this.speechFramesCount = 0;
          if (this.state === "speech_started") {
            this.nonSpeechFramesCount++;
            if (this.nonSpeechFramesCount >= this.config.speechEndThreshold) {
              this._endSpeechSegment();
            }
          }
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

  getStatus() {
    return {
      state: this.state,
      backend: this.vadEngine.getBackendName(),
      config: this.config,
    };
  }

  cleanup() {
    this.vadEngine.cleanup();
    logger.info("VadManager cleaned up.", { context: 'VadManager' });
  }
}

module.exports = VadManager;
