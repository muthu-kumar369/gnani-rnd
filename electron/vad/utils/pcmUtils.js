// electron/vad/utils/pcmUtils.js
const logger = require('../../utils/logger');

// Assumes 16-bit PCM, single channel
const PCM_16_BIT_SIZE = 2;

/**
 * Resamples PCM audio buffer to a target sample rate. (Placeholder for actual resampling logic)
 * @param {Buffer} pcmBuffer 16-bit PCM buffer
 * @param {number} currentSampleRate
 * @param {number} targetSampleRate
 * @returns {Buffer} Resampled 16-bit PCM buffer
 */
function resamplePcm(pcmBuffer, currentSampleRate, targetSampleRate) {
  if (currentSampleRate === targetSampleRate) {
    return pcmBuffer;
  }
  logger.warn(`Resampling from ${currentSampleRate} to ${targetSampleRate} is a placeholder. Returning original buffer.`);
  // TODO: Implement actual resampling using a library like 'audio-resampler' or similar.
  // This is a complex task and outside the immediate scope for a placeholder.
  return pcmBuffer;
}

/**
 * Ensures PCM audio buffer is 16k sample rate. (Placeholder for actual resampling)
 * @param {Buffer} pcmBuffer 16-bit PCM buffer
 * @param {number} currentSampleRate
 * @returns {Buffer} 16k 16-bit PCM buffer
 */
function ensure16k(pcmBuffer, currentSampleRate) {
  return resamplePcm(pcmBuffer, currentSampleRate, 16000);
}

/**
 * Concatenates an array of PCM buffers.
 * @param {Buffer[]} pcmBuffers Array of 16-bit PCM buffers
 * @returns {Buffer} Concatenated 16-bit PCM buffer
 */
function concatPcmBuffers(pcmBuffers) {
  if (!Array.isArray(pcmBuffers) || pcmBuffers.length === 0) {
    return Buffer.alloc(0);
  }
  return Buffer.concat(pcmBuffers);
}

/**
 * Converts a 16-bit PCM buffer to a Float32Array suitable for some VAD libraries.
 * (Placeholder - might not be needed if VAD expects Buffer directly)
 * @param {Buffer} pcmBuffer
 * @returns {Float32Array}
 */
function pcmToFloat32(pcmBuffer) {
  const float32 = new Float32Array(pcmBuffer.length / 2);
  for (let i = 0; i < pcmBuffer.length; i += 2) {
    const int16 = pcmBuffer.readInt16LE(i);
    float32[i / 2] = int16 / 32768.0;
  }
  return float32;
}

/**
 * Calculates the duration of a 16-bit PCM buffer.
 * @param {Buffer} pcmBuffer 16-bit PCM buffer
 * @param {number} sampleRate
 * @returns {number} Duration in milliseconds
 */
function getPcmDurationMs(pcmBuffer, sampleRate) {
  if (!pcmBuffer || pcmBuffer.length === 0 || sampleRate === 0) {
    return 0;
  }
  return (pcmBuffer.length / PCM_16_BIT_SIZE / sampleRate) * 1000;
}


module.exports = {
  resamplePcm,
  ensure16k,
  concatPcmBuffers,
  pcmToFloat32,
  getPcmDurationMs
};
