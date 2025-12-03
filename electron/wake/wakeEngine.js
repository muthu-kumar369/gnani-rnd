// electron/wake/wakeEngine.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class WakeEngine extends EventEmitter {
  constructor() {
    super();
    this.porcupine = null;
    this.isListening = false;
    this.audioBuffer = Buffer.alloc(0); // Buffer for accumulating audio frames
    this.lastDetectionTime = 0; // Timestamp of last detection
    this.cooldownPeriod = 2000; // 2 seconds cooldown between detections
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
        // It simulates detecting the keyword "Hey Gnani" after a certain number of frames have been processed.
        this.frameCount = (this.frameCount || 0) + 1;

        // Approx 3 seconds of audio (30 frames at 100ms/frame)
        // In real implementation, this would analyze the actual audio pattern
        if (this.frameCount > 30) {
          logger.info('Mocked Porcupine detected keyword "Hey Gnani".');
          this.frameCount = 0; // Reset after detection
          return 0; // Returning index 0 for the detected keyword
        }
        return -1; // No keyword detected
      },
      release: () => logger.info('Mocked Porcupine released.'),
      frameLength: 512, // Standard Porcupine frame length (samples)
      sampleRate: 16000, // 16kHz sample rate
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
    this.audioBuffer = Buffer.alloc(0); // Clear buffer on start
    logger.info('Started wake-word detection.');
  }

  stopWakeDetection() {
    if (!this.isListening) {
      return;
    }
    this.isListening = false;
    this.audioBuffer = Buffer.alloc(0); // Clear buffer on stop
    logger.info('Stopped wake-word detection.');
  }

  processAudioFrame(frame) {
    if (!this.isListening || !this.porcupine) {
      return;
    }

    // Add incoming frame to buffer
    this.audioBuffer = Buffer.concat([this.audioBuffer, frame]);

    const requiredBytes = this.porcupine.frameLength * 2; // 16-bit PCM = 2 bytes per sample

    // Process all complete frames in the buffer
    while (this.audioBuffer.length >= requiredBytes) {
      // Extract exactly one frame worth of data
      const frameToProcess = this.audioBuffer.slice(0, requiredBytes);

      // Remove processed frame from buffer
      this.audioBuffer = this.audioBuffer.slice(requiredBytes);

      try {
        const keywordIndex = this.porcupine.process(frameToProcess);
        if (keywordIndex !== -1) {
          // Check cooldown period
          const now = Date.now();
          if (now - this.lastDetectionTime < this.cooldownPeriod) {
            logger.debug(`Wake-word detected but in cooldown period. Ignoring.`);
            continue;
          }

          logger.info(`Wake-word detected with index: ${keywordIndex}`);
          this.lastDetectionTime = now;
          this.emit('wake-word');
        }
      } catch (error) {
        logger.error('Error processing audio frame in Porcupine:', error);
      }
    }

    // Log buffer status periodically (every 100 frames)
    if (this.audioBuffer.length > 0 && Math.random() < 0.01) {
      logger.debug(`Audio buffer size: ${this.audioBuffer.length} bytes (${(this.audioBuffer.length / requiredBytes * 100).toFixed(1)}% of frame)`);
    }
  }

  cleanup() {
    if (this.porcupine) {
      this.porcupine.release();
      this.porcupine = null;
      logger.info('WakeEngine cleaned up.');
    }
    this.audioBuffer = Buffer.alloc(0);
  }
}

module.exports = WakeEngine;
