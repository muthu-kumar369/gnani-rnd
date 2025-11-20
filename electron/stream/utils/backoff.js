// electron/stream/utils/backoff.js
const logger = require('../../utils/logger');

/**
 * Implements exponential backoff with jitter.
 */
class ExponentialBackoff {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 10;
    this.baseMs = options.baseMs || 500; // Base delay in milliseconds
    this.maxMs = options.maxMs || 60000; // Maximum delay in milliseconds (1 minute)
    this.factor = options.factor || 2; // Factor to multiply by each retry
    this.jitter = options.jitter || 0.1; // Random jitter percentage
    this.retries = 0;
    this.timeoutId = null;
    logger.info('ExponentialBackoff initialized.', { options });
  }

  /**
   * Calculates the next delay and increments retry count.
   * @returns {number} Delay in milliseconds.
   */
  get nextDelay() {
    if (this.retries >= this.maxRetries) {
      return -1; // Indicate no more retries
    }

    let delay = this.baseMs * Math.pow(this.factor, this.retries);
    delay = Math.min(delay, this.maxMs); // Cap at maxMs

    // Apply jitter
    const randomFactor = 1 - this.jitter + Math.random() * this.jitter * 2; // Between (1-jitter) and (1+jitter)
    delay = Math.round(delay * randomFactor);

    logger.debug(`Backoff: Retry ${this.retries + 1}, calculated delay: ${delay}ms`);
    return delay;
  }

  /**
   * Schedules a retry.
   * @param {Function} callback The function to call after the delay.
   * @returns {Promise<boolean>} Resolves true if scheduled, false if max retries reached.
   */
  async retry(callback) {
    const delay = this.nextDelay;
    if (delay === -1) {
      logger.warn('Backoff: Max retries reached.');
      return false;
    }

    this.retries++;
    logger.info(`Backoff: Waiting for ${delay}ms before next retry. Attempt ${this.retries}/${this.maxRetries}`);
    await new Promise(resolve => {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        resolve();
      }, delay);
    });
    callback();
    return true;
  }

  /**
   * Resets the retry count.
   */
  reset() {
    this.retries = 0;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    logger.info('Backoff: Reset retry count.');
  }

  /**
   * Returns current retry attempt.
   * @returns {number}
   */
  get attempt() {
    return this.retries;
  }
}

module.exports = ExponentialBackoff;
