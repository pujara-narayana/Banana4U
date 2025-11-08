# Conversational Mode Feature

## Overview
The Conversational Mode is a hands-free, continuous voice interaction feature that allows natural back-and-forth conversations with Banana4U AI assistant.

## How It Works

### Activation
- Click the **purple MessageCircle button** (💬) next to the microphone button
- The button will pulse to indicate active conversational mode
- A status indicator shows "Conversational: Waiting..." or "Conversational: Listening..."

### Voice Activity Detection
The system uses advanced voice activity detection that:
1. **Waits for voice input** - Continuously monitors audio for speech
2. **Auto-starts recording** - Begins recording when voice is detected (volume > threshold)
3. **Auto-stops recording** - Stops after 1.5 seconds of silence
4. **Transcribes speech** - Sends audio to Gemini AI for transcription
5. **Gets AI response** - Processes your question and speaks the answer
6. **Continues listening** - Automatically starts waiting for next input

### Technical Details

#### Voice Detection Parameters
- **Voice Threshold**: 50 (volume level to detect speech)
- **Silence Threshold**: 30 (volume level considered silence)
- **Silence Duration**: 1500ms (1.5 seconds of quiet triggers stop)
- **Audio Settings**:
  - Sample Rate: 16kHz
  - Channels: 1 (mono)
  - Echo Cancellation: Enabled
  - Noise Suppression: Enabled

#### Continuous Loop
```
While Conversational Mode Active:
  1. Monitor audio for voice activity
  2. When voice detected → Start recording
  3. Monitor for silence
  4. When silence detected (1.5s) → Stop recording
  5. Transcribe audio with Gemini
  6. Send transcript to AI
  7. AI responds and speaks answer
  8. Wait 2 seconds
  9. Return to step 1
```

## User Interface

### Status Indicators
- **Purple pulsing button**: Conversational mode is active
- **"Conversational: Waiting..."**: Ready for voice input
- **"Conversational: Listening..."**: Currently recording your speech

### Button States
- **Conversational Mode Button (Purple/MessageCircle)**:
  - Default: Purple, click to start conversational mode
  - Active: Purple with pulse animation, click to stop
  
- **Voice Input Button (Blue/Mic)**:
  - Disabled while conversational mode is active
  - Use for single voice commands when not in conversational mode

## Use Cases

### Perfect For:
- 🗣️ Extended conversations requiring multiple questions
- 🤝 Natural dialogue without repeated button clicks
- 📚 Learning sessions with follow-up questions
- 🎯 Task sequences requiring back-and-forth clarification

### Example Conversation Flow:
```
User: "What's the weather today?"
AI: [speaks answer]
[Auto-listens]
User: "Should I bring an umbrella?"
AI: [speaks answer]
[Auto-listens]
User: "Thanks!"
```

## Technical Implementation

### Files Modified
1. **`useVoiceInput.ts`**: Added conversational mode logic and voice activity detection
2. **`ChatInput.tsx`**: Added conversational mode button and status indicators
3. **`App.tsx`**: Integrated conversational mode handlers

### Key Features
- Real-time audio analysis using Web Audio API
- AudioContext and AnalyserNode for voice detection
- Automatic cleanup of audio streams and contexts
- Graceful error handling and recovery

## Tips for Best Experience

1. **Speak Clearly**: Wait for "Listening..." indicator before speaking
2. **Natural Pauses**: Pause for 1.5+ seconds to signal end of speech
3. **Quiet Environment**: Reduce background noise for better detection
4. **Browser Support**: Use Chrome, Edge, or Safari for best results
5. **Stop When Done**: Click the button again to exit conversational mode

## Stopping Conversational Mode
- Click the purple MessageCircle button again
- All audio streams and contexts are automatically cleaned up
- Returns to normal operation mode

## Future Enhancements
- [ ] Adjustable sensitivity settings
- [ ] Customizable silence duration
- [ ] Visual waveform display
- [ ] Interrupt detection (speak while AI is responding)
- [ ] Multiple language support
- [ ] Noise gate improvements
