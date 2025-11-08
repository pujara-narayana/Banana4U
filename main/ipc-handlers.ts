import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { captureScreen } from './screen-capture';
import Store from 'electron-store';

const store = new Store();

export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  // Window management
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_ALWAYS_ON_TOP, () => {
    const currentState = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!currentState);
    return !currentState;
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_OPACITY, (_event, opacity: number) => {
    mainWindow.setOpacity(opacity);
  });

  // Screen capture
  ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREEN, async (_event, mode: 'full' | 'active' | 'region', excludeBanana4U = false) => {
    try {
      const screenshot = await captureScreen(mode, excludeBanana4U);
      return { success: true, data: screenshot };
    } catch (error) {
      console.error('Screen capture failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    try {
      const settings = store.get('settings', getDefaultSettings());
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: string, value: unknown) => {
    try {
      store.set(`settings.${key}`, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    try {
      store.set('settings', getDefaultSettings());
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // System info
  ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_INFO, () => {
    return {
      success: true,
      data: {
        platform: process.platform,
        version: process.getSystemVersion(),
        arch: process.arch,
      },
    };
  });

  console.log('✅ IPC handlers registered');
}

function getDefaultSettings() {
  return {
    // General
    startOnBoot: false,
    language: 'en',
    theme: 'auto',

    // Privacy
    allowScreenCapture: true,
    allowAutoCapture: false,
    allowWebcam: false,
    storageLocation: 'local',

    // Personality
    defaultPersonality: 'default',
    voiceEnabled: true,
    voiceSpeed: 1.0,

    // Appearance
    windowOpacity: 0.95,
    animationSpeed: 1.0,
    reducedMotion: false,
    bananaSkin: 'classic',

    // Productivity
    pomodoroWorkDuration: 25 * 60,
    pomodoroShortBreak: 5 * 60,
    pomodoroLongBreak: 15 * 60,
    proactiveLevel: 'medium',

    // Hotkeys
    hotkeys: {
      pushToTalk: 'CommandOrControl+Space',
      captureScreen: 'CommandOrControl+Shift+C',
      explainThis: 'CommandOrControl+Shift+E',
      summarize: 'CommandOrControl+Shift+S',
      findErrors: 'CommandOrControl+Shift+F',
    },

    // API Keys (loaded from env)
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  };
}
