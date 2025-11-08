import React, { useState, useEffect, useRef } from 'react';
import Banana from './components/Banana';
import ChatBubble from './components/ChatBubble';
import ChatInput from './components/ChatInput';
import SettingsButton from './components/SettingsButton';
import { AnimationState, Message } from '../../shared/types';
import { useBananaAI } from './hooks/useBananaAI';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useTextToSpeech } from './hooks/useTextToSpeech';

const App: React.FC = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScreenContext, setCurrentScreenContext] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    error: voiceError,
    isSupported: voiceSupported,
  } = useVoiceInput();
  const { speak, isSpeaking } = useTextToSpeech();

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

  const handleSendMessage = async (messageText: string) => {
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

      // Speak the response
      speak(response);

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
      // Voice input complete, send to AI
      console.log('📝 Sending transcript to AI:', transcript);
      handleSendMessage(transcript);
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
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!voiceSupported) {
        alert('Voice input is not supported in this browser. Please use a Chromium-based browser.');
        return;
      }
      startListening();
    }
  };

  const handleSettings = () => {
    // Settings functionality to be implemented
    alert('Settings menu coming soon! 🍌');
  };

  return (
    <div className="w-full h-full relative overflow-hidden ios-glass-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/10 via-banana-500/8 to-amber-200/10 animate-gradient" />
      <div className="absolute inset-0 backdrop-blur-2xl" />

      {/* Settings Button - Upper Left */}
      <SettingsButton onClick={handleSettings} />

      {/* Main Content */}
      <div className="relative w-full h-full flex flex-col z-10">
        {/* Banana at top center */}
        <div className="flex-shrink-0 pt-8 pb-4 flex justify-center">
          <Banana state={animationState} />
        </div>

        {/* Chat Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 pb-24 scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-end mb-2">
                <div className="glass-bubble px-4 py-2 rounded-2xl rounded-br-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input at bottom */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          isListening={isListening}
        />
      </div>
    </div>
  );
};

export default App;
