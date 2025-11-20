// electron/vad/vadManager.js
const { EventEmitter } = require("events");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const VadEngine = require("./vadEngine");
const { concatPcmBuffers, getPcmDurationMs } = require("./utils/pcmUtils");

class VadManager extends EventEmitter {
  constructor(micCaptureInstance) {
    super();
    this.micCapture = micCaptureInstance;
    this.vadEngine = new VadEngine();
    this.state = "idle"; // idle, monitoring, speech_started
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    this.segmentId = null;
    this.segmentStartTime = null;

    // Configurable parameters
    this.config = {
      sampleRate: 16000,
      frameSize: 480, // 30ms at 16kHz
      aggressiveness: 3, // For WebRTC VAD
      speechStartThreshold: 3, // N consecutive speech frames to start
      speechEndThreshold: 10 // M consecutive non-speech frames to end (hangover)
    };

    logger.info("VadManager initialized.");
  }

  async init() {
    await this.vadEngine.init(this.config);
    this.micCapture.on("audio-frame", this._processMicFrame.bind(this));
    logger.info("VadManager initialized and subscribed to mic frames.");
  }

  _processMicFrame(frame) {
    // Ensure frame is 16k 16-bit PCM (micCapture is already providing this in our mock)
    // In a real app, you might need pcmUtils.ensure16k(frame, actualMicSampleRate)

    if (this.state === "idle" && !this.micCapture.getIsRecording()) {
      // Don't process if VAD is stopped and mic is off
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
            // If mic is recording and VAD is active (not idle) and speech detected,
            // transition to monitoring
            this.setState("monitoring");
            this.speechFramesCount = 1; // Start counting
          }
        } else {
          // Not speech
          this.speechFramesCount = 0;
          if (this.state === "speech_started") {
            this.nonSpeechFramesCount++;
            if (this.nonSpeechFramesCount >= this.config.speechEndThreshold) {
              this._endSpeechSegment();
            }
          } else if (this.state === "monitoring") {
            // Reset monitoring if non-speech after some initial speech frames
            this.nonSpeechFramesCount++;
            if (
              this.nonSpeechFramesCount >=
              this.config.speechEndThreshold / 2
            ) {
              // Shorter reset for monitoring
              this.setState("idle");
              this.speechBuffer = [];
            }
          }
        }
      })
      .catch((error) => {
        logger.error("Error processing audio frame with VAD engine:", error);
      });
  }

  _startSpeechSegment() {
    this.setState("speech_started");
    this.segmentId = uuidv4();
    this.segmentStartTime = Date.now();
    this.nonSpeechFramesCount = 0; // Reset hangover counter
    this.emit("audio:listening", true); // Notify renderer that speech has started
    logger.info(`Speech segment started. ID: ${this.segmentId}`);
  }

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
        `Speech segment ended. ID: ${this.segmentId}, Duration: ${durationMs}ms`
      );
    } else {
      logger.warn(
        `Speech segment ended but buffer was empty. ID: ${this.segmentId}`
      );
    }

    this.speechBuffer = []; // Clear buffer for next segment
    this.segmentId = null;
    this.segmentStartTime = null;
    this.emit("audio:listening", false); // Notify renderer that speech has ended
    this.emit("audio:ended"); // More specific event for speech end
  }

  startVAD() {
    if (this.state !== "idle") {
      logger.warn("VAD is already active or in a speech segment.");
      return;
    }
    logger.info("Starting VAD monitoring.");
    this.setState("monitoring");
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    // Ensure mic is recording if VAD is started
    if (!this.micCapture.getIsRecording()) {
      this.micCapture.startMicrophone();
    }
  }

  stopVAD() {
    if (this.state === "idle") {
      logger.warn("VAD is already stopped.");
      return;
    }
    logger.info("Stopping VAD monitoring.");
    // If a speech segment is active, complete it before stopping
    if (this.state === "speech_started") {
      this._endSpeechSegment();
    }
    this.setState("idle");
    this.speechBuffer = [];
    this.nonSpeechFramesCount = 0;
    this.speechFramesCount = 0;
    // Optional: stop mic if VAD is the only consumer and no wake-word is active
    // this.micCapture.stopMicrophone();
  }

  setState(newState) {
    if (this.state !== newState) {
      logger.info(`VADManager state change: ${this.state} -> ${newState}`);
      this.state = newState;
      this.emit("vad:status", { state: this.state }); // Notify renderer of state change
    }
  }

  setAggressiveness(level) {
    if (this.vadEngine.getBackendName() === "webrtc") {
      this.config.aggressiveness = Math.max(0, Math.min(3, level));
      // Re-initialize VAD engine with new aggressiveness if already running
      if (this.state !== "idle") {
        logger.warn(
          "Changing aggressiveness on the fly. Re-initializing VAD engine."
        );
        // This might interrupt current speech. For production, consider a more graceful restart.
        this.vadEngine.init(this.config);
      }
      logger.info(`VAD aggressiveness set to: ${this.config.aggressiveness}`);
    } else {
      logger.warn("Aggressiveness setting only applies to WebRTC VAD backend.");
    }
  }

  getStatus() {
    return {
      state: this.state,
      backend: this.vadEngine.getBackendName(),
      config: this.config
    };
  }

  cleanup() {
    this.micCapture.removeListener(
      "audio-frame",
      this._processMicFrame.bind(this)
    );
    this.vadEngine.cleanup();
    logger.info("VadManager cleaned up.");
  }
}

module.exports = VadManager;
