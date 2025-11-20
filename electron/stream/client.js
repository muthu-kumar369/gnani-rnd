// electron/stream/client.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const WebSocketClient = require('./wsClient');
const HttpClient = require('./httpClient'); // Fallback client
const fs = require('fs');
const path = require('path');

// Load default config from config.example.json
let defaultConfig = {};
try {
  const configPath = path.join(__dirname, 'config.example.json');
  defaultConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  logger.info('Loaded default streaming config from config.example.json');
} catch (error) {
  logger.error('Failed to load config.example.json for streaming:', error.message);
}


class StreamingClient extends EventEmitter {
  constructor() {
    super();
    this.client = null; // Currently active client (WS or HTTP)
    this.options = { ...defaultConfig };
    this.backendPreferred = this.options.backendPreferred || 'websocket'; // 'websocket' or 'http_fallback'

    logger.info('StreamingClient initialized.');
  }

  /**
   * Initializes the client with provided options.
   * @param {object} options - Configuration options for the streaming client.
   */
  init(options = {}) {
    this.options = { ...this.options, ...options };
    this.backendPreferred = this.options.backendPreferred || 'websocket';

    logger.info(`Initializing StreamingClient with preferred backend: ${this.backendPreferred}`);

    if (this.client) {
      this.client.cleanup();
      this.client = null;
    }

    // Choose client based on preference
    if (this.backendPreferred === 'websocket') {
      this.client = new WebSocketClient(this.options);
      logger.info('Using WebSocketClient.');
    } else {
      this.client = new HttpClient(this.options);
      logger.warn('Using HttpClient (fallback). WebSocket is preferred.');
    }

    // Forward all events from the active client
    this.client.on('stream:connected', (...args) => this.emit('stream:connected', ...args));
    this.client.on('stream:disconnected', (...args) => this.emit('stream:disconnected', ...args));
    this.client.on('stream:partial', (...args) => this.emit('stream:partial', ...args));
    this.client.on('stream:final', (...args) => this.emit('stream:final', ...args));
    this.client.on('stream:tts_chunk', (...args) => this.emit('stream:tts_chunk', ...args));
    this.client.on('stream:error', (...args) => this.emit('stream:error', ...args));
    this.client.on('stream:metrics', (...args) => this.emit('stream:metrics', ...args));
    this.client.on('stream:backpressure', (...args) => this.emit('stream:backpressure', ...args));

    this.metricsInterval = setInterval(() => {
      this.emit('stream:metrics', this.client.metrics.getMetrics());
    }, 5000); // Emit metrics every 5 seconds
  }

  /**
   * Connects the underlying streaming client.
   */
  async connect() {
    if (!this.client) {
      this.init(); // Initialize with default if not already
    }
    await this.client.connect();
  }

  /**
   * Disconnects the underlying streaming client.
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Adds an audio frame to be streamed.
   * @param {Buffer} pcmFrame - Raw 16-bit PCM audio frame.
   * @param {string} segmentId - The ID of the current speech segment.
   */
  addAudioFrame(pcmFrame, segmentId) {
    if (this.client) {
      this.client.addAudioFrame(pcmFrame, segmentId);
    } else {
      logger.warn('StreamingClient not initialized. Cannot add audio frame.');
    }
  }

  /**
   * Starts streaming audio.
   */
  startAudioStreaming() {
    if (this.client) {
      this.client.startAudioStreaming();
    } else {
      logger.warn('StreamingClient not initialized. Cannot start audio streaming.');
    }
  }

  /**
   * Stops streaming audio.
   */
  stopAudioStreaming() {
    if (this.client) {
      this.client.stopAudioStreaming();
    } else {
      logger.warn('StreamingClient not initialized. Cannot stop audio streaming.');
    }
  }

  /**
   * Sets new endpoint configuration.
   * @param {object} cfg - New configuration object.
   */
  setEndpoint(cfg) {
    // Merge new config, then re-initialize client if necessary
    const oldBackendPreferred = this.backendPreferred;
    this.options = { ...this.options, ...cfg };
    this.backendPreferred = this.options.backendPreferred || 'websocket';

    if (!this.client || oldBackendPreferred !== this.backendPreferred) {
      logger.info('Backend preference changed or client not initialized. Re-initializing StreamingClient.');
      this.init(this.options);
      this.connect(); // Reconnect with new client type
    } else {
      this.client.setEndpoint(cfg);
    }
  }

  /**
   * Retrieves current status and metrics.
   * @returns {object}
   */
  getStatus() {
    if (this.client) {
      const clientStatus = this.client.getStatus();
      return {
        ...clientStatus,
        backendPreferred: this.backendPreferred,
        clientType: this.client instanceof WebSocketClient ? 'websocket' : 'http_fallback',
      };
    }
    return {
      isConnected: false,
      isStreamingAudio: false,
      backendPreferred: this.backendPreferred,
      clientType: 'none',
      metrics: {},
    };
  }

  cleanup() {
    this.disconnect();
    if (this.client) {
      this.client.cleanup();
    }
    logger.info('StreamingClient cleaned up.');
  }
}

module.exports = StreamingClient;
