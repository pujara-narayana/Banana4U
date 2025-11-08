# 🍌 Banana4U

**An AI-powered desktop companion featuring a playful banana avatar**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built for BananaHacks](https://img.shields.io/badge/Built%20for-BananaHacks%202025-FFD60A)]()

> Banana4U is your friendly AI assistant that understands what you're working on and helps you succeed through voice, text, and screen analysis - all wrapped in a delightful banana package! 🍌

---

## ✨ Features (MVP)

### 🎤 **Voice Interaction**
Talk to your banana! Just press `Ctrl/Cmd + Space` and ask anything. Banana listens, understands, and responds with voice.

### 👀 **Screen Context Awareness**
Banana can see your screen when you ask. Perfect for:
- Debugging code errors
- Explaining complex content
- Analyzing documents
- Getting help with what you're working on

### 💬 **Natural Conversations**
Powered by Google Gemini 2.0 Flash, Banana maintains context across conversations and provides helpful, concise responses.

### 🎨 **Animated Personality**
Watch Banana come alive with fluid animations:
- 💤 Gentle swaying when idle
- 👂 Pulsing glow when listening
- 🤔 Pondering when thinking
- 🗣️ Bouncing when speaking

### 🪟 **Always There**
Floating window that stays on top (or not - your choice). Never disruptive, always available.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get one free](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-team/banana4u.git
cd banana4u

# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the app
npm run dev
```

The banana window will appear on your screen! 🍌

---

## 📖 How to Use

### Voice Input (Recommended)
1. Click the 🎤 button or press `Ctrl/Cmd + Space`
2. Ask your question out loud
3. Banana processes and responds with voice

### Text Input
1. Click the ⌨️ button
2. Type your question
3. Get instant responses

### Screen Analysis
1. Click the 📷 button or press `Ctrl/Cmd + Shift + C`
2. Banana captures your screen
3. Automatically analyzes and explains what it sees

---

## 🎯 Use Cases

### For Students 📚
- "Explain this code error on my screen"
- "Help me understand this concept"
- "Summarize this article"
- "What's the syntax for..."

### For Developers 💻
- "Debug this error message"
- "Review this code"
- "What does this function do?"
- "Suggest improvements"

### For Everyone 🌟
- "What's on my screen?"
- "Help me focus"
- "Motivate me!"
- "Tell me a banana joke"

---

## 🛠️ Technology Stack

- **Framework**: Electron (cross-platform desktop)
- **UI**: React + TypeScript + Tailwind CSS
- **Animation**: Framer Motion
- **AI**: Google Gemini 2.0 Flash
- **Voice**: Web Speech API (STT & TTS)
- **Build**: Webpack + TypeScript

---

## 📁 Project Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development guide, API setup, and troubleshooting
- **[PRD.md](./PRD.md)** - Full Product Requirements Document with all planned features

---

## 🎨 Screenshots

### Main Window
![Banana4U Main Window](https://via.placeholder.com/400x600/FFD60A/000000?text=Banana+Avatar+Here)

### Listening State
![Listening](https://via.placeholder.com/400x600/FFD60A/000000?text=Listening...)

### Thinking State
![Thinking](https://via.placeholder.com/400x600/FFD60A/000000?text=Thinking...)

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Floating window with animations
- [x] Voice input/output
- [x] Screen capture
- [x] Gemini AI integration
- [x] Basic UI and controls

### 🚧 Phase 2: Polish & Personality (Next)
- [ ] Multiple personalities (Study, Hype, Chill, Code, Meme)
- [ ] Gamification (Potassium Points!)
- [ ] Enhanced animations & lip-sync
- [ ] Quick Actions menu
- [ ] Settings panel

### 🌟 Phase 3: Advanced Features
- [ ] Focus timer (Pomodoro)
- [ ] Conversation memory
- [ ] Proactive assistance
- [ ] Custom banana skins
- [ ] Collaborative features

---

## 🐛 Troubleshooting

**Voice not working?**
- Grant microphone permissions in system settings
- Use Chrome/Edge (better Web Speech API support)

**Screen capture failing?**
- Grant screen recording permissions (macOS)
- Restart app after permission changes

**API errors?**
- Check your `GEMINI_API_KEY` in `.env`
- Verify internet connection
- Check API rate limits

More help: [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting)

---

## 🤝 Contributing

Built for BananaHacks 2025! Contributions welcome:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- Built for **BananaHacks 2025** at University of Nebraska-Lincoln
- Powered by **Google Gemini 2.0 Flash**
- Inspired by the joy of bananas 🍌

---

<p align="center">
  <strong>Made with 🍌 and ❤️</strong><br>
  <em>Because every developer deserves a friendly banana companion</em>
</p>
