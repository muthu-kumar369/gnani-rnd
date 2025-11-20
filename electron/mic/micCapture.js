// electron/mic/micCapture.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class MicCapture extends EventEmitter {
  constructor() {
    super();
    this.isRecording = false;
    this.intervalId = null;
    this.wakeManager = null; // To be set from main.js
    logger.info('MicCapture initialized.');
  }

  startMicrophone() {
    if (this.isRecording) {
      logger.warn('Microphone is already recording.');
      return;
    }
    logger.info('Starting microphone capture (placeholder).');
    this.isRecording = true;

    // Simulate audio frames for Porcupine
    this.intervalId = setInterval(() => {
      if (this.isRecording) {
        // Dummy 16-bit PCM audio frame (512 samples * 2 bytes/sample)
        const dummyFrame = Buffer.alloc(1024, 0); 
        
        // Emit for general purpose audio processing (non-destructive tap)
        this.emit('audio-frame', dummyFrame); 

        // Pipe to wake word engine if it's attached
        if (this.wakeManager) {
          this.wakeManager.processAudioFrame(dummyFrame);
        }
      }
    }, 100); // This interval isn't realistic for real-time audio, but it's fine for a mock.

    this.emit('started');
  }

  stopMicrophone() {
    if (!this.isRecording) {
      logger.warn('Microphone is not recording.');
      return;
    }
    logger.info('Stopping microphone capture (placeholder).');
    this.isRecording = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emit('stopped');
  }

  getIsRecording() {
    return this.isRecording;
  }
}

module.exports = MicCapture;
