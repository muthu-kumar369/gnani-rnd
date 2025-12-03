// electron/mic/micCapture.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * @class MicCapture
 * @extends EventEmitter
 * @description Manages the microphone capture state in the main process.
 *              This class acts as a state manager for the microphone and signals its status.
 *              Actual audio data streaming is handled by the renderer process via IPC.
 */
class MicCapture extends EventEmitter {
  constructor() {
    super();
    this.isRecording = false;
    // No longer need intervalId as dummy audio generation is removed.
    logger.info('MicCapture initialized.', { context: 'MicCapture' });
  }

  /**
   * Starts the microphone capture state.
   * Emits a 'started' event.
   */
  startMicrophone() {
    if (this.isRecording) {
      logger.warn('Microphone is already recording.', { context: 'MicCapture' });
      return;
    }
    logger.info('Starting microphone capture state.', { context: 'MicCapture' });
    this.isRecording = true;
    this.emit('started');
  }

  /**
   * Stops the microphone capture state.
   * Emits a 'stopped' event.
   */
  stopMicrophone() {
    if (!this.isRecording) {
      logger.warn('Microphone is not recording.', { context: 'MicCapture' });
      return;
    }
    logger.info('Stopping microphone capture state.', { context: 'MicCapture' });
    this.isRecording = false;
    this.emit('stopped');
  }

  /**
   * Returns the current recording status of the microphone.
   * @returns {boolean} True if the microphone is in a recording state, false otherwise.
   */
  getIsRecording() {
    return this.isRecording;
  }
}

module.exports = MicCapture;
