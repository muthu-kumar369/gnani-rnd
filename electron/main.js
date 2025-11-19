const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  // Load React in dev mode
  win.loadURL("http://localhost:5173");

  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/* ---------- IPC Example (React -> Electron -> React) -----------*/
ipcMain.on("message-from-react", (event, data) => {
  console.log("React says:", data);
  event.reply("message-from-electron", "Hello React! Electron here 😎");
});
