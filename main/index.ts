import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createMainWindow } from './window';
import { setupIPCHandlers } from './ipc-handlers';
import { registerGlobalHotkeys } from './hotkey-manager';

// Load environment variables
dotenv.config();

// Enable hot reload in development
if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electronReload = require('electron-reload');
    // __dirname in compiled code is dist/main/main/, so go up to project root
    const projectRoot = path.join(__dirname, '../../../');
    // Watch the compiled main process files for changes
    electronReload(path.join(projectRoot, 'dist', 'main'), {
      electron: path.join(projectRoot, 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      ignore: ['**/node_modules/**', '**/renderer/**', '**/*.map'],
    });
    console.log('🔄 Hot reload enabled for main process');
  } catch (error) {
    console.warn('⚠️ Could not enable hot reload:', error);
  }
}

let mainWindow: BrowserWindow | null = null;

// Handle creating/recreating a window in the app when the dock icon is clicked (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('🍌 Banana4U is starting...');

  // Create the main window
  mainWindow = createMainWindow();

  // Setup IPC handlers for communication with renderer
  setupIPCHandlers(mainWindow);

  // Register global hotkeys
  registerGlobalHotkeys(mainWindow);

  console.log('🍌 Banana4U is ready!');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
});

// Handle app termination
app.on('before-quit', () => {
  console.log('🍌 Banana4U is shutting down...');
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
