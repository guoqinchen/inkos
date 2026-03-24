import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerInitHandlers } from './ipc/init.js';
import { registerPipelineHandlers } from './ipc/pipeline.js';
import { registerStateHandlers } from './ipc/state.js';
import { registerConfigHandlers } from './ipc/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prevent garbage collection to keep the window alive
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox: false is required because the main process uses ESM modules
      // (import.meta.url, dynamic import) that cannot run inside Chromium's
      // sandbox context. The preload script uses contextBridge for safe IPC.
      sandbox: false,
    },
    show: false,
  });

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  const rendererDist = path.join(__dirname, '..', 'renderer');
  mainWindow.loadFile(path.join(rendererDist, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- Register IPC handler modules ----
registerInitHandlers();
registerPipelineHandlers(() => mainWindow);
registerStateHandlers();
registerConfigHandlers();

// ---- Stub handlers for channels not yet implemented in ipc/ modules ----

ipcMain.handle('book:list', async () => []);
ipcMain.handle('book:create', async (_event, _data) => ({ bookId: '' }));
ipcMain.handle('book:get', async (_event, _bookId) => null);
ipcMain.handle('book:delete', async (_event, _bookId) => ({ success: false }));
ipcMain.handle('chapter:list', async (_event, _bookId) => []);
ipcMain.handle('chapter:get', async (_event, _bookId, _chapterId) => null);
ipcMain.handle('chapter:approve', async (_event, _bookId, _chapterId) => ({ success: false }));
ipcMain.handle('truth:list', async (_event, _bookId) => null);
ipcMain.handle('truth:get', async (_event, _bookId, _name) => null);
ipcMain.handle('truth:update', async (_event, _bookId, _name, _content) => ({ success: false }));
ipcMain.handle('daemon:status', async () => ({
  running: false,
  uptimeMs: 0,
  activeBooks: [],
  queuedTasks: 0,
  memoryMb: 0,
}));
ipcMain.handle('daemon:up', async () => ({ success: false }));
ipcMain.handle('daemon:down', async () => ({ success: false }));
ipcMain.handle('analytics:get', async (_event, _bookId) => null);
ipcMain.handle('pipeline:write', async (_event, _data) => null);
ipcMain.handle('pipeline:audit', async (_event, _data) => null);
ipcMain.handle('pipeline:revise', async (_event, _data) => null);
ipcMain.handle('pipeline:cancel', async () => ({ success: false }));
ipcMain.handle('ws:connect', async (_event, _bookId) => ({ port: 0 }));

// ---- App Lifecycle ----

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('[Main] App quitting');
});
