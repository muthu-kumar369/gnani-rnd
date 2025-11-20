// electron/stream/ttsPlayer.js
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
// In a real scenario, you might require 'node-speaker' for native playback
// const Speaker = require('node-speaker'); 

class TtsPlayer extends EventEmitter {
  constructor() {
    super();
    this.speaker = null; // For native playback fallback
    this.isPlaying = false;
    this.playbackQueue = [];
    logger.info('TtsPlayer initialized.');
  }

  /**
   * Plays a TTS audio chunk.
   * Prefers sending to renderer for Web Audio API playback.
   * Optionally supports native playback as fallback.
   * @param {string} segmentId - The ID of the segment this TTS chunk belongs to.
   * @param {Buffer|string} audioData - Raw PCM bytes (Buffer) or base64 encoded string.
   * @param {number} sampleRate - Sample rate of the audio data.
   * @param {string} format - Audio format (e.g., 'pcm_s16le').
   */
  playTtsChunk(segmentId, audioData, sampleRate, format = 'pcm_s16le') {
    if (!global.mainWindow || !global.mainWindow.webContents) {
      logger.warn('No main window to send TTS audio to. Skipping playback.');
      this.emit('tts:error', { segmentId, message: 'No main window available for playback.' });
      return;
    }

    // Always prefer sending to renderer for Web Audio API playback
    // The renderer will handle buffering and playing multiple chunks
    global.mainWindow.webContents.send('stream:tts_chunk', {
      segment_id: segmentId,
      pcm_base64: Buffer.isBuffer(audioData) ? audioData.toString('base64') : audioData,
      sampleRate: sampleRate,
      format: format,
    });
    logger.debug(`Sent TTS chunk for segment ${segmentId} to renderer.`);
    this.isPlaying = true; // Assume renderer will play it
    this.emit('tts:started', segmentId);

    // --- Native playback fallback (conceptual) ---
    /*
    if (this.speaker && format === 'pcm_s16le') {
      if (!this.speaker.writable) {
        this.speaker = new Speaker({
          channels: 1,          // 1 channel
          sampleRate: sampleRate,
          byteOrder: 16,        // 16-bit
          bitDepth: 'int',      // signed
          endianness: 'LE'      // little-endian
        });
        this.speaker.on('open', () => logger.info('Native speaker opened.'));
        this.speaker.on('close', () => {
          this.isPlaying = false;
          this.emit('tts:ended', segmentId);
          logger.info('Native speaker closed.');
        });
        this.speaker.on('error', (err) => {
          logger.error('Native speaker error:', err);
          this.emit('tts:error', { segmentId, message: err.message });
        });
      }
      this.speaker.write(audioData);
      this.isPlaying = true;
      this.emit('tts:started', segmentId);
    } else if (!this.speaker) {
      logger.debug('Native speaker not enabled or audio format not supported for native playback.');
    }
    */
  }

  stopPlayback() {
    if (global.mainWindow && global.mainWindow.webContents) {
      // Send a signal to the renderer to stop its playback
      global.mainWindow.webContents.send('stream:tts_stop');
      logger.info('Sent TTS stop signal to renderer.');
    }
    // For native playback:
    if (this.speaker && this.speaker.writable) {
      this.speaker.end();
      this.speaker = null;
      logger.info('Native TTS playback stopped.');
    }
    this.isPlaying = false;
    this.playbackQueue = [];
    this.emit('tts:ended', 'all'); // Indicate all playback stopped
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}

module.exports = TtsPlayer;
