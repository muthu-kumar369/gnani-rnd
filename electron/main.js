const { app, BrowserWindow } = require("electron");
const path = require("path");

// Determine if we are in development mode
const isDev = process.env.NODE_ENV !== "production";

// Enable auto-reloading in development
if (isDev) {
  try {
    require("electron-reloader")(module);
  } catch (err) {
    console.error("Failed to load electron-reloader:", err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    // In development, load the Vite dev server URL
    console.log("Running in development mode. Loading Vite server...");
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    // In production, load the built React app
    console.log("Running in production mode. Loading built files...");
    const indexPath = path.resolve(
      __dirname,
      "..",
      "react",
      "dist",
      "index.html"
    );
    win.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
