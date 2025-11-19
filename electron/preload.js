const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (msg) => ipcRenderer.send("message-from-react", msg),

  onMessage: (callback) =>
    ipcRenderer.on("message-from-electron", (event, data) => callback(data))
});
