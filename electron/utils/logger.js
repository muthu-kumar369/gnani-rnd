// electron/utils/logger.js
const log = require('electron-log');

// Optional: Configure electron-log
log.transports.file.level = 'info';
log.transports.file.format = '{h}:{i}:{s}.{ms} {level} {text}';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.file = require('path').join(__dirname, '../../logs/main.log');

module.exports = {
  info: log.info,
  warn: log.warn,
  error: log.error,
  debug: log.debug,
};
