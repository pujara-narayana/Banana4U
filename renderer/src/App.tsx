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
  const { sendMessage, isLoading, error: aiError } = useBananaAI();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
    error: voiceError,
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
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Get AI response
      const response = await sendMessage(messageText, currentScreenContext);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response
      speak(response);

      // Clear screen context after use
      setCurrentScreenContext(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again! 🍌',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Handle voice transcript
  useEffect(() => {
    if (transcript && transcript.trim() && !isListening) {
      // Voice input complete, send to AI
      console.log('🎤 Sending voice transcript:', transcript);
      handleSendMessage(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

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
      // Clear any previous errors before starting
      startListening();
    }
  };

  const handleSettings = () => {
    // Settings functionality to be implemented
    alert('Settings menu coming soon! 🍌');
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Settings Button - Upper Right */}
      <SettingsButton onClick={handleSettings} />

      {/* Main Content */}
      <div className="relative w-full h-full flex flex-col">
        {/* Banana at top center */}
        <div className="flex-shrink-0 flex justify-center pb-0">
          <Banana state={animationState} />
        </div>

        {/* Chat Messages Area */}
        <div
          ref={chatContainerRef}
          className="overflow-y-auto px-3 pb-20 -mt-2"
          style={{ height: '150px', scrollbarWidth: 'thin' }}
        >
          {voiceError && (
            <div className="text-red-500 text-xs text-center mb-2 px-2">
              {voiceError}
            </div>
          )}
          <div className="max-w-full mx-auto space-y-1.5">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-end mb-1">
                <div className="bg-gray-700 text-white px-2 py-1 rounded-xl rounded-br-sm">
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
