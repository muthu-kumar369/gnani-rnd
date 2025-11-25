// electron/ipc/audio.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupAudioIPC(wakeManager, vadManager) {
  ipcMain.on('stream:audio-frame', (event, pcmData) => {
    const audioBuffer = Buffer.from(pcmData);
    if (wakeManager) {
      wakeManager.processAudioFrame(audioBuffer);
    }
    if (vadManager) {
      vadManager.processAudioFrame(audioBuffer);
    }
  });
}

module.exports = { setupAudioIPC };