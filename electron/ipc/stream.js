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

  streamingClient.on('stream:llm_chunk', (payload) => {
    if (payload.chunk && payload.chunk.type === 'complete_response') {
        logger.info(`[TRACE] [ELECTRON-IPC] Passing complete_response to renderer.`);
    } else {
        logger.debug(`Received stream:llm_chunk from client. Passing to renderer.`);
    }
    
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('stream:llm_chunk', payload.chunk);
    } else {
        logger.error(`[TRACE] [ELECTRON-IPC-ERROR] MainWindow not available to send stream:llm_chunk`);
    }
  });

  streamingClient.on('stream:tool_status', (payload) => {
    logger.debug(`Received stream:tool_status from client. Passing to renderer.`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('tool:status', payload.tool_status);
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
    // Do NOT disconnect here. We need to keep the connection open to receive the response.
    // The backend will close the stream when it's done, or we can disconnect later if needed.
    // streamingClient.disconnect(); 
  });

  ipcMain.handle('stream:getStatus', async () => {
    logger.info('Received stream:getStatus request from renderer.');
    return streamingClient.getStatus();
  });

  ipcMain.on('stream:setEndpoint', (event, cfg) => {
    logger.info('Received stream:setEndpoint from renderer.', cfg);
    streamingClient.setEndpoint(cfg);
  });

  ipcMain.on('stream:setSessionId', (event, sessionId) => {
    logger.info(`Received stream:setSessionId from renderer: ${sessionId}`);
    streamingClient.setSessionId(sessionId);
  });

  ipcMain.on('stream:sendText', (event, text) => {
    logger.info('Received stream:sendText from renderer.', text);
    streamingClient.sendText(text);
  });
}

module.exports = { setupStreamIPC };
