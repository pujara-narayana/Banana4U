import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import {
  ElectronAPI,
  UserSettings,
  ScreenContext,
  RegisterParams,
  LoginParams,
  IPCResponse,
  AuthUser,
  UserProfile,
  ConversationHistory,
  Message,
} from "../shared/types";

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
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.WINDOW_TOGGLE_ALWAYS_ON_TOP
    );
    return result;
  },

  setOpacity: (opacity: number) => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_OPACITY, opacity);
  },

  // Screen capture
  captureScreen: async (
    mode: "full" | "active" | "region",
    excludeBanana4U = false
  ) => {
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.CAPTURE_SCREEN,
      mode,
      excludeBanana4U
    );
    if (result.success) {
      return result.data as ScreenContext;
    }
    throw new Error(result.error || "Screen capture failed");
  },

  // Audio
  startAudioRecording: async () => {
    // This will be implemented when we add audio recording
    console.log("Audio recording not yet implemented");
  },

  stopAudioRecording: async () => {
    // This will be implemented when we add audio recording
    return new Blob([], { type: "audio/webm" });
  },

  playSound: (soundName: string) => {
    ipcRenderer.send(IPC_CHANNELS.AUDIO_PLAY_SOUND, soundName);
  },

  // Text to Speech
  generateTTS: async (text: string) => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.TTS_GENERATE, text);
    if (result.success) {
      return result.data as string; // Returns base64 encoded audio
    }
    throw new Error(result.error || "Failed to generate TTS");
  },
  playTTSBase64: async (base64Audio: string) => {
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.TTS_PLAY_BASE64,
      base64Audio
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to play TTS audio");
    }
  },
  generateTTSFile: async (text: string) => {
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.TTS_GENERATE_FILE,
      text
    );
    if (result.success) {
      return result.data as string; // file path
    }
    throw new Error(result.error || "Failed to generate TTS file");
  },
  playTTSFile: async (filePath: string) => {
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.TTS_PLAY_FILE,
      filePath
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to play TTS file");
    }
  },
  stopTTSPlayback: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.TTS_STOP);
    if (!result.success) {
      throw new Error(result.error || "Failed to stop TTS playback");
    }
  },

  // Settings
  getSettings: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
    if (result.success) {
      return result.data as UserSettings;
    }
    throw new Error(result.error || "Failed to get settings");
  },

  setSetting: async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const result = await ipcRenderer.invoke(
      IPC_CHANNELS.SETTINGS_SET,
      key,
      value
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to set setting");
    }
  },

  resetSettings: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET);
    if (!result.success) {
      throw new Error(result.error || "Failed to reset settings");
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

  // Add this method to handle the focus hotkey
  onFocusInput: (callback: () => void) => {
    const channel = "hotkey:focus-input";
    ipcRenderer.on(channel, callback);
    // Return a cleanup function to be used in useEffect
    return () => ipcRenderer.removeListener(channel, callback);
  },

  // System
  getSystemInfo: async () => {
    const result = await ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_INFO);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Failed to get system info");
  },

  // Authentication
  register: async (params: RegisterParams) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_REGISTER,
      params
    )) as IPCResponse<AuthUser>;
  },

  login: async (params: LoginParams) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_LOGIN,
      params
    )) as IPCResponse<AuthUser>;
  },

  logout: async () => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_LOGOUT
    )) as IPCResponse<void>;
  },

  getCurrentUser: async () => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_GET_CURRENT_USER
    )) as IPCResponse<AuthUser>;
  },

  checkUsername: async (username: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_CHECK_USERNAME,
      username
    )) as IPCResponse<boolean>;
  },

  checkEmail: async (email: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.AUTH_CHECK_EMAIL,
      email
    )) as IPCResponse<boolean>;
  },

  // User Profile
  getProfile: async (userId: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.PROFILE_GET,
      userId
    )) as IPCResponse<UserProfile>;
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.PROFILE_UPDATE,
      userId,
      updates
    )) as IPCResponse<void>;
  },

  // Conversations
  createConversation: async (userId: string, personality?: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.CONVERSATION_CREATE,
      userId,
      personality
    )) as IPCResponse<string>;
  },

  getConversation: async (conversationId: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.CONVERSATION_GET,
      conversationId
    )) as IPCResponse<ConversationHistory>;
  },

  listConversations: async (userId: string, limit?: number) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.CONVERSATION_LIST,
      userId,
      limit
    )) as IPCResponse<ConversationHistory[]>;
  },

  updateConversation: async (
    conversationId: string,
    updates: { title?: string }
  ) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.CONVERSATION_UPDATE,
      conversationId,
      updates
    )) as IPCResponse<void>;
  },

  deleteConversation: async (conversationId: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.CONVERSATION_DELETE,
      conversationId
    )) as IPCResponse<void>;
  },

  // Messages
  addMessage: async (conversationId: string, message: Message) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.MESSAGE_ADD,
      conversationId,
      message
    )) as IPCResponse<void>;
  },

  getMessages: async (conversationId: string) => {
    return (await ipcRenderer.invoke(
      IPC_CHANNELS.MESSAGE_GET_ALL,
      conversationId
    )) as IPCResponse<Message[]>;
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", electronAPI);

console.log("🔌 Preload script loaded");
