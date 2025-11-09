import { BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { IPC_CHANNELS } from "../shared/constants";
import { captureScreen } from "./screen-capture";
import Store from "electron-store";
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
} from "./storage/json-storage";
import { Message } from "../shared/types";

const store = new Store();

// Track current TTS playback process (afplay) so we can stop it
let currentTTSProc: import("child_process").ChildProcess | null = null;

export function stopAnyTTS() {
  try {
    if (currentTTSProc) {
      console.log("🛑 [Main Process] Stopping current TTS playback");
      currentTTSProc.kill("SIGTERM");
      currentTTSProc = null;
    }
  } catch (err) {
    console.warn("⚠️ [Main Process] Failed to stop TTS process:", err);
  }
}

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
  ipcMain.handle(
    IPC_CHANNELS.CAPTURE_SCREEN,
    async (
      _event,
      mode: "full" | "active" | "region",
      excludeBanana4U = false
    ) => {
      try {
        const screenshot = await captureScreen(mode, excludeBanana4U);
        return { success: true, data: screenshot };
      } catch (error) {
        console.error("Screen capture failed:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Text to Speech - ElevenLabs
  ipcMain.handle(IPC_CHANNELS.TTS_GENERATE, async (_event, text: string) => {
    try {
      // Get API key from settings first, fall back to env
      const settings = store.get("settings") as any;
      const ELEVENLABS_API_KEY = settings?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
      const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mdzEgLpu0FjTwYs5oot0"; // Rachel - free voice

      if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not set. Please add it in Settings > API Keys or set ELEVENLABS_API_KEY in environment variables");
      }

      console.log("🗣️ [Main Process] Generating speech with ElevenLabs...");
      console.log(
        "📝 [Main Process] Text to speak:",
        text.substring(0, 100) + (text.length > 100 ? "..." : "")
      );

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ [Main Process] ElevenLabs API error:",
          response.status,
          errorText
        );
        throw new Error(
          `ElevenLabs API error: ${response.status} - ${errorText}`
        );
      }

      console.log("✅ [Main Process] Audio generated successfully");
      const audioBuffer = await response.arrayBuffer();
      console.log(
        "📦 [Main Process] Audio buffer size:",
        audioBuffer.byteLength,
        "bytes"
      );

      // Convert ArrayBuffer to base64 for transmission to renderer
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      return { success: true, data: base64Audio };
    } catch (error) {
      console.error("❌ [Main Process] TTS generation failed:", error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Generate MP3 to a temp file and return its path
  ipcMain.handle(
    IPC_CHANNELS.TTS_GENERATE_FILE,
    async (_event, text: string) => {
      try {
        // Get API key from settings first, fall back to env
        const settings = store.get("settings") as any;
        const ELEVENLABS_API_KEY = settings?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
        const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mdzEgLpu0FjTwYs5oot0"; // Rachel - free voice

        if (!ELEVENLABS_API_KEY) {
          throw new Error("ElevenLabs API key is not set. Please add it in Settings > API Keys or set ELEVENLABS_API_KEY in environment variables");
        }

        console.log(
          "🗣️ [Main Process] Generating speech (file) with ElevenLabs..."
        );
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_turbo_v2_5",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `ElevenLabs API error: ${response.status} - ${errorText}`
          );
        }

        const audioBuffer = await response.arrayBuffer();
        const tmpDir = os.tmpdir();
        const filePath = path.join(tmpDir, `banana4u-tts-${Date.now()}.mp3`);
        await fs.promises.writeFile(filePath, Buffer.from(audioBuffer));
        console.log("💾 [Main Process] Wrote ElevenLabs MP3 to", filePath);

        // Try to determine duration (in seconds) using macOS afinfo
        let durationSec = await getAudioDurationSec(filePath);
        if (durationSec != null) {
          console.log(
            `⏱️  [Main Process] Estimated audio duration: ${durationSec.toFixed(
              3
            )} sec`
          );
        } else {
          console.warn(
            "⚠️  [Main Process] Could not determine audio duration via afinfo"
          );
          // Fallback: estimate duration based on text length (approx 3.2 words/sec)
          const est = estimateSpeechDurationSec(text);
          durationSec = est;
          console.log(
            `⏱️  [Main Process] Using estimated duration based on text: ${durationSec.toFixed(
              3
            )} sec`
          );
        }

        return {
          success: true,
          data: { filePath, durationSec: durationSec ?? null },
        };
      } catch (error) {
        console.error("❌ [Main Process] Generate TTS file failed:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Play MP3 from a file path
  ipcMain.handle(
    IPC_CHANNELS.TTS_PLAY_FILE,
    async (_event, filePath: string) => {
      try {
        if (process.platform !== "darwin") {
          throw new Error(
            "TTS playback via afplay is only implemented on macOS"
          );
        }
        console.log(
          "▶️  [Main Process] Playing audio file with afplay:",
          filePath
        );
        // Stop existing playback if any
        stopAnyTTS();
        await new Promise<void>((resolve, reject) => {
          currentTTSProc = spawn("afplay", [filePath]);
          currentTTSProc.on("error", (err) => {
            currentTTSProc = null;
            reject(err);
          });
          currentTTSProc.on("close", () => {
            currentTTSProc = null;
            resolve();
          });
        });
        return { success: true };
      } catch (error) {
        console.error("❌ [Main Process] Play TTS file failed:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Play base64-encoded MP3 using system audio (macOS: afplay)
  ipcMain.handle(
    IPC_CHANNELS.TTS_PLAY_BASE64,
    async (_event, base64Audio: string) => {
      try {
        if (process.platform !== "darwin") {
          throw new Error(
            "TTS playback via afplay is only implemented on macOS"
          );
        }

        const tmpDir = os.tmpdir();
        const filePath = path.join(tmpDir, `banana4u-tts-${Date.now()}.mp3`);

        // Decode base64 and write to temp file
        await fs.promises.writeFile(
          filePath,
          Buffer.from(base64Audio, "base64")
        );
        console.log("💾 [Main Process] Wrote TTS audio to", filePath);

        // Spawn afplay to play the file
        console.log("▶️  [Main Process] Playing audio with afplay...");
        // Stop existing playback if any
        stopAnyTTS();
        await new Promise<void>((resolve, reject) => {
          currentTTSProc = spawn("afplay", [filePath]);
          currentTTSProc.on("error", (err) => {
            console.error("❌ [Main Process] afplay error:", err);
            currentTTSProc = null;
            reject(err);
          });
          currentTTSProc.on("close", (code) => {
            console.log("⏹️  [Main Process] afplay exited with code", code);
            currentTTSProc = null;
            resolve();
          });
        });

        // Cleanup temp file
        fs.promises.unlink(filePath).catch(() => {});
        return { success: true };
      } catch (error) {
        console.error("❌ [Main Process] TTS playback failed:", error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Stop current TTS playback if running
  ipcMain.handle(IPC_CHANNELS.TTS_STOP, async () => {
    stopAnyTTS();
    return { success: true };
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    try {
      const settings = store.get("settings", getDefaultSettings());
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET,
    (_event, key: string, value: unknown) => {
      try {
        store.set(`settings.${key}`, value);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    try {
      store.set("settings", getDefaultSettings());
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
  ipcMain.handle(
    IPC_CHANNELS.AUTH_REGISTER,
    async (
      _event,
      params: { username: string; email?: string; password: string }
    ) => {
      try {
        if (!isUsernameAvailable(params.username)) {
          return { success: false, error: "Username already taken" };
        }
        if (params.email && !isEmailAvailable(params.email)) {
          return { success: false, error: "Email already registered" };
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
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.AUTH_LOGIN,
    async (_event, params: { username: string; password: string }) => {
      try {
        const user = authenticateUser(params.username, params.password);
        if (!user) {
          return { success: false, error: "Invalid username or password" };
        }

        setCurrentUser(user.id);

        return {
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: new Date(user.created_at),
            last_login_at: user.last_login_at
              ? new Date(user.last_login_at)
              : undefined,
          },
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

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
        return { success: false, error: "No user logged in" };
      }
      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: new Date(user.created_at),
          last_login_at: user.last_login_at
            ? new Date(user.last_login_at)
            : undefined,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.AUTH_CHECK_USERNAME,
    (_event, username: string) => {
      try {
        return { success: true, data: isUsernameAvailable(username) };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

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
        return { success: false, error: "Profile not found" };
      }
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE,
    (_event, userId: string, updates: any) => {
      try {
        updateProfile(userId, updates);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Conversation handlers
  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_CREATE,
    (_event, userId: string, personality?: string) => {
      try {
        const conversationId = createConversation(userId, personality);
        return { success: true, data: conversationId };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_GET,
    (_event, conversationId: string) => {
      try {
        const conversation = getConversation(conversationId);
        if (!conversation) {
          return { success: false, error: "Conversation not found" };
        }
        return { success: true, data: conversation };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_LIST,
    (_event, userId: string, limit?: number) => {
      try {
        const conversations = listConversations(userId, limit);
        return { success: true, data: conversations };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_UPDATE,
    (_event, conversationId: string, updates: { title?: string }) => {
      try {
        updateConversation(conversationId, updates);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATION_DELETE,
    (_event, conversationId: string) => {
      try {
        deleteConversation(conversationId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Message handlers
  ipcMain.handle(
    IPC_CHANNELS.MESSAGE_ADD,
    (_event, conversationId: string, message: Message) => {
      try {
        addMessage(conversationId, message);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.MESSAGE_GET_ALL,
    (_event, conversationId: string) => {
      try {
        const messages = getMessages(conversationId);
        return { success: true, data: messages };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  console.log("✅ IPC handlers registered");
}

/**
 * Get audio duration in seconds using macOS 'afinfo'. Returns null if unavailable.
 */
async function getAudioDurationSec(filePath: string): Promise<number | null> {
  if (process.platform !== "darwin") return null;
  return new Promise((resolve) => {
    try {
      const proc = spawn("afinfo", [filePath]);
      let out = "";
      proc.stdout.on("data", (d) => (out += String(d)));
      proc.stderr.on("data", (d) => (out += String(d)));
      proc.on("error", () => resolve(null));
      proc.on("close", () => {
        // Look for a line like: "duration: 3.405000 sec" or "estimated duration: 3.405000 sec"
        const match = out
          .toLowerCase()
          .match(/(estimated\s+)?duration:\s*([0-9.]+)\s*sec/);
        if (match && match[2]) {
          const sec = parseFloat(match[2]);
          if (!Number.isNaN(sec) && Number.isFinite(sec)) return resolve(sec);
        }
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Roughly estimate speech duration based on word count.
 * Assumes about 3.2 words/sec, adds a small constant for latency, clamps to minimum.
 */
function estimateSpeechDurationSec(text: string): number {
  try {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    const wordsPerSec = 3.2; // ~192 wpm
    const baseLatency = 0.3; // small overhead
    const sec = words / wordsPerSec + baseLatency;
    return Math.max(1.5, Math.min(sec, 120));
  } catch {
    return 2.0;
  }
}

function getDefaultSettings() {
  return {
    // General
    startOnBoot: false,
    language: "en",
    theme: "auto",

    // Privacy
    allowScreenCapture: true,
    allowAutoCapture: false,
    allowWebcam: false,
    storageLocation: "local",

    // Personality
    defaultPersonality: "default",
    voiceEnabled: true,
    voiceSpeed: 1.0,

    // Appearance
    windowOpacity: 0.95,
    animationSpeed: 1.0,
    reducedMotion: false,
    bananaSkin: "classic",

    // Productivity
    pomodoroWorkDuration: 25 * 60,
    pomodoroShortBreak: 5 * 60,
    pomodoroLongBreak: 15 * 60,
    proactiveLevel: "medium",

    // Hotkeys
    hotkeys: {
      pushToTalk: "CommandOrControl+Space",
      captureScreen: "CommandOrControl+Shift+C",
      explainThis: "CommandOrControl+Shift+E",
      summarize: "CommandOrControl+Shift+S",
      findErrors: "CommandOrControl+Shift+F",
    },

    // API Keys (loaded from env)
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  };
}
