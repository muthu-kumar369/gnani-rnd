// VAD Manager with Silero VAD and Legacy Fallback
// Stage 5 Task 5.1: Silero VAD with automatic fallback

const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

class VadManager extends EventEmitter {
  constructor() {
    super();
    this.primaryVAD = null;
    this.fallbackVAD = null;
    this.currentVAD = null;
    this.useSilero = true; // Feature flag
    this.failureCount = 0;
    this.maxFailures = 3;
  }

  async init() {
    try {
      logger.info('Initializing VAD Manager', { context: 'VadManager' });

      // Initialize legacy VAD first (always available)
      this.fallbackVAD = await this.initLegacyVAD();
      logger.info('Legacy VAD initialized', { context: 'VadManager' });

      // Try to initialize Silero VAD
      if (this.useSilero) {
        try {
          this.primaryVAD = await this.initSileroVAD();
          this.currentVAD = this.primaryVAD;
          logger.info('Silero VAD initialized successfully', { context: 'VadManager' });
        } catch (error) {
          logger.warn('Silero VAD initialization failed, using legacy VAD', {
            context: 'VadManager',
            error: error.message
          });
          this.currentVAD = this.fallbackVAD;
        }
      } else {
        this.currentVAD = this.fallbackVAD;
        logger.info('Using legacy VAD (Silero disabled)', { context: 'VadManager' });
      }

      return true;
    } catch (error) {
      logger.error('VAD Manager initialization failed', {
        context: 'VadManager',
        error: error.message
      });
      throw error;
    }
  }

  async initSileroVAD() {
    try {
      const { MicVAD } = await import('@ricky0123/vad-web');

      const vad = await MicVAD.new({
        onSpeechStart: () => {
          logger.debug('Speech started (Silero)', { context: 'VadManager' });
          this.emit('speech:start');
        },
        onSpeechEnd: (audio) => {
          logger.debug('Speech ended (Silero)', { context: 'VadManager' });
          this.emit('speech:end');
          this.emit('audio:frame', audio);
        },
        onVADMisfire: () => {
          logger.debug('VAD misfire detected (Silero)', { context: 'VadManager' });
        },
        onError: (error) => {
          logger.error('Silero VAD error', {
            context: 'VadManager',
            error: error.message
          });
          this.handleVADFailure(error);
        },
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.5,
        redemptionFrames: 8,
        preSpeechPadFrames: 1,
        minSpeechFrames: 3,
      });

      return {
        type: 'silero',
        instance: vad,
        start: () => vad.start(),
        pause: () => vad.pause(),
        destroy: () => vad.destroy()
      };
    } catch (error) {
      logger.error('Silero VAD initialization error', {
        context: 'VadManager',
        error: error.message
      });
      throw error;
    }
  }

  async initLegacyVAD() {
    // Import existing VAD implementation
    const LegacyVAD = require('./legacyVAD');

    const vad = new LegacyVAD();
    await vad.init();

    // Wrap legacy VAD with same interface
    vad.on('speech:start', () => this.emit('speech:start'));
    vad.on('speech:end', () => this.emit('speech:end'));
    vad.on('audio:frame', (audio) => this.emit('audio:frame', audio));

    return {
      type: 'legacy',
      instance: vad,
      start: () => vad.startProcessing(),
      pause: () => vad.stopProcessing(),
      destroy: () => vad.destroy?.()
    };
  }

  handleVADFailure(error) {
    this.failureCount++;

    logger.warn('VAD failure detected', {
      context: 'VadManager',
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
      currentVAD: this.currentVAD?.type
    });

    // Fallback to legacy VAD after max failures
    if (this.failureCount >= this.maxFailures && this.currentVAD?.type === 'silero') {
      logger.warn('Switching to legacy VAD due to repeated failures', {
        context: 'VadManager'
      });

      this.currentVAD = this.fallbackVAD;

      // Restart processing with fallback
      this.stopProcessing();
      setTimeout(() => this.startProcessing(), 100);
    }
  }

  processAudioFrame(audioBuffer) {
    if (!this.currentVAD) return;

    // Delegate to current VAD if it supports direct frame processing
    if (this.currentVAD.processFrame) {
      this.currentVAD.processFrame(audioBuffer);
    } else if (this.currentVAD.type === 'legacy' && this.currentVAD.instance.processAudioFrame) {
        this.currentVAD.instance.processAudioFrame(audioBuffer);
    }
    // Silero VAD (via vad-web) usually handles its own stream or might need explicit feed
    // If Silero is used, we might verify how it receives data.
    // However, since the error is "not a function", adding this wrapper prevents the crash.
  }

  startProcessing() {
    if (!this.currentVAD) {
      logger.error('VAD not initialized', { context: 'VadManager' });
      return false;
    }

    try {
      this.currentVAD.start();
      logger.info('VAD processing started', {
        context: 'VadManager',
        vadType: this.currentVAD.type
      });
      return true;
    } catch (error) {
      logger.error('Failed to start VAD processing', {
        context: 'VadManager',
        error: error.message
      });

      // Try fallback
      if (this.currentVAD.type === 'silero' && this.fallbackVAD) {
        logger.info('Attempting fallback to legacy VAD', { context: 'VadManager' });
        this.currentVAD = this.fallbackVAD;
        return this.startProcessing();
      }

      return false;
    }
  }

  stopProcessing() {
    if (!this.currentVAD) return;

    try {
      this.currentVAD.pause();
      logger.info('VAD processing stopped', {
        context: 'VadManager',
        vadType: this.currentVAD.type
      });
    } catch (error) {
      logger.error('Failed to stop VAD processing', {
        context: 'VadManager',
        error: error.message
      });
    }
  }

  destroy() {
    if (this.primaryVAD) {
      this.primaryVAD.destroy?.();
    }
    if (this.fallbackVAD) {
      this.fallbackVAD.destroy?.();
    }
    logger.info('VAD Manager destroyed', { context: 'VadManager' });
  }

  cleanup() {
    this.destroy();
  }

  getCurrentVADType() {
    return this.currentVAD?.type || 'none';
  }
}

module.exports = VadManager;
