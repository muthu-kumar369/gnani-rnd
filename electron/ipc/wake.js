// electron/ipc/wake.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupWakeIPC(wakeManager) {
  logger.info('Setting up wake-word IPC channels.');

  // --- Main to Renderer ---
  wakeManager.on('wake-triggered', () => {
    logger.info('Notifying renderer: wake:triggered');
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('wake:triggered');
    }
  });

  wakeManager.on('status-changed', (status) => {
    logger.info(`Notifying renderer of wake status change: ${status}`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('wake:status', { state: status });
    }
  });

  // --- Renderer to Main ---
  ipcMain.on('wake:start', () => {
    logger.info('Received wake:start from renderer.');
    wakeManager.startProcessing();
  });

  ipcMain.on('wake:stop', () => {
    logger.info('Received wake:stop from renderer.');
    wakeManager.stopProcessing();
  });

  ipcMain.handle('wake:getStatus', async () => {
    logger.info('Received wake:getStatus request from renderer.');
    return wakeManager.getStatus();
  });
}

module.exports = { setupWakeIPC };
