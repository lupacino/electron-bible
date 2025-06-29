const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// Disable GPU hardware acceleration
app.disableHardwareAcceleration();

let serverProcess;

function startExpressServer() {
  serverProcess = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, "express-app"),
    shell: true,
    stdio: "inherit",
  });

  console.log("Starting Express server...");
}

function waitForServer(url, callback) {
  const interval = setInterval(() => {
    http
      .get(url, () => {
        clearInterval(interval);
        console.log("Express server is up. Launching Electron window...");
        callback();
      })
      .on("error", () => {
        console.log("Waiting for server to start...");
      });
  }, 500); // Check every 500ms
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
  waitForServer("http://localhost:3000", createWindow);
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    console.log("Killing Express server process...");
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
