// electron/ipc/system.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupSystemIPC() {
  logger.info('Setting up system IPC channels.');

  // Placeholder for ui:status - renderer can request status
  ipcMain.on('get-ui-status', (event) => {
    logger.debug('Received get-ui-status request from renderer.');
    // In a real app, this would get actual status
    event.sender.send('ui:status', { message: 'System is ready', type: 'info' });
  });

  // Placeholder for wake:triggered
  ipcMain.on('wake:triggered', (event, data) => {
    logger.info(`Wake word triggered: ${data}`);
    // In a real app, this would initiate further processing
    event.sender.send('wake:triggered', data);
  });

  // Placeholder for llm:response
  ipcMain.on('send-llm-response', (event, data) => {
    logger.info(`Received LLM response to send to UI: ${data}`);
    global.mainWindow.webContents.send('llm:response', data);
  });
}

module.exports = { setupSystemIPC };
