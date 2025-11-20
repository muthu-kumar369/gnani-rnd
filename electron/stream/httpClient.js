// electron/stream/httpClient.js
const { EventEmitter } = require("events");
const logger = require("../utils/logger");
const ExponentialBackoff = require("./utils/backoff");
const Metrics = require("./utils/metrics");
const StreamSerializer = require("./serializer");

/**
 * HTTP Client for streaming audio as a fallback.
 * This implementation will be a placeholder, as the prompt prioritizes WebSocket.
 * A real implementation would involve chunked POST requests or WebTransport/HTTP/2.
 */
class HttpClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      endpoint: options.endpoint || "http://localhost:3000/stream",
      apiKey: options.apiKey || "",
      chunkMs: options.chunkMs || 200,
      sampleRate: options.sampleRate || 16000,
      reconnect: options.reconnect || {},
      ...options
    };

    this.isConnected = false; // Represents if a streaming session is active
    this.backoff = new ExponentialBackoff(this.options.reconnect);
    this.metrics = new Metrics();
    this.serializer = new StreamSerializer();
    this.audioQueue = [];
    this.audioQueueSize = 0;
    this.currentSessionId = null;
    this.currentSegmentId = null;
    this.isStreamingAudio = false;
    this.controller = null; // AbortController for fetch requests

    logger.info("HttpClient initialized (placeholder).", this.options);
  }

  /**
   * Connects/initializes the HTTP streaming.
   */
  async connect() {
    logger.info(
      `Attempting to initiate HTTP streaming to ${this.options.endpoint}...`
    );
    this.isConnected = true; // Simulate connection for HTTP
    this.backoff.reset();
    this.currentSessionId = uuidv4();
    this.emit("stream:connected", { sessionId: this.currentSessionId });
    logger.warn(
      "HttpClient: This is a placeholder. Actual HTTP streaming implementation is omitted."
    );
    return Promise.resolve();
  }

  /**
   * Sends audio frames via HTTP. This is a simplified mock.
   * In a real scenario, it would buffer and send chunked requests.
   * @param {Buffer} pcmFrame - Raw 16-bit PCM audio frame.
   * @param {string} segmentId - The ID of the current speech segment.
   */
  addAudioFrame(pcmFrame, segmentId) {
    if (!this.isConnected || !this.isStreamingAudio) {
      return;
    }

    if (this.currentSegmentId !== segmentId) {
      this._sendStartSegment(segmentId);
      this.currentSegmentId = segmentId;
      this.audioQueue = [];
    }
    this.audioQueue.push(pcmFrame);
    this.audioQueueSize += pcmFrame.length;

    // Simulate sending a chunk after a certain buffer size or time
    if (
      this.audioQueueSize >=
      this.options.sampleRate * 2 * (this.options.chunkMs / 1000)
    ) {
      this._sendChunk();
    }
  }

  _sendStartSegment(segmentId) {
    logger.debug(`HttpClient: Mock send start_segment for ${segmentId}`);
    // A real implementation would send a metadata header via multipart or a dedicated initial request
  }

  _sendChunk() {
    if (this.audioQueue.length === 0) return;

    const combinedBuffer = Buffer.concat(this.audioQueue);
    this.audioQueue = [];
    this.audioQueueSize = 0;

    logger.debug(
      `HttpClient: Mock sending ${combinedBuffer.length} bytes for segment ${this.currentSegmentId}`
    );
    this.metrics.recordBytesSent(combinedBuffer.length);
    this.metrics.recordSegmentSent();

    // Simulate receiving a response
    setTimeout(() => {
      this.metrics.recordBytesReceived(100); // Simulate some response bytes
      this.emit("stream:partial", {
        segment_id: this.currentSegmentId,
        text: "mock partial response"
      });
      if (Math.random() > 0.8) {
        // Simulate final occasionally
        this.emit("stream:final", {
          segment_id: this.currentSegmentId,
          text: "mock final response."
        });
      }
    }, 100 + Math.random() * 500);
  }

  startAudioStreaming() {
    if (!this.isConnected) {
      this.connect();
    }
    this.isStreamingAudio = true;
    logger.info("HttpClient: Started mock audio streaming.");
  }

  stopAudioStreaming() {
    this.isStreamingAudio = false;
    if (this.audioQueue.length > 0) {
      this._sendChunk(); // Send any remaining audio
    }
    logger.info("HttpClient: Stopped mock audio streaming.");
  }

  disconnect() {
    logger.info("HttpClient: Disconnecting mock HTTP client.");
    this.isConnected = false;
    this.isStreamingAudio = false;
    this.emit("stream:disconnected");
    if (this.controller) {
      this.controller.abort();
    }
    this.backoff.reset();
  }

  setEndpoint(cfg) {
    this.options = { ...this.options, ...cfg };
    logger.info("HttpClient: Endpoint configuration updated (mock).");
    this.disconnect();
    this.connect();
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isStreamingAudio: this.isStreamingAudio,
      sessionId: this.currentSessionId,
      segmentId: this.currentSegmentId,
      metrics: this.metrics.getMetrics(),
      backend: "http_mock"
    };
  }

  cleanup() {
    this.disconnect();
    logger.info("HttpClient cleaned up (mock).");
  }
}

module.exports = HttpClient;
