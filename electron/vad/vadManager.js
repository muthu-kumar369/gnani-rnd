// electron/vad/vadManager.js
const { EventEmitter } = require("events");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const VadEngine = require("./vadEngine");
const { concatPcmBuffers, getPcmDurationMs } = require("./utils/pcmUtils");

/**
 * @class VadManager
 * @extends EventEmitter
 * @description Manages Voice Activity Detection (VAD) for audio streams.
 *              Subscribes to microphone audio frames, processes them for speech,
 *              segments speech, and emits events for speech start, end, and audio chunks.
 */
class VadManager extends EventEmitter {
  constructor() {
    super();
    // micCaptureInstance is no longer needed as audio frames are routed directly from main.js
    this.vadEngine = new VadEngine();
    this.state = "idle"; // Possible states: 'idle', 'monitoring', 'speech_started'
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.segmentId = null;
    this.segmentStartTime = null;

    // Configurable parameters
    this.config = {
      sampleRate: 16000,
      frameSize: 480, // 30ms at 16kHz for 16kHz sample rate (16000 * 0.030)
      aggressiveness: 3, // For WebRTC VAD: 0-3, 3 is most aggressive
      speechStartThreshold: 3, // N consecutive speech frames to transition from monitoring to speech_started
      speechEndThreshold: 10 // M consecutive non-speech frames (hangover) to end a speech segment
    };

    logger.info("VadManager initialized.", { context: 'VadManager' });
  }

  /**
   * Initializes the VAD engine.
   */
  async init() {
    await this.vadEngine.init(this.config);
    // Audio frames are now passed directly from main.js, no longer subscribed to micCapture
    logger.info("VadManager initialized.", { context: 'VadManager' });
  }

  /**
   * Processes incoming audio frames from the microphone.
   * @param {Buffer} frame - Raw 16-bit PCM audio frame.
   */
  processAudioFrame(frame) {
    // Only process if VAD is not in 'idle' state
    if (this.state === "idle") {
      return;
    }

    this.vadEngine
      .processAudioFrame(frame)
      .then(({ speech }) => {
        // Always buffer frames if we're in a speech segment or looking for one
        if (this.state !== "idle" || speech) {
          this.speechBuffer.push(frame);
        }

        if (speech) {
          this.nonSpeechFramesCount = 0;
          this.speechFramesCount++;

          if (
            this.state === "monitoring" &&
            this.speechFramesCount >= this.config.speechStartThreshold
          ) {
            this._startSpeechSegment();
          } else if (this.state === "idle") {
            // This case should ideally not be reached if state is strictly idle when mic is off
            this.setState("monitoring");
            this.speechFramesCount = 1; 
          }
        } else {
          // Not speech
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

  /**
   * Initiates a new speech segment.
   */
  _startSpeechSegment() {
    this.setState("speech_started");
    this.segmentId = uuidv4();
    this.segmentStartTime = Date.now();
    this.nonSpeechFramesCount = 0;
    this.emit("audio:listening", true); // Notify renderer that speech has started
    logger.info(`Speech segment started. ID: ${this.segmentId}`, { context: 'VadManager' });
  }

  /**
   * Finalizes the current speech segment and emits the collected audio chunk.
   */
  _endSpeechSegment() {
    this.setState("monitoring"); // Go back to monitoring after speech ends
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;

    if (this.speechBuffer.length > 0) {
      const pcmBuffer = concatPcmBuffers(this.speechBuffer);
      const durationMs = getPcmDurationMs(pcmBuffer, this.config.sampleRate);

      const payload = {
        id: this.segmentId,
        timestamp: new Date(this.segmentStartTime).toISOString(),
        sampleRate: this.config.sampleRate,
        channels: 1,
        pcm: pcmBuffer.toString("base64"), // Base64 encode for IPC
        durationMs: durationMs
      };

      this.emit("audio:chunk", payload); // Emit the complete speech segment
      logger.info(
        `Speech segment ended. ID: ${this.segmentId}, Duration: ${durationMs}ms`, { context: 'VadManager' }
      );
    } else {
      logger.warn(
        `Speech segment ended but buffer was empty. ID: ${this.segmentId}`, { context: 'VadManager' }
      );
    }

    this.speechBuffer = []; // Clear buffer for next segment
    this.segmentId = null;
    this.segmentStartTime = null;
    this.emit("audio:listening", false); // Notify renderer that speech has ended
    this.emit("audio:ended"); // More specific event for speech end
  }

  /**
   * Starts VAD processing, transitioning to 'monitoring' state.
   */
  startProcessing() {
    if (this.state !== "idle") {
      logger.warn(`VAD is already active or in speech segment. Current state: ${this.state}.`, { context: 'VadManager' });
      return;
    }
    logger.info("Starting VAD monitoring.", { context: 'VadManager' });
    this.setState("monitoring");
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.emit("vad:status", { state: this.state }); // Emit initial status
  }

  /**
   * Stops VAD processing, transitioning to 'idle' state.
   */
  stopProcessing() {
    if (this.state === "idle") {
      logger.warn("VAD is already stopped.", { context: 'VadManager' });
      return;
    }
    logger.info("Stopping VAD monitoring.", { context: 'VadManager' });
    if (this.state === "speech_started") {
      this._endSpeechSegment(); // Finalize any ongoing speech segment
    }
    this.setState("idle");
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.emit("vad:status", { state: this.state }); // Emit final status
  }

  /**
   * Updates the internal state of the VadManager.
   * @param {string} newState - The new state to transition to.
   */
  setState(newState) {
    if (this.state !== newState) {
      logger.info(`VADManager state change: ${this.state} -> ${newState}`, { context: 'VadManager' });
      this.state = newState;
    }
  }

  /**
   * Sets the aggressiveness level for the VAD engine (if WebRTC backend is used).
   * @param {number} level - The aggressiveness level (0-3).
   */
  setAggressiveness(level) {
    if (this.vadEngine.getBackendName() === "webrtc") {
      this.config.aggressiveness = Math.max(0, Math.min(3, level));
      // Re-initialize VAD engine with new aggressiveness if already running
      if (this.state !== "idle") {
        logger.warn(
          "Changing aggressiveness on the fly. Re-initializing VAD engine.", { context: 'VadManager' }
        );
        // This might interrupt current speech. For production, consider a more graceful restart.
        this.vadEngine.init(this.config);
      }
      logger.info(`VAD aggressiveness set to: ${this.config.aggressiveness}`, { context: 'VadManager' });
    } else {
      logger.warn("Aggressiveness setting only applies to WebRTC VAD backend.", { context: 'VadManager' });
    }
  }

  /**
   * Returns the current status and configuration of the VadManager.
   * @returns {object} Current VAD state, backend, and configuration.
   */
  getStatus() {
    return {
      state: this.state,
      backend: this.vadEngine.getBackendName(),
      config: this.config
    };
  }

  /**
   * Cleans up the VAD engine.
   */
  cleanup() {
    // micCapture.removeListener is no longer needed as VadManager does not subscribe to micCapture
    this.vadEngine.cleanup();
    logger.info("VadManager cleaned up.", { context: 'VadManager' });
  }
}

module.exports = VadManager;
