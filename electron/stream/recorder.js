// electron/stream/recorder.js
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { app } = require('electron');
const logger = require('../utils/logger');

/**
 * Recorder for optional local buffering and saving of conversation segments.
 */
class Recorder extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      outputPath: options.outputPath || (app ? app.getPath('userData') : process.cwd()), // Default to app user data folder or current working directory
      enabled: options.enabled || false,
      maxFiles: options.maxFiles || 10, // Max number of recording files
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB per file
      ...options
    };

    this.currentRecording = {
      id: null,
      filePath: null,
      stream: null,
      size: 0,
      segmentCount: 0,
    };

    if (this.options.enabled) {
      this._ensureOutputPath();
      logger.info(`Recorder enabled. Output path: ${this.options.outputPath}`);
    } else {
      logger.info('Recorder disabled.');
    }
  }

  _ensureOutputPath() {
    if (!fs.existsSync(this.options.outputPath)) {
      fs.mkdirSync(this.options.outputPath, { recursive: true });
    }
  }

  /**
   * Starts a new recording session.
   */
  startRecording() {
    if (!this.options.enabled) {
      logger.debug('Recorder is disabled. Not starting recording.');
      return;
    }
    if (this.currentRecording.stream) {
      logger.warn('A recording is already in progress. Stopping previous recording.');
      this.stopRecording();
    }

    this._ensureOutputPath();
    this.currentRecording.id = uuidv4();
    this.currentRecording.filePath = path.join(this.options.outputPath, `${this.currentRecording.id}.jsonl`);
    this.currentRecording.stream = fs.createWriteStream(this.currentRecording.filePath, { flags: 'a' });
    this.currentRecording.size = 0;
    this.currentRecording.segmentCount = 0;

    logger.info(`Started new recording session: ${this.currentRecording.id}`);
  }

  /**
   * Stops the current recording session.
   */
  stopRecording() {
    if (this.currentRecording.stream) {
      this.currentRecording.stream.end();
      this.currentRecording.stream = null;
      logger.info(`Stopped recording session: ${this.currentRecording.id}`);
      this.currentRecording.id = null;
      this.currentRecording.filePath = null;
    }
  }

  /**
   * Records a data event (e.g., audio chunk, transcript, TTS chunk).
   * @param {string} eventType - Type of the event (e.g., 'audio:chunk', 'stream:partial').
   * @param {object} payload - The event payload.
   */
  recordEvent(eventType, payload) {
    if (!this.options.enabled || !this.currentRecording.stream) {
      return;
    }

    const record = {
      timestamp: new Date().toISOString(),
      eventType: eventType,
      payload: payload,
    };

    // For audio chunks, convert PCM buffer to base64 to save in JSONL
    if (eventType === 'audio:chunk' && payload && payload.pcm instanceof Buffer) {
      record.payload.pcm = payload.pcm.toString('base64');
    } else if (eventType === 'stream:tts_chunk' && payload && payload.audio instanceof Buffer) {
      record.payload.audio = payload.audio.toString('base64');
    }

    const line = JSON.stringify(record) + '\n';
    this.currentRecording.stream.write(line);
    this.currentRecording.size += Buffer.byteLength(line, 'utf8');
    this.currentRecording.segmentCount++;

    if (this.currentRecording.size > this.options.maxFileSize) {
      logger.warn(`Recording file ${this.currentRecording.filePath} exceeded max size. Starting new file.`);
      this.stopRecording();
      this.startRecording();
    }
  }

  /**
   * Cleans up old recording files based on maxFiles.
   */
  async cleanOldRecordings() {
    if (!this.options.enabled) {
      return;
    }
    this._ensureOutputPath();
    try {
      const files = await fs.promises.readdir(this.options.outputPath);
      const jsonlFiles = files
        .filter(file => file.endsWith('.jsonl'))
        .map(file => ({
          name: file,
          path: path.join(this.options.outputPath, file),
          mtime: fs.statSync(path.join(this.options.outputPath, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by newest first

      while (jsonlFiles.length > this.options.maxFiles) {
        const oldestFile = jsonlFiles.pop();
        await fs.promises.unlink(oldestFile.path);
        logger.info(`Deleted old recording file: ${oldestFile.name}`);
      }
    } catch (error) {
      logger.error('Error cleaning old recordings:', error);
    }
  }

  cleanup() {
    this.stopRecording();
    this.cleanOldRecordings(); // Clean up on shutdown
    logger.info('Recorder cleaned up.');
  }

  getStatus() {
    return {
      enabled: this.options.enabled,
      isRecording: !!this.currentRecording.stream,
      currentFile: this.currentRecording.filePath,
      currentFileSize: this.currentRecording.size,
      currentSegmentCount: this.currentRecording.segmentCount,
    };
  }
}

module.exports = Recorder;