# Voice Input Troubleshooting Guide

## Common Issues and Solutions

### 1. Transcription Fails with "[Failed]" or Error Messages

#### Check Browser Console
Open Developer Tools (F12 or Cmd+Option+I) and look at the console logs:

```
🎤 Gemini transcribing...
📊 Audio details: { size: ..., type: ..., base64Length: ... }
📦 Gemini response status: ...
📦 Gemini response: { ... }
```

#### Common Error Types:

##### A. Audio Format Not Supported (400 Error)
**Problem**: Gemini doesn't support your browser's audio format
**Solution**: 
- Use Chrome, Edge, or another Chromium-based browser
- The app now tries multiple formats automatically:
  1. `audio/webm;codecs=opus` (best)
  2. `audio/webm`
  3. `audio/ogg;codecs=opus`
  4. `audio/mp4`
  5. `audio/mpeg`

##### B. Audio Too Short
**Problem**: Recording stopped too quickly (< 100 bytes)
**Solution**:
- Speak for at least 1-2 seconds
- Speak louder/clearer
- Check microphone permissions

##### C. API Key Issues (403 Error)
**Problem**: Invalid or expired Gemini API key
**Solution**:
1. Check `.env` file has valid `GEMINI_API_KEY`
2. Get new key from: https://makersuite.google.com/app/apikey
3. Restart the app after updating `.env`

##### D. Rate Limit (429 Error)
**Problem**: Too many API requests
**Solution**:
- Wait 1-2 minutes before trying again
- Consider upgrading Gemini API plan

##### E. Network/Timeout Errors
**Problem**: Connection issues or slow response
**Solution**:
- Check internet connection
- Try with shorter recordings
- Increase timeout in code (currently 30 seconds)

### 2. Microphone Not Working

#### Check Permissions
1. Browser should prompt for microphone access
2. Check browser settings → Privacy → Microphone
3. Ensure Banana4U has permission

#### Check System Settings
**macOS**:
- System Preferences → Security & Privacy → Microphone
- Enable for your browser

**Windows**:
- Settings → Privacy → Microphone
- Enable for your browser

### 3. Conversational Mode Issues

#### Voice Not Detected
**Thresholds** (adjustable in code):
- `VOICE_THRESHOLD: 50` - Volume to detect speech
- `SILENCE_THRESHOLD: 30` - Volume considered silence
- `SILENCE_DURATION: 1500ms` - How long to wait after silence

**Solutions**:
- Speak louder
- Reduce background noise
- Lower VOICE_THRESHOLD in code (make more sensitive)
- Move closer to microphone

#### Stops Recording Too Early
**Solution**:
- Increase `SILENCE_DURATION` (currently 1.5 seconds)
- Speak more continuously without long pauses

#### Never Stops Recording
**Solution**:
- Ensure you pause for 1.5+ seconds
- Check for background noise triggering voice detection
- Increase `VOICE_THRESHOLD` (less sensitive)

### 4. Debugging Steps

#### Step 1: Check API Key
```javascript
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
```

#### Step 2: Check Audio Format Support
Open console and run:
```javascript
const types = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];
types.forEach(type => {
  console.log(type, MediaRecorder.isTypeSupported(type));
});
```

#### Step 3: Monitor Audio Recording
Watch console logs:
- ✅ Shows successful steps
- ⚠️ Shows warnings
- ❌ Shows errors
- 📊 Shows audio details

#### Step 4: Test Microphone Levels
Check the audio context is getting data:
- Voice activity detection logs show average audio level
- Should be > 50 when speaking
- Should be < 30 when silent

### 5. Advanced Solutions

#### Option A: Use OpenAI Whisper Instead
Gemini's audio transcription is experimental. For better reliability:

1. Get OpenAI API key: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Modify `useVoiceInput.ts` to use Whisper API instead

#### Option B: Use Browser's Web Speech API
Built-in browser speech recognition (works offline):
- More reliable for some use cases
- Works without API calls
- Limited to supported browsers

#### Option C: Adjust Audio Quality
In `useVoiceInput.ts`, modify:
```javascript
audioBitsPerSecond: 128000, // Try 96000 or 64000 for smaller files
```

### 6. Error Message Reference

| Message | Cause | Solution |
|---------|-------|----------|
| "Audio too short" | Recording < 100 bytes | Speak longer |
| "Audio format not supported" | Browser audio format incompatible | Use Chrome/Edge |
| "API rate limit reached" | Too many requests | Wait and retry |
| "API key invalid or expired" | Bad GEMINI_API_KEY | Check .env file |
| "Request timeout" | Transcription taking > 30s | Use shorter audio |
| "Network connection issue" | Internet problems | Check connection |
| "Content blocked by safety filters" | Audio flagged by Gemini | Speak different content |

### 7. Performance Optimization

#### Reduce Latency
1. Use faster internet connection
2. Speak concisely (shorter recordings = faster processing)
3. Consider upgrading to Gemini Pro plan

#### Improve Accuracy
1. Speak clearly and at moderate pace
2. Reduce background noise
3. Use good quality microphone
4. Ensure proper microphone positioning

### 8. Still Having Issues?

#### Collect Debug Information
1. Open DevTools Console (F12)
2. Try voice input
3. Copy all console logs
4. Note:
   - Browser name and version
   - Operating system
   - Exact error message
   - Audio details from logs

#### Check Gemini API Status
- Visit: https://status.cloud.google.com/
- Check for API outages

#### Try Simple Test
Create a minimal test:
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone works!');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));
```

## Getting Help

If issues persist:
1. Check GitHub Issues
2. Review console logs carefully
3. Test with different browsers
4. Verify API key is valid and has quota
5. Check internet connection stability
