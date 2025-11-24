// electron/stream/client.js
const { EventEmitter } = require('events');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');
const logger = require('../utils/logger');
const ExponentialBackoff = require('./utils/backoff');
const Metrics = require('./utils/metrics');
const { callRefreshTokenApiFromMain } = require('../main'); // Import the function

const PROTO_PATH = path.join(__dirname, '../proto/audio.proto');
const store = new Store();

/**
 * @class StreamingClient
 * @extends EventEmitter
 * @description Manages bi-directional gRPC audio streaming with authentication and token refresh logic.
 */
class StreamingClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      endpoint: options.endpoint || 'localhost:50051', // Default gRPC endpoint
      reconnect: options.reconnect || {},
      mainWindow: options.mainWindow || null, // Reference to the main window for renderer IPC
      ...options,
    };

    this.grpcClient = null;
    this.call = null;
    this.isConnected = false;
    this.isStreamingAudio = false;
    this.currentSessionId = null;
    this.backoff = new ExponentialBackoff(this.options.reconnect);
    this.metrics = new Metrics();
    this.isRefreshingToken = false; // Flag to prevent multiple concurrent token refresh attempts

    this.init();
  }

  /**
   * Initializes the gRPC client by loading the protocol definition.
   */
  init() {
    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      const gnaniProto = grpc.loadPackageDefinition(packageDefinition).gnani;
      this.grpcClient = new gnaniProto.GnaniService(
        this.options.endpoint,
        grpc.credentials.createInsecure() // TODO: Implement secure credentials (e.g., SSL/TLS) for production
      );
      logger.info(`gRPC client initialized for endpoint: ${this.options.endpoint}`, { context: 'StreamingClient' });
    } catch (error) {
      logger.error('Failed to initialize gRPC client:', error, { context: 'StreamingClient' });
      this.emit('stream:error', { message: 'Failed to load gRPC protocol definitions.' });
    }
  }

  /**
   * Establishes a bi-directional gRPC stream to the backend.
   * Attaches the access token for authentication.
   */
  async connect() {
    if (!this.grpcClient) {
      logger.error('gRPC client not initialized. Cannot connect.', { context: 'StreamingClient' });
      return;
    }
    if (this.call) {
      logger.warn('Already connected or connecting.', { context: 'StreamingClient' });
      return;
    }

    const accessToken = store.get('accessToken');
    const refreshToken = store.get('refreshToken'); // Retrieve refresh token
    const metadata = new grpc.Metadata();

    if (!accessToken) {
        logger.warn('No access token found for gRPC connection. Emitting unauthenticated error.', { context: 'StreamingClient' });
        this.emit('stream:error', { message: 'User unauthenticated. Please log in.' });
        // If no access token, prevent connection and inform the UI.
        return;
    }
    
    // Attach the access token as a Bearer token in the Authorization header
    metadata.add('authorization', `Bearer ${accessToken}`);
    logger.info('Attached access token to gRPC metadata.', { context: 'StreamingClient' });

    this.currentSessionId = uuidv4();
    this.call = this.grpcClient.SendAudioStream(metadata);
    this.isConnected = true;
    this.backoff.reset(); // Reset backoff attempts on successful connection attempt
    this.emit('stream:connected', { sessionId: this.currentSessionId });
    logger.info(`gRPC stream connected with Session ID: ${this.currentSessionId}`, { context: 'StreamingClient' });

    this.call.on('data', (response) => {
      // Handle incoming messages from the server (partial STT, LLM chunks, final response, errors)
      if (response.partial_text) {
        this.emit('stream:partial', { text: response.partial_text });
      } else if (response.llm_chunk) {
        this.emit('stream:tts_chunk', { chunk: response.llm_chunk }); // Emit as tts_chunk for LLM response
      } else if (response.final_text) {
        this.emit('stream:final', { text: response.final_text });
      } else if (response.error_message) {
        this.emit('stream:error', { message: response.error_message });
        logger.error(`gRPC stream error from server: ${response.error_message}`, { context: 'StreamingClient' });
      }
    });

    this.call.on('error', async (error) => {
        logger.error(`gRPC stream error: ${error.details || error.message} (Code: ${error.code})`, { context: 'StreamingClient' });
        this.handleDisconnect(); // Always disconnect on any stream error

        // Attempt to refresh token only if it's an unauthenticated error and not already refreshing
        if (error.code === grpc.status.UNAUTHENTICATED && !this.isRefreshingToken) {
            this.isRefreshingToken = true; // Set flag to prevent re-entry
            logger.info('Unauthenticated gRPC error. Attempting to refresh token...', { context: 'StreamingClient' });
            try {
                const newTokens = await this.refreshTokensAndReconnect();
                if (newTokens) {
                    logger.info('Tokens refreshed and reconnected successfully.', { context: 'StreamingClient' });
                    // No explicit re-connect call needed here, the process will re-initiate stream when audio starts
                } else {
                    logger.error('Failed to refresh tokens. Logging out user.', { context: 'StreamingClient' });
                    this.emit('stream:error', { message: 'Session expired. Please log in again.' });
                    // IPC to renderer to force logout via AuthContext
                    if (this.options.mainWindow) {
                        this.options.mainWindow.webContents.send('auth:force-logout');
                    }
                }
            } catch (refreshError) {
                logger.error('Error during token refresh and reconnect:', refreshError, { context: 'StreamingClient' });
                this.emit('stream:error', { message: 'Failed to refresh session. Please log in again.' });
                // IPC to renderer to force logout via AuthContext
                if (this.options.mainWindow) {
                    this.options.mainWindow.webContents.send('auth:force-logout');
                }
            } finally {
                this.isRefreshingToken = false; // Reset flag
            }
        } else if (this.isRefreshingToken) {
            logger.warn('Ignoring gRPC error during token refresh process as it is already ongoing.', { context: 'StreamingClient' });
        } else {
            // For other types of errors (e.g., network, server issues)
            this.emit('stream:error', { message: error.details || 'gRPC stream error' });
        }
    });

    this.call.on('end', () => {
      logger.info('gRPC stream ended by server.', { context: 'StreamingClient' });
      this.handleDisconnect();
    });
  }

  /**
   * Attempts to refresh the access token using the stored refresh token and then reconnects.
   * @returns {Promise<object|null>} New access and refresh tokens if successful, null otherwise.
   */
  async refreshTokensAndReconnect() {
    const refreshToken = store.get('refreshToken');
    if (!refreshToken) {
        logger.error('No refresh token available to refresh access token.', { context: 'StreamingClient' });
        return null;
    }

    try {
        const newTokens = await callRefreshTokenApiFromMain(refreshToken);
        if (newTokens && newTokens.accessToken && newTokens.refreshToken) {
            store.set('accessToken', newTokens.accessToken);
            store.set('refreshToken', newTokens.refreshToken);
            logger.info('New tokens stored after successful refresh.', { context: 'StreamingClient' });
            // The logic in main.js setupStreamIPC will call connect when streaming is started again.
            return newTokens;
        }
        return null;
    } catch (error) {
        logger.error('callRefreshTokenApiFromMain failed:', error, { context: 'StreamingClient' });
        return null;
    }
  }

  async handleDisconnect(forceReconnect = false) {
    logger.info('Handling gRPC stream disconnect.', { context: 'StreamingClient' });
    this.isConnected = false;
    this.isStreamingAudio = false;
    if (this.call) {
      this.call.cancel(); // Cancel the gRPC call
      this.call = null;
    }
    this.emit('stream:disconnected');

    // Only attempt to reconnect if explicitly told to or for transient errors
    if (forceReconnect || this.backoff.shouldRetry()) {
      logger.info('Scheduling gRPC stream reconnect...', { context: 'StreamingClient' });
      this.backoff.retry(() => this._attemptReconnect())
        .then((scheduled) => {
          if (!scheduled) {
            logger.error('Max gRPC reconnect attempts reached. Giving up.', { context: 'StreamingClient' });
            this.emit('stream:error', { code: 'max_reconnect_attempts', message: 'Max reconnect attempts reached for gRPC.' });
          }
        });
    } else {
      logger.info('Not scheduling gRPC stream reconnect.', { context: 'StreamingClient' });
      this.backoff.reset(); // Reset backoff if no retry is scheduled
    }
  }

  async _attemptReconnect() {
    logger.info('Attempting gRPC stream reconnect...', { context: 'StreamingClient' });
    try {
      // Re-initialize gRPC client to ensure fresh state
      this.init();
      // Try to establish a new connection. This will handle authentication again.
      await this.connect();
      if (this.isConnected) {
        logger.info('gRPC stream reconnected successfully.', { context: 'StreamingClient' });
        this.backoff.reset(); // Reset backoff on successful reconnect
        return true; // Indicate successful retry
      }
    } catch (error) {
      logger.error('gRPC stream reconnect attempt failed:', error, { context: 'StreamingClient' });
      return false; // Indicate failed retry
    }
    return false; // Indicate failed retry
  }

  /**
   * Disconnects the gRPC stream gracefully.
   */
  disconnect() {
    logger.info('Disconnecting gRPC stream gracefully.', { context: 'StreamingClient' });
    if (this.call) {
      this.call.end(); // End the stream gracefully
    }
    this.handleDisconnect(false); // Do not force reconnect on explicit disconnect
  }

  /**
   * Adds an audio frame to the stream after applying custom binary framing.
   * @param {Buffer} pcmFrame - Raw 16-bit PCM audio frame.
   * @param {string} currentSegmentId - The current segment ID for the audio frame.
   * @param {boolean} isLast - True if this is the last audio frame of a segment.
   */
  addAudioFrame(pcmFrame, currentSegmentId, isLast = false) {
    if (!this.call || !this.isStreamingAudio) {
      logger.warn('Attempted to send audio frame but gRPC stream is not active. Audio will be dropped.', { context: 'StreamingClient' });
      this.emit('stream:error', { message: 'Audio stream not active. Please start recording.' });
      return;
    }

    try {
      // Add segment_id to the header for multiplexing if needed
      const chunkType = isLast ? 'LAST' : 'CHUNK';
      const header = `${this.currentSessionId}:${currentSegmentId}:${chunkType}`;
      const headerBuffer = Buffer.from(header, 'utf-8');
      
      const headerLengthBuffer = Buffer.alloc(4);
      headerLengthBuffer.writeUInt32BE(headerBuffer.length);
      
      const audioLengthBuffer = Buffer.alloc(4);
      audioLengthBuffer.writeUInt32BE(pcmFrame.length);
      
      const framedChunk = Buffer.concat([headerLengthBuffer, headerBuffer, audioLengthBuffer, pcmFrame]);

      this.call.write({ audio_chunk: framedChunk });
      this.metrics.recordBytesSent(framedChunk.length);
    } catch (error) {
      logger.error('Error framing or sending audio chunk:', error, { context: 'StreamingClient' });
      this.emit('stream:error', { message: 'Failed to send audio data.' });
    }
  }

  /**
   * Starts the audio streaming process.
   */
  startAudioStreaming() {
    if (!this.isConnected) {
      this.connect(); // Attempt to connect if not already connected
    }
    this.isStreamingAudio = true;
    logger.info('Started gRPC audio streaming.', { context: 'StreamingClient' });
  }

  /**
   * Stops the audio streaming process. Sends a final empty frame to signal end of stream.
   */
  stopAudioStreaming() {
    if (this.isStreamingAudio && this.call) { // Check this.call exists before writing
        // Sending a final empty audio frame to signal the end of the stream
        this.addAudioFrame(Buffer.alloc(0), this.currentSegmentId || 'default', true); // Use a default segment ID if none is active
        this.isStreamingAudio = false;
        logger.info('Stopped gRPC audio streaming.', { context: 'StreamingClient' });
    }
  }

  /**
   * Updates the gRPC endpoint configuration and reconnects if necessary.
   * @param {object} cfg - New configuration object.
   */
  setEndpoint(cfg) {
    const oldEndpoint = this.options.endpoint;
    this.options = { ...this.options, ...cfg };
    if (this.isConnected && oldEndpoint !== this.options.endpoint) {
        logger.info(`gRPC endpoint updated to: ${this.options.endpoint}. Forcing reconnect due to endpoint change.`, { context: 'StreamingClient' });
        this.disconnect();
        this.init(); // Re-initialize gRPC client with new endpoint
        this.connect();
    } else {
        logger.info(`gRPC endpoint updated to: ${this.options.endpoint}. No reconnect needed.`, { context: 'StreamingClient' });
    }
  }

  /**
   * Retrieves the current status and metrics of the streaming client.
   * @returns {object} Current status, including connection state, session ID, and metrics.
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isStreamingAudio: this.isStreamingAudio,
      sessionId: this.currentSessionId,
      endpoint: this.options.endpoint,
      clientType: 'grpc',
      metrics: this.metrics.getMetrics(),
    };
  }

  /**
   * Cleans up the streaming client resources.
   */
  cleanup() {
    this.disconnect();
    // Also stop the backoff retry if it's pending
    this.backoff.reset();
    logger.info('gRPC StreamingClient cleaned up and backoff reset.', { context: 'StreamingClient' });
  }
}

module.exports = StreamingClient;
