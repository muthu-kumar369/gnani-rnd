// electron/ipc/vad.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupVadIPC(vadManager) {
  logger.info('Setting up VAD IPC channels.');

  // Main -> Renderer
  vadManager.on('audio:listening', (isListening) => {
    logger.debug(`Sending audio:listening to renderer: ${isListening}`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('audio:listening', isListening);
    }
  });

  // The audio:chunk listener is removed from here. The streamingClient in main.js
  // is the sole listener for the VAD's audio:chunk event.

  vadManager.on('audio:ended', () => {
    logger.debug('Sending audio:ended to renderer.');
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('audio:ended');
    }
  });

  vadManager.on('vad:status', (status) => {
    logger.debug(`Sending vad:status to renderer: ${JSON.stringify(status)}`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('vad:status', status);
    }
  });

  // Forward VAD speech frame events for barge-in detection
  vadManager.on('vad:speech-frame', (data) => {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('vad:speech-frame', data);
    }
  });

  // Forward VAD calibration events
  vadManager.on('vad:calibrated', (data) => {
    logger.info('VAD calibration complete, notifying renderer', data);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('vad:calibrated', data);
    }
  });

  vadManager.on('vad:recalibrating', () => {
    logger.info('VAD recalibration started, notifying renderer');
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('vad:recalibrating');
    }
  });

  // Renderer -> Main
  ipcMain.on('vad:start', () => {
    logger.info('Received vad:start from renderer.');
    vadManager.startVAD();
  });

  ipcMain.on('vad:stop', () => {
    logger.info('Received vad:stop from renderer.');
    vadManager.stopVAD();
  });

  ipcMain.handle('vad:getStatus', async () => {
    logger.info('Received vad:getStatus request from renderer.');
    return vadManager.getStatus();
  });

  ipcMain.on('vad:setAggressiveness', (event, level) => {
    logger.info(`Received vad:setAggressiveness from renderer: ${level}`);
    vadManager.setAggressiveness(level);
  });

  ipcMain.on('vad:recalibrate', () => {
    logger.info('Received vad:recalibrate from renderer.');
    vadManager.recalibrate();
  });

  ipcMain.on('vad:setSpeaking', (event, isSpeaking) => {
    logger.debug(`Received vad:setSpeaking from renderer: ${isSpeaking}`);
    vadManager.setSystemSpeaking(isSpeaking);
  });
}

module.exports = { setupVadIPC };
