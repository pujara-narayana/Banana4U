# Auto Screenshot Feature 📸

## Overview
This feature automatically detects when a user's query would benefit from screen context and captures a screenshot in the background without manual intervention. **The Banana4U interface is excluded from auto-captures**, so only the content you're working on is visible to Gemini.

## How It Works

### 1. **User Query Analysis**
When a user sends a message (e.g., "can you explain this"), the system first sends the query to Gemini 2.0 Flash to determine if a screenshot would be helpful.

### 2. **Screenshot Detection Logic**
Gemini analyzes the query for patterns such as:
- Questions asking to explain something visible (e.g., "explain this", "what is this")
- Queries using demonstrative pronouns without context ("this", "that", "here")
- Requests to analyze, debug, or review code/content
- Questions about visual elements on screen

### 3. **Automatic Capture (Without Banana4U)**
If Gemini responds with "screenshot", the system:
1. **Temporarily hides the Banana4U window** (for ~100ms)
2. Automatically captures a full screenshot of all other visible windows
3. **Restores the Banana4U window**
4. Attaches the screenshot to the original query
5. Sends the enhanced query (with screenshot) back to Gemini
6. Returns the contextualized response

This ensures that your AI assistant sees only your work content, not its own interface.

### 4. **Fallback Handling**
- If screenshot capture fails, the query proceeds without it
- If screenshot detection fails, it defaults to no screenshot
- User experience is never blocked by the feature

## Implementation Details

### Modified Files

#### 1. `renderer/src/services/gemini-client.ts`
Added new method:
```typescript
async checkIfScreenshotNeeded(userQuery: string): Promise<boolean>
```
This method sends a specialized prompt to Gemini asking it to determine if the query needs visual context.

#### 2. `renderer/src/hooks/useBananaAI.ts`
Added new method:
```typescript
sendMessageWithAutoScreenshot(message: string): Promise<string>
```
This orchestrates the entire flow:
1. Checks if screenshot is needed
2. Captures screen if required (with `excludeBanana4U: true`)
3. Sends message with appropriate context

#### 3. `renderer/src/App.tsx`
Updated `handleSendMessage` to use the auto-screenshot feature by default:
```typescript
const response = currentScreenContext 
  ? await sendMessage(messageText, currentScreenContext)
  : await sendMessageWithAutoScreenshot(messageText);
```

#### 4. `main/screen-capture.ts`
Enhanced screen capture with window exclusion:
```typescript
async function captureScreenExcludingBanana4U()
```
- Temporarily hides Banana4U window
- Captures screen with only user's work visible
- Restores window visibility after capture

#### 5. `main/ipc-handlers.ts`, `preload/preload.ts`, `shared/types.ts`
Updated to support `excludeBanana4U` parameter in the capture API.

## Usage Examples

### Queries That Trigger Auto-Screenshot:
- ✅ "Can you explain this?"
- ✅ "What does this mean?"
- ✅ "Help me understand this code"
- ✅ "What is this error?"
- ✅ "Analyze this"
- ✅ "Debug this function"

### Queries That Don't Trigger Auto-Screenshot:
- ❌ "What is a function?"
- ❌ "How do I write a loop?"
- ❌ "Explain machine learning"
- ❌ "What's the weather today?"
- ❌ "Tell me a joke"

## Benefits

1. **Seamless UX**: No need for users to manually capture screenshots
2. **Context-Aware**: Only captures when actually needed
3. **Intelligent**: Uses AI to determine necessity
4. **Clean Captures**: Excludes the Banana4U interface, showing only relevant content
5. **Non-Intrusive**: Window hiding/showing happens in ~100-150ms, barely noticeable
6. **Fail-Safe**: Continues working even if capture fails
7. **Backward Compatible**: Existing manual screenshot functionality still works

## Configuration

The feature respects the user's privacy settings:
- Requires `allowScreenCapture: true` in settings
- Can be disabled by setting `allowAutoCapture: false`
- Always uses full screen capture mode for consistency

## Performance Considerations

- Screenshot detection adds ~1-2 seconds to the first request
- Actual screenshot capture is fast (~200-500ms)
- Total overhead is minimal and asynchronous
- No impact on queries that don't need screenshots

## Future Enhancements

Potential improvements:
1. Add setting to customize auto-capture behavior
2. Support different capture modes (active window, region)
3. Cache screenshot for follow-up questions
4. Add visual indicator when auto-capture is happening
5. Allow user to preview/approve screenshot before sending

## Technical Notes

- Uses Gemini 2.0 Flash's vision capabilities
- Screenshots are base64 encoded
- Images are optimized to 1920x1080 max resolution
- PNG format with 80% quality for optimal size/quality balance
- All captures are temporary and not persisted
- **Window hiding is fast**: ~100ms to hide, ~50ms to restore
- Uses Electron's `BrowserWindow.hide()` and `show()` APIs
- Screen capture refresh ensures Banana4U is not in the image

## Troubleshooting

### Screenshot Not Capturing?
- Check `allowScreenCapture` setting
- Verify Gemini API key is valid
- Check console for error messages

### False Positives/Negatives?
- The detection prompt can be tuned in `gemini-client.ts`
- Temperature is set to 0.3 for consistent detection
- Adjust the prompt if needed for your use case

## Security & Privacy

- Screenshots are never stored permanently
- Only sent to Gemini API if explicitly needed
- User can disable auto-capture in settings
- Screen data is cleared after each response
