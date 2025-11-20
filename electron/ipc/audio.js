// electron/ipc/audio.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupAudioIPC(micCaptureInstance) {
  logger.info('Setting up audio IPC channels.');

  // Example: Renderer asks to start mic
  ipcMain.on('start-mic', (event) => {
    logger.info('Received start-mic request from renderer.');
    micCaptureInstance.startMicrophone();
    event.sender.send('mic-status', micCaptureInstance.getIsRecording() ? 'started' : 'failed');
  });

  // Example: Renderer asks to stop mic
  ipcMain.on('stop-mic', (event) => {
    logger.info('Received stop-mic request from renderer.');
    micCaptureInstance.stopMicrophone();
    event.sender.send('mic-status', micCaptureInstance.getIsRecording() ? 'failed' : 'stopped');
  });

  // MicCapture emits audio chunks, which we then send to the renderer
  micCaptureInstance.on('audio-chunk', (chunk) => {
    // logger.debug('Sending audio:chunk to renderer.'); // Can be verbose
    global.mainWindow.webContents.send('audio:chunk', chunk);
  });

  micCaptureInstance.on('started', () => {
    logger.info('MicCapture started, notifying renderer.');
    global.mainWindow.webContents.send('audio:listening', true); // Use the specified channel
  });

  micCaptureInstance.on('stopped', () => {
    logger.info('MicCapture stopped, notifying renderer.');
    global.mainWindow.webContents.send('audio:listening', false); // Use the specified channel
  });
}

module.exports = { setupAudioIPC };
