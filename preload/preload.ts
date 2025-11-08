import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { ElectronAPI, UserSettings, ScreenContext } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  // Window management
  minimizeWindow: () => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE);
  },

  closeWindow: () => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE);
  },

  toggleAlwaysOnTop: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_ALWAYS_ON_TOP);
    return result;
  },

  setOpacity: (opacity: number) => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_OPACITY, opacity);
  },

  // Screen capture
  captureScreen: async (mode: 'full' | 'active' | 'region') => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_SCREEN, mode);
    if (result.success) {
      return result.data as ScreenContext;
    }
    throw new Error(result.error || 'Screen capture failed');
  },

  // Audio
  startAudioRecording: async () => {
    // This will be implemented when we add audio recording
    console.log('Audio recording not yet implemented');
  },

  stopAudioRecording: async () => {
    // This will be implemented when we add audio recording
    return new Blob([], { type: 'audio/webm' });
  },

  playSound: (soundName: string) => {
    ipcRenderer.send(IPC_CHANNELS.AUDIO_PLAY_SOUND, soundName);
  },

  // Settings
  getSettings: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
    if (result.success) {
      return result.data as UserSettings;
    }
    throw new Error(result.error || 'Failed to get settings');
  },

  setSetting: async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value);
    if (!result.success) {
      throw new Error(result.error || 'Failed to set setting');
    }
  },

  resetSettings: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET);
    if (!result.success) {
      throw new Error(result.error || 'Failed to reset settings');
    }
  },

  // Hotkeys
  registerHotkey: async (key: string, callback: () => void) => {
    // Store callback and set up listener
    ipcRenderer.on(`hotkey:${key}`, callback);
    const result = await ipcRenderer.invoke(IPC_CHANNELS.HOTKEY_REGISTER, key);
    return result.success;
  },

  unregisterHotkey: async (key: string) => {
    ipcRenderer.removeAllListeners(`hotkey:${key}`);
    await ipcRenderer.invoke(IPC_CHANNELS.HOTKEY_UNREGISTER, key);
  },

  // System
  getSystemInfo: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_INFO);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Failed to get system info');
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

console.log('🔌 Preload script loaded');
