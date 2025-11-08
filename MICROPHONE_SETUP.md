# Microphone Setup Guide

## Important: Use ONLY Physical Microphone

Banana4U is configured to **ONLY use your physical microphone** and will **REJECT system audio** devices to prevent feedback loops.

## ✅ Correct Setup

### What to Use:
- **Built-in laptop microphone** ✅
- **External USB microphone** ✅
- **Headset microphone** ✅
- **Bluetooth headset** ✅
- **Webcam microphone** ✅

### Browser Permissions
When you first click the voice or conversational button:
1. Browser will ask for microphone permission
2. **Select a PHYSICAL MICROPHONE device**
3. Click "Allow"

## ❌ What NOT to Use

The app will automatically **REJECT** these audio sources:
- ❌ Loopback devices
- ❌ Stereo Mix
- ❌ System Audio
- ❌ "What U Hear"
- ❌ Wave Out Mix
- ❌ Speaker output
- ❌ Any output device

### Why?
These devices capture your computer's audio output (including the AI's voice), creating a feedback loop where the AI listens to itself.

## macOS Setup

### Check System Preferences
1. **System Preferences → Sound → Input**
2. Ensure a physical microphone is selected:
   - "MacBook Pro Microphone" ✅
   - "External Microphone" ✅
   - "Built-in Microphone" ✅
3. NOT "Multi-Output Device" or similar

### Browser Permissions
1. **System Preferences → Security & Privacy → Privacy → Microphone**
2. Enable for your browser (Chrome, Safari, Edge)

### Test Microphone
In System Preferences → Sound → Input:
- Speak into microphone
- Watch the "Input level" bars move
- If they don't move, microphone isn't working

## Windows Setup

### Check Sound Settings
1. **Settings → System → Sound → Input**
2. Select a physical microphone:
   - "Microphone (Device Name)" ✅
   - "Built-in Microphone" ✅
3. NOT "Stereo Mix" or "What U Hear"

### Disable System Audio Devices
1. Right-click speaker icon → **Sounds**
2. Go to **Recording** tab
3. Right-click "Stereo Mix" or similar → **Disable**

### Browser Permissions
1. **Settings → Privacy & security → Microphone**
2. Enable for your browser

## Troubleshooting

### "System audio device detected" Error

**Message:** "❌ System audio detected! Please select a physical microphone, not system audio/loopback device."

**Solution:**
1. Check your system's audio input settings
2. Disable loopback/stereo mix devices
3. Select a physical microphone
4. Reload the app
5. Try voice input again

### Browser Keeps Selecting Wrong Device

**Solution:**
1. Go to browser microphone settings
2. Chrome: `chrome://settings/content/microphone`
3. Remove or reset permissions for Banana4U
4. Reload and try again - select correct device

### Console Shows Wrong Device

Check browser console (F12) for:
```
🎤 Available audio inputs: [device list]
🎤 Audio track details: { label: "..." }
```

If you see "Stereo Mix", "Loopback", or "System Audio":
- That's the problem!
- Change system settings to disable those devices
- Select a physical microphone instead

### Microphone Works But Still Picks Up System Audio

This usually means:
1. **Speakers too loud** - Lower speaker volume or use headphones
2. **Microphone too sensitive** - Move away from speakers
3. **Echo cancellation off** - The app enables it, but some systems don't support it well

**Best Solution:** Use headphones! 🎧
- Prevents speakers from playing into microphone
- Eliminates all feedback issues
- Better conversation quality

## How Banana4U Prevents System Audio

### Automatic Detection

The app checks for these keywords in the audio device label:
- "loopback"
- "stereo mix"
- "system audio"
- "what u hear"
- "wave out"
- "speakers"
- "output"

If detected → **Immediately rejects** and alerts you

### Advanced Constraints

Uses these audio constraints:
```javascript
{
  echoCancellation: true,      // Removes echo
  noiseSuppression: true,       // Reduces background noise
  autoGainControl: true,        // Normalizes volume
  googEchoCancellation: true,   // Chrome-specific echo removal
  googNoiseSuppression: true,   // Chrome-specific noise reduction
  mediaSource: 'microphone',    // Explicitly request microphone
}
```

### Verification Logging

Check the console for:
```
✅ Verified microphone input (not system audio)
```

If you see:
```
❌ Detected system audio device: "..."
```
Then the device was rejected.

## Best Practices

### For Best Voice Recognition:
1. ✅ Use a good quality microphone
2. ✅ Speak clearly, 6-12 inches from mic
3. ✅ Minimize background noise
4. ✅ Use headphones to eliminate feedback
5. ✅ Test microphone before using conversational mode

### For Conversational Mode:
1. ✅ **ALWAYS use headphones**
2. ✅ Wait for visual "Listening..." indicator
3. ✅ Speak after AI finishes talking
4. ✅ Pause 1.5+ seconds to signal you're done
5. ✅ Keep environment quiet

### What to Avoid:
1. ❌ Using speakers while in conversational mode
2. ❌ Selecting system audio/loopback devices
3. ❌ Having music or videos playing
4. ❌ Multiple microphones enabled simultaneously
5. ❌ Speaking while AI is still talking

## Testing Your Setup

### Quick Microphone Test:

1. Open browser console (F12)
2. Run this test:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const track = stream.getAudioTracks()[0];
    console.log('Microphone:', track.label);
    console.log('Settings:', track.getSettings());
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('Error:', err));
```

3. Check output:
   - Should show your physical microphone name
   - Should NOT show "Stereo Mix", "Loopback", etc.

## Still Having Issues?

### Check These:
1. ☑ Physical microphone is connected and working
2. ☑ System input device is set to microphone
3. ☑ Browser has microphone permission
4. ☑ No loopback/stereo mix devices enabled
5. ☑ Using headphones (not speakers)
6. ☑ Microphone volume is adequate
7. ☑ No other apps using the microphone

### Get Help:
1. Check browser console logs
2. Verify device selection in system settings
3. Try different browser
4. Restart browser/system
5. Check GitHub Issues for similar problems

## Summary

✅ **DO:** Use physical microphone + headphones  
❌ **DON'T:** Use system audio/loopback devices  
🎧 **BEST:** Headset with built-in microphone  

This ensures clean audio input with no feedback! 🎤
