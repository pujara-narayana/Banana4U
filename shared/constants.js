"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOICE_CONFIG = exports.POMODORO_CONFIG = exports.LEVEL_THRESHOLDS = exports.POINTS_CONFIG = exports.PERSONALITIES = exports.ANIMATION_STATES = exports.IPC_CHANNELS = exports.API_ENDPOINTS = exports.WINDOW_CONFIG = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = 'Banana4U';
exports.APP_VERSION = '1.0.0';
// Window Configuration
exports.WINDOW_CONFIG = {
    DEFAULT_WIDTH: 300,
    DEFAULT_HEIGHT: 400,
    MIN_WIDTH: 200,
    MIN_HEIGHT: 200,
    MAX_WIDTH: 600,
    MAX_HEIGHT: 800,
    DEFAULT_OPACITY: 0.95,
    IDLE_OPACITY: 0.7,
};
// API Configuration
exports.API_ENDPOINTS = {
    GEMINI: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent',
    WHISPER: 'https://api.openai.com/v1/audio/transcriptions',
    ELEVENLABS: 'https://api.elevenlabs.io/v1/text-to-speech',
};
// IPC Channels
exports.IPC_CHANNELS = {
    // Window management
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_CLOSE: 'window:close',
    WINDOW_TOGGLE_ALWAYS_ON_TOP: 'window:toggle-always-on-top',
    WINDOW_SET_OPACITY: 'window:set-opacity',
    // Screen capture
    CAPTURE_SCREEN: 'screen:capture',
    CAPTURE_ACTIVE_WINDOW: 'screen:capture-active',
    CAPTURE_REGION: 'screen:capture-region',
    // Audio
    AUDIO_START_RECORDING: 'audio:start-recording',
    AUDIO_STOP_RECORDING: 'audio:stop-recording',
    AUDIO_PLAY_SOUND: 'audio:play-sound',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_RESET: 'settings:reset',
    // Hotkeys
    HOTKEY_REGISTER: 'hotkey:register',
    HOTKEY_UNREGISTER: 'hotkey:unregister',
    // System
    GET_SYSTEM_INFO: 'system:get-info',
};
// Animation States
exports.ANIMATION_STATES = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking',
    HAPPY: 'happy',
    CONFUSED: 'confused',
    EXCITED: 'excited',
    SLEEPING: 'sleeping',
};
// Banana Personalities
exports.PERSONALITIES = {
    DEFAULT: 'default',
    STUDY: 'study',
    HYPE: 'hype',
    CHILL: 'chill',
    CODE: 'code',
    MEME: 'meme',
};
// Points Configuration
exports.POINTS_CONFIG = {
    ASK_QUESTION: 5,
    COMPLETE_FOCUS: 20,
    LEARN_NEW: 10,
    DAILY_STREAK: 50,
    TEACH_BANANA: 15,
    PERSONAL_BEST: 100,
};
// Level Thresholds
exports.LEVEL_THRESHOLDS = {
    GREEN: 0,
    YELLOW: 500,
    SPOTTED: 2000,
    GOLDEN: 5000,
};
// Pomodoro Configuration
exports.POMODORO_CONFIG = {
    WORK_DURATION: 25 * 60, // 25 minutes in seconds
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60,
    SESSIONS_UNTIL_LONG_BREAK: 4,
};
// Voice Configuration
exports.VOICE_CONFIG = {
    MAX_RECORDING_DURATION: 60 * 1000, // 60 seconds in milliseconds
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
};
//# sourceMappingURL=constants.js.map