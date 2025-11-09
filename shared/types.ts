export type AnimationState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'confused'
  | 'excited'
  | 'sleeping';

export type PersonalityType = 'default' | 'study' | 'hype' | 'chill' | 'code' | 'meme';

export type BananaLevel = 'green' | 'yellow' | 'spotted' | 'golden';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  screenContext?: ScreenContext;
}

export interface ScreenContext {
  text?: string;
  image?: string; // base64
  timestamp: Date;
  source: 'full' | 'active' | 'region';
}

export interface UserSettings {
  // General
  startOnBoot: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';

  // Privacy
  allowScreenCapture: boolean;
  allowAutoCapture: boolean;
  allowWebcam: boolean;
  storageLocation: string;

  // Personality
  defaultPersonality: PersonalityType;
  voiceEnabled: boolean;
  voiceSpeed: number; // 0.75 - 1.5

  // Appearance
  windowOpacity: number;
  animationSpeed: number; // 0.5 - 2.0
  reducedMotion: boolean;
  bananaSkin: string;

  // Productivity
  pomodoroWorkDuration: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  proactiveLevel: 'low' | 'medium' | 'high' | 'off';

  // Hotkeys
  hotkeys: {
    pushToTalk: string;
    captureScreen: string;
    explainThis: string;
    summarize: string;
    findErrors: string;
  };

  // API Keys
  geminiApiKey?: string;
  openaiApiKey?: string;
  elevenLabsApiKey?: string;
}

export interface UserProfile {
  name?: string;
  totalPoints: number;
  currentLevel: BananaLevel;
  dailyStreak: number;
  lastActiveDate: Date;
  achievements: Achievement[];
  preferences: Record<string, unknown>;
  learningGoals: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export interface ConversationHistory {
  id: string;
  timestamp: Date;
  messages: Message[];
  topics: string[];
  context: string;
  personality: PersonalityType;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  hotkey?: string;
  handler: () => void | Promise<void>;
}

export interface PomodoroSession {
  id: string;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

// API Response Types
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface WhisperResponse {
  text: string;
}

// Authentication Types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  created_at: Date;
  last_login_at?: Date;
}

export interface RegisterParams {
  username: string;
  email?: string;
  password: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

// IPC Types
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Window API exposed to renderer via preload
export interface ElectronAPI {
  // Window management
  minimizeWindow: () => void;
  closeWindow: () => void;
  toggleAlwaysOnTop: () => Promise<boolean>;
  setOpacity: (opacity: number) => void;

  // Screen capture
  captureScreen: (mode: 'full' | 'active' | 'region', excludeBanana4U?: boolean) => Promise<ScreenContext>;

  // Audio
  startAudioRecording: () => Promise<void>;
  stopAudioRecording: () => Promise<Blob>;
  playSound: (soundName: string) => void;

  // Settings
  getSettings: () => Promise<UserSettings>;
  setSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Hotkeys
  registerHotkey: (key: string, callback: () => void) => Promise<boolean>;
  unregisterHotkey: (key: string) => Promise<void>;

  /**
   * Listens for a global hotkey event to focus the main input field.
   * @param callback The function to execute when the event is received.
   * @returns A function to remove the event listener.
   */
  onFocusInput: (callback: () => void) => () => void;

  // System
  getSystemInfo: () => Promise<{
    platform: string;
    version: string;
    arch: string;
  }>;

  // Authentication
  register: (params: RegisterParams) => Promise<IPCResponse<AuthUser>>;
  login: (params: LoginParams) => Promise<IPCResponse<AuthUser>>;
  logout: () => Promise<IPCResponse<void>>;
  getCurrentUser: () => Promise<IPCResponse<AuthUser>>;
  checkUsername: (username: string) => Promise<IPCResponse<boolean>>;
  checkEmail: (email: string) => Promise<IPCResponse<boolean>>;

  // User Profile
  getProfile: (userId: string) => Promise<IPCResponse<UserProfile>>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<IPCResponse<void>>;

  // Conversations
  createConversation: (userId: string, personality?: string) => Promise<IPCResponse<string>>;
  getConversation: (conversationId: string) => Promise<IPCResponse<ConversationHistory>>;
  listConversations: (userId: string, limit?: number) => Promise<IPCResponse<ConversationHistory[]>>;
  updateConversation: (conversationId: string, updates: { title?: string }) => Promise<IPCResponse<void>>;
  deleteConversation: (conversationId: string) => Promise<IPCResponse<void>>;

  // Messages
  addMessage: (conversationId: string, message: Message) => Promise<IPCResponse<void>>;
  getMessages: (conversationId: string) => Promise<IPCResponse<Message[]>>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
