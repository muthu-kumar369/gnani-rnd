// electron/ipc/audio.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');
const { Buffer } = require('buffer'); // Import Buffer

function setupAudioIPC(micCaptureInstance) {
  logger.info('Setting up audio IPC channels.');

  ipcMain.on('mic:start', (event) => {
    logger.info('Received mic:start request from renderer.');
    micCaptureInstance.startMicrophone();
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        event.sender.send('mic-status', micCaptureInstance.getIsRecording() ? 'started' : 'failed');
    }
  });

  ipcMain.on('mic:stop', (event) => {
    logger.info('Received mic:stop request from renderer.');
    micCaptureInstance.stopMicrophone();
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        event.sender.send('mic-status', micCaptureInstance.getIsRecording() ? 'failed' : 'stopped');
    }
  });

  // The 'mic:chunk' handler is removed as audio processing now happens entirely in the main process.

  // Listen for events from micCapture and forward them to the renderer
  micCaptureInstance.on('started', () => {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      logger.info('MicCapture started, notifying renderer.');
      global.mainWindow.webContents.send('audio:listening', true);
    }
  });

  micCaptureInstance.on('stopped', () => {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      logger.info('MicCapture stopped, notifying renderer.');
      global.mainWindow.webContents.send('audio:listening', false);
    }
  });
}

module.exports = { setupAudioIPC };
