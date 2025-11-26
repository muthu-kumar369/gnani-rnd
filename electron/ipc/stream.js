// electron/ipc/stream.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupStreamIPC(streamingClient, ttsPlayer) {
  logger.info('Setting up Stream IPC channels.');

  // --- Main -> Renderer ---
  streamingClient.on('stream:connected', (payload) => {
    logger.debug('Sending stream:connected to renderer.');
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:connected', payload);
    }
  });

  streamingClient.on('stream:disconnected', (payload) => {
    logger.debug('Sending stream:disconnected to renderer.');
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:disconnected', payload);
    }
  });

  streamingClient.on('stream:partial', (payload) => {
    logger.debug('Sending stream:partial to renderer.', payload.text);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:partial', payload);
    }
  });

  streamingClient.on('stream:final', (payload) => {
    logger.debug('Sending stream:final to renderer.', payload.text);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:final', payload);
    }
  });

  streamingClient.on('stream:tts_chunk', (payload) => {
    logger.debug(`Received stream:tts_chunk from client. Passing to renderer.`);
    // ttsPlayer.playTtsChunk is for audio chunks. For text chunks, we just forward to renderer.
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:tts_chunk', payload);
    }
  });

  streamingClient.on('stream:error', (payload) => {
    logger.error('Sending stream:error to renderer.', payload);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:error', payload);
    }
  });

  streamingClient.on('stream:metrics', (payload) => {
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:metrics', payload);
    }
  });

  ttsPlayer.on('tts:started', (segmentId) => {
    logger.debug(`Sending tts:started for ${segmentId} to renderer.`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('tts:started', { segment_id: segmentId });
    }
  });

  ttsPlayer.on('tts:ended', (segmentId) => {
    logger.debug(`Sending tts:ended for ${segmentId} to renderer.`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('tts:ended', { segment_id: segmentId });
    }
  });

  ttsPlayer.on('tts:error', (payload) => {
    logger.error('Sending tts:error to renderer.', payload);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('tts:error', payload);
    }
  });
  
  // --- Renderer -> Main ---
  ipcMain.on('stream:start', async (event, options) => {
    logger.info('Received stream:start from renderer.', options);
    streamingClient.init(options);
    await streamingClient.startAudioStreaming();
  });

  ipcMain.on('stream:start-file-test', async () => {
    logger.info('Received stream:start-file-test from renderer.');
    if (streamingClient) {
      streamingClient.startFileStreamTest();
    }
  });

  ipcMain.on('stream:stop', () => {
    logger.info('Received stream:stop from renderer.');
    streamingClient.stopAudioStreaming();
    streamingClient.disconnect();
  });

  ipcMain.handle('stream:getStatus', async () => {
    logger.info('Received stream:getStatus request from renderer.');
    return streamingClient.getStatus();
  });

  ipcMain.on('stream:setEndpoint', (event, cfg) => {
    logger.info('Received stream:setEndpoint from renderer.', cfg);
    streamingClient.setEndpoint(cfg);
  });
}

module.exports = { setupStreamIPC };
