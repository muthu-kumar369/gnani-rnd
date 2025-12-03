// electron/stream/utils/metrics.js
const logger = require('../../utils/logger');
const { EventEmitter } = require('events');

class Metrics extends EventEmitter {
  constructor() {
    super();
    this.reset();
    this.lastReportTime = Date.now();
    this.reportIntervalMs = 5000; // Report every 5 seconds
    logger.info('Metrics initialized.');
  }

  reset() {
    this.bytesSent = 0;
    this.bytesReceived = 0;
    this.segmentsSent = 0;
    this.reconnects = 0;
    this.lastRttMs = 0;
    this.audioFramesProcessed = 0;
    this.transcriptsPartial = 0;
    this.transcriptsFinal = 0;
    this.ttsChunksReceived = 0;
    logger.info('Metrics reset.');
  }

  recordBytesSent(count) {
    this.bytesSent += count;
    this._checkAndReport();
  }

  recordBytesReceived(count) {
    this.bytesReceived += count;
    this._checkAndReport();
  }

  recordSegmentSent() {
    this.segmentsSent++;
    this._checkAndReport();
  }

  recordReconnect() {
    this.reconnects++;
    this._checkAndReport();
  }

  recordRtt(rttMs) {
    this.lastRttMs = rttMs;
    this._checkAndReport();
  }

  recordAudioFrameProcessed() {
    this.audioFramesProcessed++;
  }

  recordTranscriptPartial() {
    this.transcriptsPartial++;
  }

  recordTranscriptFinal() {
    this.transcriptsFinal++;
  }

  recordTtsChunkReceived() {
    this.ttsChunksReceived++;
  }

  _checkAndReport() {
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportIntervalMs) {
      this.report();
      this.lastReportTime = now;
    }
  }

  report() {
    const currentMetrics = {
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      segmentsSent: this.segmentsSent,
      reconnects: this.reconnects,
      lastRttMs: this.lastRttMs,
      audioFramesProcessed: this.audioFramesProcessed,
      transcriptsPartial: this.transcriptsPartial,
      transcriptsFinal: this.transcriptsFinal,
      ttsChunksReceived: this.ttsChunksReceived,
    };
    this.emit('metrics', currentMetrics);
    logger.debug('Metrics reported:', currentMetrics);
    // Optionally reset for interval, or keep accumulating. For now, accumulate.
  }

  getMetrics() {
    return {
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      segmentsSent: this.segmentsSent,
      reconnects: this.reconnects,
      lastRttMs: this.lastRttMs,
      audioFramesProcessed: this.audioFramesProcessed,
      transcriptsPartial: this.transcriptsPartial,
      transcriptsFinal: this.transcriptsFinal,
      ttsChunksReceived: this.ttsChunksReceived,
    };
  }
}

module.exports = Metrics;
