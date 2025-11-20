// electron/wake/wakeEngine.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class WakeEngine extends EventEmitter {
  constructor() {
    super();
    this.porcupine = null;
    this.isListening = false;
    logger.info('WakeEngine initialized.');
  }

  async initializePorcupine() {
    logger.info('Initializing Porcupine (mocked)...');
    // This is a placeholder. In a real scenario, you would use:
    // const { Porcupine } = require('@picovoice/porcupine-node');
    // this.porcupine = new Porcupine(accessKey, [keywordPath], [sensitivity]);
    
    // Mocking the porcupine instance
    this.porcupine = {
      process: (frame) => {
        // This is a more predictable mock.
        // It simulates detecting the keyword "Computer" after a certain number of frames have been processed.
        this.frameCount = (this.frameCount || 0) + 1;
        
        // Approx 3 seconds of audio (30 frames at 100ms/frame)
        if (this.frameCount > 30) {
          logger.info('Mocked Porcupine detected keyword "Computer".');
          this.frameCount = 0; // Reset after detection
          return 0; // Returning index 0 for the detected keyword
        }
        return -1; // No keyword detected
      },
      release: () => logger.info('Mocked Porcupine released.'),
      frameLength: 512, // Standard Porcupine frame length
    };

    logger.info('Mocked Porcupine instance created.');
    return this;
  }

  startWakeDetection() {
    if (!this.porcupine) {
      logger.error('Porcupine not initialized. Cannot start wake detection.');
      return;
    }
    if (this.isListening) {
      logger.warn('Wake detection is already active.');
      return;
    }
    this.isListening = true;
    logger.info('Started wake-word detection.');
  }

  stopWakeDetection() {
    if (!this.isListening) {
      // logger.warn('Wake detection is not active.');
      return;
    }
    this.isListening = false;
    logger.info('Stopped wake-word detection.');
  }

  processAudioFrame(frame) {
    if (!this.isListening || !this.porcupine) {
      return;
    }

    // Ensure the frame is the correct length (this is a placeholder)
    // In a real implementation, you'd buffer incoming audio to create frames of porcupine.frameLength
    if (frame.length !== this.porcupine.frameLength * 2) { // 16-bit PCM = 2 bytes per sample
        // This is a simplified check. Real implementation needs robust buffering.
        // logger.warn(`Received audio frame of incorrect size: ${frame.length}`);
        return; 
    }

    try {
      const keywordIndex = this.porcupine.process(frame);
      if (keywordIndex !== -1) {
        logger.info(`Keyword detected with index: ${keywordIndex}`);
        this.emit('wake-word');
      }
    } catch (error) {
      logger.error('Error processing audio frame in Porcupine:', error);
    }
  }

  cleanup() {
    if (this.porcupine) {
      this.porcupine.release();
      this.porcupine = null;
      logger.info('WakeEngine cleaned up.');
    }
  }
}

module.exports = WakeEngine;
