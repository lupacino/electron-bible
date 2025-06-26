const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let serverProcess;

function startExpressServer() {
  serverProcess = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, "express-app"),
    shell: true,
    stdio: "inherit",
  });
}

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  startExpressServer();
  setTimeout(createWindow, 3000);
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
