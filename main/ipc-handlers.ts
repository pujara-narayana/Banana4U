import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { captureScreen } from './screen-capture';
import Store from 'electron-store';
import {
  createUser,
  authenticateUser,
  isUsernameAvailable,
  isEmailAvailable,
  setCurrentUser,
  getCurrentUser,
  getProfile,
  updateProfile,
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
} from './storage/json-storage';
import { Message } from '../shared/types';

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

  // Authentication handlers
  ipcMain.handle(IPC_CHANNELS.AUTH_REGISTER, async (_event, params: { username: string; email?: string; password: string }) => {
    try {
      if (!isUsernameAvailable(params.username)) {
        return { success: false, error: 'Username already taken' };
      }
      if (params.email && !isEmailAvailable(params.email)) {
        return { success: false, error: 'Email already registered' };
      }

      const user = createUser(params.username, params.email, params.password);
      setCurrentUser(user.id);

      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date(user.created_at),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_event, params: { username: string; password: string }) => {
    try {
      const user = authenticateUser(params.username, params.password);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      setCurrentUser(user.id);

      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date(user.created_at),
          last_login_at: user.last_login_at ? new Date(user.last_login_at) : undefined,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, () => {
    try {
      setCurrentUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_CURRENT_USER, () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }
      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date(user.created_at),
          last_login_at: user.last_login_at ? new Date(user.last_login_at) : undefined,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_CHECK_USERNAME, (_event, username: string) => {
    try {
      return { success: true, data: isUsernameAvailable(username) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_CHECK_EMAIL, (_event, email: string) => {
    try {
      return { success: true, data: isEmailAvailable(email) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // User Profile handlers
  ipcMain.handle(IPC_CHANNELS.PROFILE_GET, (_event, userId: string) => {
    try {
      const profile = getProfile(userId);
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE, (_event, userId: string, updates: any) => {
    try {
      updateProfile(userId, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Conversation handlers
  ipcMain.handle(IPC_CHANNELS.CONVERSATION_CREATE, (_event, userId: string, personality?: string) => {
    try {
      const conversationId = createConversation(userId, personality);
      return { success: true, data: conversationId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATION_GET, (_event, conversationId: string) => {
    try {
      const conversation = getConversation(conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }
      return { success: true, data: conversation };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATION_LIST, (_event, userId: string, limit?: number) => {
    try {
      const conversations = listConversations(userId, limit);
      return { success: true, data: conversations };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATION_UPDATE, (_event, conversationId: string, updates: { title?: string }) => {
    try {
      updateConversation(conversationId, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATION_DELETE, (_event, conversationId: string) => {
    try {
      deleteConversation(conversationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Message handlers
  ipcMain.handle(IPC_CHANNELS.MESSAGE_ADD, (_event, conversationId: string, message: Message) => {
    try {
      addMessage(conversationId, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MESSAGE_GET_ALL, (_event, conversationId: string) => {
    try {
      const messages = getMessages(conversationId);
      return { success: true, data: messages };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
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
