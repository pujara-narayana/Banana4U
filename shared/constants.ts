export const APP_NAME = "Banana4U";
export const APP_VERSION = "1.0.0";

// Window Configuration
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 280,
  DEFAULT_HEIGHT: 380,
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 400,
  MAX_HEIGHT: 600,
  DEFAULT_OPACITY: 0.95,
  IDLE_OPACITY: 0.7,
};

// API Configuration
export const API_ENDPOINTS = {
  // Use Gemini 1.5 Flash (stable, widely available)
  // Note: Gemini 2.0 models may require allowlist access
  GEMINI:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  GEMINI_STREAM:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent",
  WHISPER: "https://api.openai.com/v1/audio/transcriptions",
  ELEVENLABS: "https://api.elevenlabs.io/v1/text-to-speech",
};

// IPC Channels
export const IPC_CHANNELS = {
  // Window management
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_CLOSE: "window:close",
  WINDOW_TOGGLE_ALWAYS_ON_TOP: "window:toggle-always-on-top",
  WINDOW_SET_OPACITY: "window:set-opacity",

  // Screen capture
  CAPTURE_SCREEN: "screen:capture",
  CAPTURE_ACTIVE_WINDOW: "screen:capture-active",
  CAPTURE_REGION: "screen:capture-region",

  // Audio
  AUDIO_START_RECORDING: "audio:start-recording",
  AUDIO_STOP_RECORDING: "audio:stop-recording",
  AUDIO_PLAY_SOUND: "audio:play-sound",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_RESET: "settings:reset",

  // Hotkeys
  HOTKEY_REGISTER: "hotkey:register",
  HOTKEY_UNREGISTER: "hotkey:unregister",

  // System
  GET_SYSTEM_INFO: 'system:get-info',

  // Authentication
  AUTH_REGISTER: 'auth:register',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_GET_CURRENT_USER: 'auth:get-current-user',
  AUTH_CHECK_USERNAME: 'auth:check-username',
  AUTH_CHECK_EMAIL: 'auth:check-email',

  // User Profile
  PROFILE_GET: 'profile:get',
  PROFILE_UPDATE: 'profile:update',

  // Conversations
  CONVERSATION_CREATE: 'conversation:create',
  CONVERSATION_GET: 'conversation:get',
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_UPDATE: 'conversation:update',
  CONVERSATION_DELETE: 'conversation:delete',

  // Messages
  MESSAGE_ADD: 'message:add',
  MESSAGE_GET_ALL: 'message:get-all',
};

// Animation States
export const ANIMATION_STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  HAPPY: "happy",
  CONFUSED: "confused",
  EXCITED: "excited",
  SLEEPING: "sleeping",
};

// Banana Personalities
export const PERSONALITIES = {
  DEFAULT: "default",
  STUDY: "study",
  HYPE: "hype",
  CHILL: "chill",
  CODE: "code",
  MEME: "meme",
};

// Points Configuration
export const POINTS_CONFIG = {
  ASK_QUESTION: 5,
  COMPLETE_FOCUS: 20,
  LEARN_NEW: 10,
  DAILY_STREAK: 50,
  TEACH_BANANA: 15,
  PERSONAL_BEST: 100,
};

// Level Thresholds
export const LEVEL_THRESHOLDS = {
  GREEN: 0,
  YELLOW: 500,
  SPOTTED: 2000,
  GOLDEN: 5000,
};

// Pomodoro Configuration
export const POMODORO_CONFIG = {
  WORK_DURATION: 25 * 60, // 25 minutes in seconds
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  SESSIONS_UNTIL_LONG_BREAK: 4,
};

// Voice Configuration
export const VOICE_CONFIG = {
  MAX_RECORDING_DURATION: 60 * 1000, // 60 seconds in milliseconds
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
};
