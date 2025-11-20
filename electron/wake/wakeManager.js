// electron/wake/wakeManager.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const WakeEngine = require('./wakeEngine');

class WakeManager extends EventEmitter {
  constructor() {
    super();
    this.state = 'idle'; // idle, listening_for_keyword, keyword_detected
    this.wakeEngine = new WakeEngine();
    logger.info(`WakeManager initialized with state: ${this.state}`);
  }

  async initialize() {
    await this.wakeEngine.initializePorcupine();
    this.wakeEngine.on('wake-word', () => this.onWakeDetected());
  }

  onStart() {
    if (this.state === 'listening_for_keyword') {
      logger.warn('WakeManager is already listening for keyword.');
      return;
    }
    logger.info('WakeManager: Starting wake word detection.');
    this.setState('listening_for_keyword');
    this.wakeEngine.startWakeDetection();
    this.emit('status-changed', this.state);
  }

  onStop() {
    if (this.state === 'idle') {
      logger.warn('WakeManager is already idle.');
      return;
    }
    logger.info('WakeManager: Stopping wake word detection.');
    this.setState('idle');
    this.wakeEngine.stopWakeDetection();
    this.emit('status-changed', this.state);
  }

  onWakeDetected() {
    logger.info('WakeManager: Keyword detected!');
    this.setState('keyword_detected');
    this.emit('wake-triggered');
    this.emit('status-changed', this.state);
    
    // Automatically reset to listening after a short delay
    setTimeout(() => this.onReset(), 1000); 
  }

  onReset() {
    logger.info('WakeManager: Resetting state to listening_for_keyword.');
    this.setState('listening_for_keyword');
    this.emit('status-changed', this.state);
  }

  processAudioFrame(frame) {
    if (this.state === 'listening_for_keyword') {
      this.wakeEngine.processAudioFrame(frame);
    }
  }

  setState(newState) {
    if (this.state !== newState) {
      logger.info(`WakeManager state changing from ${this.state} to ${newState}`);
      this.state = newState;
    }
  }

  getStatus() {
    return { state: this.state };
  }

  cleanup() {
    this.wakeEngine.cleanup();
    logger.info('WakeManager cleaned up.');
  }
}

module.exports = WakeManager;
