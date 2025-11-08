import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { WINDOW_CONFIG } from '../shared/constants';

const store = new Store();

export function createMainWindow(): BrowserWindow {
  // Get saved window position or center on screen
  const savedPosition = store.get('windowPosition') as { x: number; y: number } | undefined;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let x: number;
  let y: number;

  if (savedPosition) {
    x = savedPosition.x;
    y = savedPosition.y;
  } else {
    // Center the window
    x = Math.floor((screenWidth - WINDOW_CONFIG.DEFAULT_WIDTH) / 2);
    y = Math.floor((screenHeight - WINDOW_CONFIG.DEFAULT_HEIGHT) / 2);
  }

  const mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.DEFAULT_WIDTH,
    height: WINDOW_CONFIG.DEFAULT_HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    maxWidth: WINDOW_CONFIG.MAX_WIDTH,
    maxHeight: WINDOW_CONFIG.MAX_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: '#00000000', // Fully transparent
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Need false for some native modules
      devTools: true,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from webpack-dev-server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Save window position when moved
  mainWindow.on('moved', () => {
    const position = mainWindow.getPosition();
    store.set('windowPosition', { x: position[0], y: position[1] });
  });

  // Save window size when resized
  mainWindow.on('resized', () => {
    const size = mainWindow.getSize();
    store.set('windowSize', { width: size[0], height: size[1] });
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    // You can add confirmation dialog here if needed
    console.log('🍌 Window closing...');
  });

  mainWindow.on('closed', () => {
    console.log('🍌 Window closed');
  });

  return mainWindow;
}
