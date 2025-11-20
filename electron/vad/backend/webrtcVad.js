// electron/vad/backend/webrtcVad.js
const logger = require('../../utils/logger');

class WebRTCVadBackend {
  constructor() {
    this.options = {};
    this.speechCounter = 0;
    this.isCurrentlySpeech = false;
    logger.info('WebRTCVAD Backend initialized (mock).');
  }

  init(options) {
    this.options = { ...options };
    logger.info('WebRTCVAD Backend init options:', this.options);
    return true; // Simulate successful initialization
  }

  process(frame) {
    // This is a more realistic mock. It will simulate a block of speech
    // for a certain number of frames, then a block of silence.
    // This allows the VadManager's state machine to work correctly.
    
    this.speechCounter++;

    // Every 20 frames (approx 2 seconds), toggle between speech and silence
    if (this.speechCounter % 20 === 0) {
      this.isCurrentlySpeech = !this.isCurrentlySpeech;
      logger.debug(`WebRTCVAD Mock: Toggling speech state to ${this.isCurrentlySpeech}`);
    }

    if (this.speechCounter > 1000) { // Reset periodically
        this.speechCounter = 0;
    }
    
    return { speech: this.isCurrentlySpeech };
  }

  cleanup() {
    logger.info('WebRTCVAD Backend cleanup (mock).');
  }
}

module.exports = WebRTCVadBackend;
