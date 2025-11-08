# Banana4U - Development Guide

## 🍌 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key (get from https://makersuite.google.com/app/apikey)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:** (Never commit your real keys. The key you pasted in chat is now exposed – rotate it immediately in the Google Gemini console.)

```bash
cp .env.example .env
```

Then edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

Security Notes:

- Treat API keys like passwords. If a key appears in screenshots, logs, or chat history, rotate it.
- The build injects `process.env.GEMINI_API_KEY` at compile time for the renderer via webpack DefinePlugin.
- For runtime user changes (e.g., settings UI), the explicit key provided there overrides the injected one.

Streaming (optional / experimental):

- A streaming endpoint constant `GEMINI_STREAM` is available. The `GeminiClient.streamResponse()` async generator yields partial text chunks if you integrate it in the UI.

3. **Run in development mode:**

```bash
npm run dev
```

This will:

- Start the webpack dev server on http://localhost:3000
- Launch the Electron app with hot reload

## 🎯 Features Implemented (MVP)

### ✅ Core Features

- **Floating Window**: Always-on-top, draggable, transparent window
- **Animated Banana Avatar**: Multiple animation states (idle, listening, thinking, speaking, happy, etc.)
- **Voice Input**: Web Speech API integration for voice commands (push-to-talk)
- **Text-to-Speech**: Web Speech API for banana's voice responses
- **Screen Capture**: Capture full screen or active window for context-aware assistance
- **Gemini AI Integration**: Context-aware responses using Google Gemini 2.0 Flash
- **Chat Interface**: Clean, glass-morphism UI with chat bubbles
- **Window Controls**: Minimize, close, pin/unpin window

### 🎨 UI Components

- `Banana.tsx` - Animated banana avatar with Framer Motion
- `ChatBubble.tsx` - Message display with fade-in animations
- `ActionBar.tsx` - Voice, text, screen capture, and quick actions buttons
- `ControlBar.tsx` - Window management controls

### 🔧 Services & Hooks

- `gemini-client.ts` - Google Gemini API integration
- `useBananaAI.ts` - Hook for AI conversation management
- `useVoiceInput.ts` - Web Speech API for speech-to-text
- `useTextToSpeech.ts` - Web Speech API for text-to-speech

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start dev server and Electron
npm run dev:renderer     # Start webpack dev server only
npm run dev:electron     # Start Electron only

# Building
npm run build            # Build both renderer and main process
npm run build:renderer   # Build React app with webpack
npm run build:main       # Compile TypeScript for main process

# Packaging
npm run package          # Package for current platform
npm run package:mac      # Package for macOS
npm run package:win      # Package for Windows
npm run package:linux    # Package for Linux

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Run TypeScript type checking
```

## 📁 Project Structure

```
banana4u/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts            # App entry point
│   ├── window.ts           # Window creation and management
│   ├── ipc-handlers.ts     # IPC communication handlers
│   ├── screen-capture.ts   # Screenshot functionality
│   └── hotkey-manager.ts   # Global keyboard shortcuts
│
├── preload/                # Preload script (bridge between main and renderer)
│   └── preload.ts         # Exposes safe APIs to renderer
│
├── renderer/               # React app (renderer process)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API clients
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── styles/            # Global CSS (Tailwind)
│
├── shared/                 # Shared code between processes
│   ├── constants.ts       # App constants
│   └── types.ts           # TypeScript types
│
└── dist/                   # Compiled output
```

## 🎮 How to Use Banana4U

### Basic Interaction

1. **Voice Input** (🎤):

   - Click the microphone button or press `Ctrl/Cmd + Space`
   - Speak your question
   - Release to stop recording
   - Banana will respond with voice and text

2. **Text Input** (⌨️):

   - Click the keyboard button
   - Type your question in the prompt
   - Banana will respond

3. **Screen Capture** (📷):

   - Click the camera button or press `Ctrl/Cmd + Shift + C`
   - Banana captures your screen and analyzes it
   - Automatically asks "What do you see on my screen?"

4. **Window Controls**:
   - **📌 Pin**: Toggle always-on-top behavior
   - **─ Minimize**: Minimize to taskbar
   - **✕ Close**: Close the application

### Animation States

Banana automatically changes animations based on what it's doing:

- **Idle**: Gentle swaying and breathing
- **Listening**: Pulsing glow when recording voice
- **Thinking**: Pondering motion while AI processes
- **Speaking**: Bouncing while speaking response
- **Happy**: Celebration animation (future feature)
- **Confused**: Question mark appears (future feature)

## 🔑 API Keys

### Gemini API (Required)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and add to `.env`:
   ```
   GEMINI_API_KEY=AIzaSy...
   ```

### Optional APIs (Future Enhancement)

- **OpenAI Whisper** (better voice recognition): https://platform.openai.com/api-keys
- **ElevenLabs** (natural TTS): https://elevenlabs.io/

## 🐛 Troubleshooting

### Voice Input Not Working

- **Issue**: Microphone permissions not granted
- **Solution**:
  - macOS: System Settings → Privacy & Security → Microphone → Allow
  - Windows: Settings → Privacy → Microphone → Allow
  - Browser must support Web Speech API (Chrome/Edge recommended)

### Screen Capture Fails

- **Issue**: Screen recording permissions not granted
- **Solution**:
  - macOS: System Settings → Privacy & Security → Screen Recording → Allow Electron
  - May need to restart app after granting permission

### Gemini API Errors

- **"Invalid API key"**: Check that your API key is correct in `.env`
- **"Rate limit exceeded"**: Wait a minute and try again (free tier limits)
- **No response**: Check internet connection

### App Won't Start

1. Clear dist folder: `rm -rf dist`
2. Rebuild: `npm run build:main`
3. Restart: `npm run dev`

### Window Not Visible

- Check if window is off-screen (can happen with multiple monitors)
- Delete stored position: Delete `~/.config/electron/banana4u` (Linux/Mac) or `%APPDATA%\banana4u` (Windows)

## 🎨 Customization

### Change Banana Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  banana: {
    500: '#ffd60a',  // Change this!
    600: '#f0c000',
  }
}
```

### Adjust Window Size

Edit `shared/constants.ts`:

```typescript
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 400,
  // ... change these values
};
```

### Modify Animations

Edit `renderer/src/components/Banana.tsx` - adjust Framer Motion variants:

```typescript
idle: {
  rotate: [0, -2, 2, -2, 0],
  y: [0, -5, 0],
  transition: { duration: 3 }  // Make slower or faster
}
```

## 📝 Next Steps (Phase 2 - Polish & Personality)

From the PRD, here's what to add next:

1. **Personality System**:

   - Create personality selector UI
   - Implement Study, Hype, Chill, Code, and Meme bananas
   - Different system prompts and animations for each

2. **Gamification**:

   - Implement Potassium Points system
   - Track user actions and award points
   - Level progression (Green → Yellow → Spotted → Golden)
   - Achievements system

3. **Enhanced Animations**:

   - Lip-sync with speech (phoneme detection)
   - Particle effects (confetti, sparkles)
   - More expressive emotions
   - Sleeping mode with Z's

4. **Quick Actions Menu**:

   - Explain This
   - Summarize
   - Find Errors
   - Translate
   - Generate Code

5. **Focus Timer**:
   - Pomodoro timer
   - Break reminders
   - Productivity analytics

## 🤝 Contributing

This is a hackathon project! Feel free to:

- Add new personalities
- Create custom banana skins
- Improve animations
- Add new features from the PRD

## 📄 License

MIT License - See LICENSE file for details

---

**Built with 🍌 for BananaHacks 2025 at University of Nebraska-Lincoln**
