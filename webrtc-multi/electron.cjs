const { app, BrowserWindow } = require('electron');

const serverUrl = process.argv[2] || 'http://localhost:3000';

app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', serverUrl);
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(serverUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      w.loadURL(serverUrl);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
