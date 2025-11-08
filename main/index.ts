import { app, BrowserWindow, session, systemPreferences } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createMainWindow } from './window';
import { setupIPCHandlers } from './ipc-handlers';
import { registerGlobalHotkeys } from './hotkey-manager';

// Load environment variables
dotenv.config();

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

  // Request microphone access at OS level (macOS)
  if (process.platform === 'darwin') {
    const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
    console.log('🎤 Microphone access status:', microphoneStatus);
    
    if (microphoneStatus !== 'granted') {
      console.log('🎤 Requesting microphone access...');
      systemPreferences.askForMediaAccess('microphone').then((granted) => {
        if (granted) {
          console.log('✅ Microphone access granted');
        } else {
          console.error('❌ Microphone access denied');
        }
      });
    }
  }

  // Set up session to handle media permissions - MICROPHONE ONLY
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('🔐 Permission requested:', permission);
    
    // Only allow media/microphone, NOT desktop audio/screen audio
    if (permission === 'media') {
      console.log('✅ Granting media permission (microphone only)');
      callback(true);
    } else if (permission === 'display-capture') {
      console.log('❌ Denying display capture (no system audio)');
      callback(false);
    } else {
      console.log('ℹ️ Permission:', permission);
      callback(false);
    }
  });

  // Handle media device selection - filter out system audio devices
  session.defaultSession.setDevicePermissionHandler((details) => {
    console.log('🎤 Device permission check:', details);
    
    // Only allow HID devices (not audio - Electron doesn't expose audio device filtering here)
    // Audio filtering must happen in renderer process
    return true;
  });

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
