// electron/utils/logger.js
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

// Define the absolute path for the log directory
// Assuming this module is in 'electron/utils', and logs are in 'gnani-rnd/logs'
const logDirectory = path.join(__dirname, '..', '..', 'logs');

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
  try {
    fs.mkdirSync(logDirectory, { recursive: true });
    console.log(`[LoggerSetup] Successfully created log directory: ${logDirectory}`);
  } catch (err) {
    console.error(`[LoggerSetup] Failed to create log directory at ${logDirectory}: ${err.message}`);
    // Fallback if directory creation fails
    log.transports.file.file = path.join(require('os').tmpdir(), 'gnani-log-fallback.log');
    console.log(`[LoggerSetup] Falling back to temporary log file: ${log.transports.file.file}`);
  }
} else {
  console.log(`[LoggerSetup] Log directory already exists: ${logDirectory}`);
}

// Configure electron-log transports directly
log.transports.file.level = 'debug';
log.transports.file.format = '{h}:{i}:{s}.{ms} {level} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.file = path.join(logDirectory, 'main.log'); // Use the defined directory
log.transports.file.sync = true; // Force synchronous writing

console.log(`[LoggerSetup] Electron-log file path set to: ${log.transports.file.file}`);
console.log(`[LoggerSetup] Electron-log file transport level: ${log.transports.file.level}`);
console.log(`[LoggerSetup] Electron-log file transport enabled: ${log.transports.file.level !== false}`); // Check if explicitly disabled

// Optional: Disable console transport if all logs should go to file
// log.transports.console.level = false; 

// Add a test log to confirm configuration
log.info('Electron-log configured and initialized.', { context: 'LoggerSetup' });
console.log('[LoggerSetup] Test log (info) sent to electron-log.');


module.exports = {
  info: log.info,
  warn: log.warn,
  error: log.error,
  debug: log.debug,
  // No setupLogger function needed anymore
};