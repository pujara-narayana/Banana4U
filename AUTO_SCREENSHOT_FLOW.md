# Auto Screenshot Feature - Flow Diagram

## Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Input                               │
│                  "Can you explain this?"                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     App.tsx                                      │
│                handleSendMessage()                               │
│  • Adds user message to chat                                    │
│  • Checks if manual screen context exists                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               useBananaAI Hook                                   │
│        sendMessageWithAutoScreenshot()                           │
│  • Entry point for intelligent screenshot detection             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GeminiClient                                    │
│           checkIfScreenshotNeeded()                              │
│  • Sends query to Gemini 2.0 Flash                              │
│  • Asks: "Does this query need visual context?"                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
    [Response: "screenshot"]  [Response: "no"]
           │                       │
           │                       │
           ▼                       │
┌─────────────────────┐           │
│  Screen Capture      │           │
│  • HIDES Banana4U    │           │
│    window first      │           │
│  • Waits 100ms       │           │
│  • Captures full     │           │
│    screen via        │           │
│    Electron API      │           │
│  • Base64 encode     │           │
│  • Optimize size     │           │
│  • RESTORES Banana4U │           │
│    window (50ms)     │           │
└──────────┬───────────┘           │
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               useBananaAI Hook                                   │
│               sendMessage()                                      │
│  • Sends message with/without screen context                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GeminiClient                                    │
│             generateResponse()                                   │
│  • Builds full prompt with:                                     │
│    - System prompt                                              │
│    - Conversation history                                       │
│    - Screen context (if available)                              │
│    - User query                                                 │
│  • Sends to Gemini API                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Gemini 2.0 Flash API                          │
│  • Processes image (if provided)                                │
│  • Generates contextualized response                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Response Path                                │
│  • Returns to useBananaAI                                       │
│  • Updates conversation history                                 │
│  • Returns to App.tsx                                           │
│  • Adds assistant message to chat                               │
│  • Triggers text-to-speech                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Decision Tree for Screenshot Detection

```
User Query
    │
    ▼
Contains words like:
"explain", "this", "that",
"here", "analyze", "debug"?
    │
    ├─── YES ──► Likely needs screenshot
    │                 │
    │                 ▼
    │            Ask Gemini to confirm
    │                 │
    │                 ├─── "screenshot" ──► Capture & Send
    │                 │
    │                 └─── "no" ──► Send without capture
    │
    └─── NO ──► Likely doesn't need
                     │
                     ▼
                Ask Gemini to confirm
                     │
                     ├─── "screenshot" ──► Capture & Send
                     │
                     └─── "no" ──► Send without capture
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│   Screenshot Check Fails                │
│   (Network error, API error, etc.)      │
└──────────────┬──────────────────────────┘
               │
               ▼
        [Default to FALSE]
               │
               ▼
    ┌─────────────────────┐
    │ Continue without    │
    │ screenshot          │
    └─────────────────────┘


┌─────────────────────────────────────────┐
│   Screenshot Capture Fails              │
│   (Permission denied, etc.)             │
└──────────────┬──────────────────────────┘
               │
               ▼
        [Log warning]
               │
               ▼
    ┌─────────────────────┐
    │ Continue without    │
    │ screenshot          │
    └─────────────────────┘


┌─────────────────────────────────────────┐
│   Gemini API Fails                      │
│   (Rate limit, timeout, etc.)           │
└──────────────┬──────────────────────────┘
               │
               ▼
        [Throw error]
               │
               ▼
    ┌─────────────────────┐
    │ Show error message  │
    │ to user             │
    └─────────────────────┘
```

## Performance Timeline

```
Time (seconds)
    0        1        2        3        4
    │────────│────────│────────│────────│
    │
    ├─ User types query
    │
    ├─ Screenshot check sent to Gemini ───────┐
    │                                          │ 1-2s
    ├─ Response: "screenshot" ◄───────────────┘
    │
    ├─ Capture screen ──┐
    │                   │ 0.2-0.5s
    ├─ Screenshot ready ◄┘
    │
    ├─ Send full request to Gemini ──────────────────┐
    │                                                 │ 2-4s
    ├─ Response received ◄────────────────────────────┘
    │
    └─ Display to user

Total time with screenshot: ~3-6 seconds
Total time without screenshot: ~2-4 seconds
```

## Component Interaction Diagram

```
┌──────────────────┐
│    App.tsx       │
│  (Main UI)       │
└────────┬─────────┘
         │
         │ uses
         ▼
┌──────────────────┐       ┌────────────────────┐
│  useBananaAI     │◄──────│  GeminiClient      │
│  (Hook)          │ uses  │  (Service)         │
└────────┬─────────┘       └──────────┬─────────┘
         │                             │
         │ calls                       │ calls
         ▼                             ▼
┌──────────────────┐       ┌────────────────────┐
│ window.electron  │       │ Gemini API         │
│ .captureScreen() │       │ (External)         │
└──────────────────┘       └────────────────────┘
```
