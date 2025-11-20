// electron/vad/vadEngine.js
const logger = require("../utils/logger");
const WebRTCVadBackend = require("./backend/webrtcVad");
const SileroVadBackend = require("./backend/sileroBridge");

class VadEngine {
  constructor() {
    this.backend = null;
    this.backendName = null;
    this.options = {};
    logger.info("VadEngine initialized.");
  }

  detectBackend() {
    // Attempt to load native WebRTC VAD
    try {
      // In a real app, you'd try to require a native module here
      // For now, we'll just prioritize WebRTCVadBackend (mocked)
      const MockWebRTC = require("./backend/webrtcVad"); // Using the mock
      this.backend = new MockWebRTC();
      this.backendName = "webrtc";
      logger.info("Detected WebRTC VAD backend.");
      return "webrtc";
    } catch (error) {
      logger.warn(
        "WebRTC VAD native module not found or failed to load:",
        error.message
      );
      logger.info("Falling back to Silero VAD backend (mocked).");
      this.backend = new SileroVadBackend();
      this.backendName = "silero";
      return "silero";
    }
  }

  async init(options = {}) {
    this.options = {
      sampleRate: options.sampleRate || 16000,
      frameSize: options.frameSize || 480, // 30ms at 16kHz
      aggressiveness:
        options.aggressiveness || (this.backendName === "webrtc" ? 3 : 0.7),
      ...options
    };

    if (!this.backend) {
      this.detectBackend();
    }

    if (!this.backend) {
      logger.error("No VAD backend could be initialized.");
      return false;
    }

    await this.backend.init(this.options);
    logger.info(`VAD Engine initialized with ${this.backendName} backend.`);
    return true;
  }

  async processAudioFrame(frame) {
    if (!this.backend) {
      logger.warn("VAD Engine not initialized. Cannot process audio frame.");
      return { speech: false };
    }
    return this.backend.process(frame);
  }

  cleanup() {
    if (this.backend) {
      this.backend.cleanup();
      this.backend = null;
    }
    logger.info("VadEngine cleaned up.");
  }

  getBackendName() {
    return this.backendName;
  }

  getOptions() {
    return this.options;
  }
}

module.exports = VadEngine;
