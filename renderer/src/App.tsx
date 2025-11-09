import React, { useState, useEffect, useRef } from 'react';
import Banana from './components/Banana';
import ChatInput from './components/ChatInput';
import SettingsButton from './components/SettingsButton';
import SettingsPanel from './components/SettingsPanel';
import { AnimationState, Message, PersonalityType } from '../../shared/types';
import { useBananaAI } from './hooks/useBananaAI';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import Welcome from './components/Welcome';
import ChatView from './components/ChatView';

const App: React.FC = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScreenContext, setCurrentScreenContext] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [personality, setPersonality] = useState<PersonalityType>('default');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [bananaScale, setBananaScale] = useState(1);

  // Hooks
  const {
    sendMessage,
    sendMessageWithAutoScreenshot,
    isLoading,
    error: aiError
  } = useBananaAI();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
    error: voiceError,
    isConversationalMode,
    startConversationalMode,
    stopConversationalMode,
    setSpeakingCallback,
    setStopSpeakingCallback,
    setMuteSpeakingCallback,
    setUnmuteSpeakingCallback,
    setLastAIResponse,
  } = useVoiceInput();
  const { speak, isSpeaking, stop: stopSpeaking, mute: muteSpeaking, unmute: unmuteSpeaking } = useTextToSpeech();

  // Load personality from settings
  useEffect(() => {
    const loadPersonality = async () => {
      try {
        const settings = await window.electron.getSettings();
        setPersonality(settings.defaultPersonality || 'default');
      } catch (error) {
        console.error('Failed to load personality:', error);
      }
    };
    loadPersonality();
  }, []);

  // Update personality when settings change (e.g., when settings panel closes)
  useEffect(() => {
    if (!isSettingsOpen) {
      const loadPersonality = async () => {
        try {
          const settings = await window.electron.getSettings();
          setPersonality(settings.defaultPersonality || 'default');
        } catch (error) {
          console.error('Failed to load personality:', error);
        }
      };
      loadPersonality();
    }
  }, [isSettingsOpen]);

  // --- Mascot Scaling with Window Size ---
  useEffect(() => {
    const handleResize = () => {
      // Base size for scaling calculations
      const baseWidth = 300;
      const baseHeight = 450;

      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;

      // Use the smaller of the two scale factors to maintain aspect ratio
      const newScale = Math.min(scaleX, scaleY);

      // Clamp the scale to prevent it from becoming too small or excessively large
      setBananaScale(Math.max(0.5, Math.min(newScale, 2.5)));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up speaking callbacks for conversational mode
  useEffect(() => {
    setSpeakingCallback(() => isSpeaking);
    setStopSpeakingCallback(() => stopSpeaking);
    setMuteSpeakingCallback(() => muteSpeaking);
    setUnmuteSpeakingCallback(() => unmuteSpeaking);
  }, [isSpeaking, setSpeakingCallback, stopSpeaking, setStopSpeakingCallback, muteSpeaking, setMuteSpeakingCallback, unmuteSpeaking, setUnmuteSpeakingCallback]);

  // Update animation state based on various states
  useEffect(() => {
    if (isListening) {
      setAnimationState('listening');
    } else if (isLoading) {
      setAnimationState('thinking');
    } else if (isSpeaking) {
      setAnimationState('speaking');
    } else {
      setAnimationState('idle');
    }
  }, [isListening, isLoading, isSpeaking]);

  // Send a message to AI. Control speech via options.speakOutLoud or conversational mode
  const handleSendMessage = async (
    messageText: string,
    options?: { speakOutLoud?: boolean }
  ) => {
    if (!messageText.trim()) return;

    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Use auto-screenshot feature if no manual screen context was provided
      // This will automatically capture screen if Gemini detects phrases like "explain this"
      const response = currentScreenContext
          ? await sendMessage(messageText, currentScreenContext)
          : await sendMessageWithAutoScreenshot(messageText);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Store AI response for voice filtering
      setLastAIResponse(response);

      // Speak only when explicitly requested (voice flows) or in conversational mode
      const shouldSpeak = options?.speakOutLoud === true || isConversationalMode;
      if (shouldSpeak) {
        speak(response);
      }

      // Clear screen context after use
      setCurrentScreenContext(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again! 🍌",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      // Don't send error messages to AI
      if (transcript.startsWith("Oops!") || transcript === "[Failed]") {
        console.log('⚠️ Skipping error message:', transcript);
        // Display error to user without sending to AI
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: transcript,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      // Voice input complete, send to AI and speak back
      console.log('📝 Sending transcript to AI:', transcript);
      handleSendMessage(transcript, { speakOutLoud: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  // Show voice errors
  useEffect(() => {
    if (voiceError) {
      console.error('🎤 Voice error:', voiceError);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🎤 ${voiceError}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [voiceError]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      // Use smooth scrolling for better UX
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!voiceSupported) {
        alert('Voice input is not supported in this browser. Please use a Chromium-based browser.');
        return;
      }
      // Clear any previous errors before starting
      startListening();
    }
  };

  const handleConversationalMode = () => {
    if (isConversationalMode) {
      stopConversationalMode();
    } else {
      if (!voiceSupported) {
        alert('Voice input is not supported in this browser. Please use a Chromium-based browser.');
        return;
      }

      // Warn user about headphones for best experience
      const hasSeenWarning = localStorage.getItem('conversational-mode-warning-seen');
      if (!hasSeenWarning) {
        const useHeadphones = confirm(
            '🎧 Conversational Mode works best with HEADPHONES!\n\n' +
            'Without headphones, the microphone may pick up the AI\'s voice from your speakers.\n\n' +
            '✅ Click OK if you\'re using headphones\n' +
            '❌ Click Cancel to setup headphones first'
        );

        if (!useHeadphones) {
          return;
        }

        localStorage.setItem('conversational-mode-warning-seen', 'true');
      }

      startConversationalMode();
    }
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleShowWelcome = () => {
    setIsSettingsOpen(false); // Close settings panel
    setShowWelcome(true);
  };

  // Fallback wheel scroll routing (helps when Electron transparent window or overlay blocks native bubbling)
  useEffect(() => {
    if (isSettingsOpen) return; // Don't hijack wheel while settings panel is open
    const handleWheel = (e: WheelEvent) => {
      if (!chatContainerRef.current) return;
      // If the event target is outside the scroll area or the scroll area isn't the scrolling element, force scroll
      const target = e.target as HTMLElement;
      const withinChat = chatContainerRef.current.contains(target);
      if (!withinChat || chatContainerRef.current === document.activeElement) {
        // Apply delta manually
        chatContainerRef.current.scrollTop += e.deltaY;
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isSettingsOpen]);

  if (showWelcome) {
    return <Welcome onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <div className="w-full h-full relative ios-glass-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/10 via-banana-500/8 to-amber-200/10 animate-gradient" />
      <div className="absolute inset-0 backdrop-blur-2xl" />

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onShowWelcome={handleShowWelcome} />

      {/* Main Content - Hide when settings are open */}
      {!isSettingsOpen && (
        <>
          {/* Settings Button - Upper Left */}
          <SettingsButton onClick={handleSettings} />

          <div className="relative w-full h-full flex flex-col z-10">
            {/* Banana at top center */}
            <div
              className="flex-shrink-0 pt-8 pb-4 flex justify-center animate-subtle-scale"
              style={{
                transform: `scale(${bananaScale})`,
                transition: 'transform 0.2s ease-out',
              }}>
              <Banana state={animationState} personality={personality} />
            </div>

            {/* Chat Messages Area */}
            <div
              ref={chatContainerRef}
              className="no-drag flex-1 overflow-y-scroll px-4 pb-24 overscroll-contain"
              style={{
                scrollbarWidth: 'thin',
                touchAction: 'pan-y',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
              }}
            >
              <ChatView messages={messages} isLoading={isLoading} voiceError={voiceError} />
            </div>

            {/* Chat Input at bottom - Positioned absolutely to not interfere with chat area scroll height */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-20 pointer-events-none">
              <ChatInput
                // Typed questions: do NOT speak back
                onSendMessage={(text) => handleSendMessage(text, { speakOutLoud: false })}
                onVoiceInput={handleVoiceInput}
                onConversationalMode={handleConversationalMode}
                isListening={isListening}
                isConversationalMode={isConversationalMode}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;