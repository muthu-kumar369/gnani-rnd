// electron/stream/serializer.js
const logger = require('../utils/logger');

/**
 * Serializer for formatting audio stream chunks and control messages.
 * Supports JSON control messages and raw binary audio frames.
 */
class StreamSerializer {
  /**
   * Creates a JSON envelope for starting an audio segment.
   * @param {object} metadata - Contains segment_id, sampleRate, channels, timestamp.
   * @returns {string} JSON string.
   */
  createStartSegmentEnvelope(metadata) {
    const message = {
      type: 'meta',
      event: 'start_segment',
      segment_id: metadata.segment_id,
      session_id: metadata.session_id,
      sampleRate: metadata.sampleRate,
      channels: metadata.channels,
      codec: 'pcm_s16le',
      timestamp: metadata.timestamp,
      partialSequence: metadata.partialSequence || 0, // For split segments
    };
    return JSON.stringify(message);
  }

  /**
   * Creates a JSON envelope for ending an audio segment.
   * @param {object} metadata - Contains segment_id, durationMs.
   * @returns {string} JSON string.
   */
  createEndSegmentEnvelope(metadata) {
    const message = {
      type: 'meta',
      event: 'end_segment',
      segment_id: metadata.segment_id,
      session_id: metadata.session_id,
      durationMs: metadata.durationMs,
    };
    return JSON.stringify(message);
  }

  /**
   * Encodes a control message object into a JSON string or Buffer.
   * @param {object} obj - The control message object.
   * @param {boolean} [asBuffer=false] - Whether to return as a Buffer.
   * @returns {string|Buffer}
   */
  encodeControlMessage(obj, asBuffer = false) {
    const jsonString = JSON.stringify(obj);
    return asBuffer ? Buffer.from(jsonString, 'utf8') : jsonString;
  }

  /**
   * Decodes an incoming message payload (string or Buffer) into a normalized JS object.
   * Handles JSON and potentially binary data if part of a multipart message (not fully implemented here).
   * @param {string|Buffer} payload - The incoming message payload.
   * @returns {object|Buffer|null} Decoded object, raw Buffer for binary, or null if cannot decode.
   */
  decodeIncomingMessage(payload) {
    if (Buffer.isBuffer(payload)) {
      // Attempt to decode as JSON first, if it fails, return as binary
      try {
        const strPayload = payload.toString('utf8');
        return JSON.parse(strPayload);
      } catch (e) {
        // Not a JSON, return raw buffer as it might be TTS audio
        return payload;
      }
    } else if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch (e) {
        logger.warn('Failed to parse incoming string message as JSON:', e.message);
        return { type: 'unknown', raw: payload }; // Return as unknown type
      }
    }
    return null; // Unknown payload type
  }
}

module.exports = StreamSerializer;
