// electron/ipc/audio.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupAudioIPC(wakeManager, vadManager) {
  let frameCount = 0;
  ipcMain.on('stream:audio-frame', (event, pcmData) => {
    const audioBuffer = Buffer.from(pcmData);
    frameCount++;
    if (frameCount % 100 === 0) {
      logger.debug(`Received ${frameCount} audio frames, buffer size: ${audioBuffer.length}`, { context: 'AudioIPC' });
    }
    try {
      if (wakeManager) {
        wakeManager.processAudioFrame(audioBuffer);
      }
      if (vadManager) {
        vadManager.processAudioFrame(audioBuffer);
      }
    } catch (error) {
      logger.error("Error processing audio frame in IPC:", error, { context: 'AudioIPC' });
    }
  });
}

module.exports = { setupAudioIPC };