// VAD Manager with Silero VAD and Legacy Fallback
// Stage 5 Task 5.1: Silero VAD with automatic fallback

const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class VadManager extends EventEmitter {
  constructor() {
    super();
    this.primaryVAD = null;
    this.fallbackVAD = null;
    this.currentVAD = null;
    this.useSilero = false; // Feature flag - disabled due to issues in Main process
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
    // Stage 5 Task 5.1: Use VadEngine as the "legacy" / robust VAD
    const VadEngine = require('./vadEngine');

    const vad = new VadEngine();
    await vad.init({
      aggressiveness: 3,
      sampleRate: 16000,
      frameSize: 480 // 30ms
    });
    logger.info('VadEngine initialized successfully within Legacy Wrapper', { context: 'VadManager' });

    // State machine for VAD events
    let isSpeaking = false;
    let speechFrameCount = 0;
    let silenceFrameCount = 0;
    const MIN_SPEECH_FRAMES = 5; // ~150ms
    const MIN_SILENCE_FRAMES = 25; // ~750ms

    // Create a wrapper to match the expected interface and handle events
    const instance = {
      processAudioFrame: async (audio) => {
        // Log entry every 10 frames
        if (speechFrameCount % 10 === 0 || silenceFrameCount % 10 === 0) {
            // logger.debug('VadManager Wrapper: Processing frame', { context: 'VadManager', length: audio.length });
        }
        
        // Pass to engine
        const result = await vad.processAudioFrame(audio);
        const isSpeech = result?.speech;
        
        if (isSpeech) {
          speechFrameCount++;
          silenceFrameCount = 0;
          
          if (!isSpeaking && speechFrameCount >= MIN_SPEECH_FRAMES) {
            isSpeaking = true;
            logger.info('VAD State CHANGE: Speech Started', { context: 'VadManager' });
            this.emit('speech:start');
          }
        } else {
          silenceFrameCount++;
          speechFrameCount = 0;

          if (isSpeaking && silenceFrameCount >= MIN_SILENCE_FRAMES) {
            isSpeaking = false;
            logger.info('VAD State CHANGE: Speech Ended', { context: 'VadManager' });
            this.emit('speech:end');
          }
        }

        // Always emit frame for recording/streaming if needed, 
        // OR only when speaking? 
        // Existing logic in main.js listens to 'audio:frame' and sends it to streamingClient.
        // Usually we send ALL frames if we want VAD to happen on backend too, OR only speech frames.
        // But main.js logic: vadManager.on('audio:frame', (frame) => streamingClient.addAudioFrame(frame));
        // So we should emit every frame.
        this.emit('audio:frame', audio);
      },
      
      startProcessing: () => {
         logger.info('Legacy VAD (VadEngine) started', { context: 'VadManager' });
         isSpeaking = false;
         speechFrameCount = 0;
         silenceFrameCount = 0;
      },
      
      stopProcessing: () => {
         logger.info('Legacy VAD (VadEngine) stopped', { context: 'VadManager' });
         if (isSpeaking) {
           isSpeaking = false;
           this.emit('speech:end');
         }
      },

      setSystemSpeaking: (val) => {
        // Can implement suppression logic here if needed
        this.isSystemSpeaking = val;
      },
      
      destroy: () => vad.cleanup()
    };

    return {
      type: 'legacy',
      instance: instance,
      start: () => instance.startProcessing(),
      pause: () => instance.stopProcessing(),
      destroy: () => instance.destroy()
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

    // Fallback logic - already using reliable engine
    if (this.currentVAD?.type === 'silero') {
       // Switch to legacy if Silero fails
       this.currentVAD = this.fallbackVAD;
    }
  }

  processAudioFrame(audioBuffer) {
    // logger.debug('VadManager.processAudioFrame called', { context: 'VadManager', hasVAD: !!this.currentVAD });
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

  // --- IPC Compatibility Interface ---

  startVAD() {
    return this.startProcessing();
  }

  stopVAD() {
    return this.stopProcessing();
  }

  setSystemSpeaking(isSpeaking) {
    this.isSystemSpeaking = isSpeaking;
    // Delegate to legacy VAD if available as it handles barge-in suppression
    if (this.currentVAD?.type === 'legacy' && this.currentVAD.instance?.setSystemSpeaking) {
      this.currentVAD.instance.setSystemSpeaking(isSpeaking);
    }
  }

  getStatus() {
    return {
      isActive: !!this.currentVAD,
      type: this.getCurrentVADType(),
      failureCount: this.failureCount
    };
  }

  setAggressiveness(level) {
    if (this.currentVAD?.type === 'legacy' && this.currentVAD.instance?.setAggressiveness) {
      this.currentVAD.instance.setAggressiveness(level);
    }
  }

  recalibrate() {
    // Legacy VAD might support this, Silero usually auto-adjusts or is static
    logger.info('VAD recalibrate requested', { context: 'VadManager' });
  }
}

module.exports = VadManager;
