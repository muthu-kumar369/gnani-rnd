// electron/wake/wakeManager.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const WakeEngine = require('./wakeEngine');

/**
 * @class WakeManager
 * @extends EventEmitter
 * @description Manages the lifecycle and state of the wake word detection engine.
 *              It initializes Porcupine, processes audio frames, and emits events
 *              when a wake word is detected or its status changes.
 */
class WakeManager extends EventEmitter {
  constructor() {
    super();
    this.state = 'idle'; // Possible states: 'idle', 'listening_for_keyword', 'keyword_detected'
    this.wakeEngine = new WakeEngine();
    logger.info(`WakeManager initialized with state: ${this.state}`, { context: 'WakeManager' });
  }

  /**
   * Initializes the Porcupine wake word engine and sets up event listeners.
   */
  async initialize() {
    await this.wakeEngine.initializePorcupine();
    this.wakeEngine.on('wake-word', () => this.onWakeDetected());
    logger.info('WakeManager: Porcupine engine initialized and listener set up.', { context: 'WakeManager' });
  }

  /**
   * Starts the wake word detection process.
   * Transitions state to 'listening_for_keyword'.
   */
  startProcessing() {
    if (this.state === 'listening_for_keyword') {
      logger.warn('WakeManager is already listening for keyword. Skipping startProcessing.', { context: 'WakeManager' });
      return;
    }
    logger.info('WakeManager: Starting wake word detection.', { context: 'WakeManager' });
    this.setState('listening_for_keyword');
    this.wakeEngine.startWakeDetection();
    this.emit('status-changed', { state: this.state });
  }

  /**
   * Stops the wake word detection process.
   * Transitions state to 'idle'.
   */
  stopProcessing() {
    if (this.state === 'idle') {
      logger.warn('WakeManager is already idle. Skipping stopProcessing.', { context: 'WakeManager' });
      return;
    }
    logger.info('WakeManager: Stopping wake word detection.', { context: 'WakeManager' });
    this.setState('idle');
    this.wakeEngine.stopWakeDetection();
    this.emit('status-changed', { state: this.state });
  }

  /**
   * Handler for when a wake word is detected by the engine.
   * Emits a 'wake-triggered' event and transitions state to 'keyword_detected'.
   */
  onWakeDetected() {
    logger.info('WakeManager: Keyword detected!', { context: 'WakeManager' });
    this.setState('keyword_detected');
    this.emit('wake-triggered');
    this.emit('status-changed', { state: this.state });
    
    // Automatically reset to listening after a short delay
    setTimeout(() => this.onReset(), 1000); 
  }

  /**
   * Resets the wake word manager state back to 'listening_for_keyword' after a trigger.
   */
  onReset() {
    logger.info('WakeManager: Resetting state to listening_for_keyword.', { context: 'WakeManager' });
    this.setState('listening_for_keyword');
    this.emit('status-changed', { state: this.state });
  }

  /**
   * Processes a raw audio frame for wake word detection.
   * @param {Buffer} frame - The raw audio frame (16-bit PCM).
   */
  processAudioFrame(frame) {
    if (this.state === 'listening_for_keyword') {
      this.wakeEngine.processAudioFrame(frame);
    }
  }

  /**
   * Updates the internal state of the WakeManager and logs the transition.
   * @param {string} newState - The new state to transition to.
   */
  setState(newState) {
    if (this.state !== newState) {
      logger.info(`WakeManager state changing from ${this.state} to ${newState}`, { context: 'WakeManager' });
      this.state = newState;
    }
  }

  /**
   * Returns the current status of the WakeManager.
   * @returns {{state: string}} The current state of the WakeManager.
   */
  getStatus() {
    return { state: this.state };
  }

  /**
   * Cleans up the wake word engine resources.
   */
  cleanup() {
    this.wakeEngine.cleanup();
    logger.info('WakeManager cleaned up.', { context: 'WakeManager' });
  }
}

module.exports = WakeManager;
