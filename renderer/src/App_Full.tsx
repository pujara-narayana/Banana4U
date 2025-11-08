import React, { useState, useEffect } from 'react';
import Banana from './components/Banana';
import ChatBubble from './components/ChatBubble';
import ActionBar from './components/ActionBar';
import ControlBar from './components/ControlBar';
import { AnimationState, Message } from '../../shared/types';
import { useBananaAI } from './hooks/useBananaAI';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useTextToSpeech } from './hooks/useTextToSpeech';

const App: React.FC = () => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScreenContext, setCurrentScreenContext] = useState<any>(null);

  // Hooks
  const { sendMessage, isLoading, error: aiError } = useBananaAI();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
  } = useVoiceInput();
  const { speak, isSpeaking } = useTextToSpeech();

  // Get the latest assistant message to display in chat bubble
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

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

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      // Voice input complete, send to AI
      handleSendMessage(transcript);
    }
  }, [transcript, isListening]);

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

  const handleTextInput = () => {
    const text = prompt('What would you like to ask Banana?');
    if (text) {
      handleSendMessage(text);
    }
  };

  const handleScreenCapture = async () => {
    try {
      const screenshot = await window.electron.captureScreen('full');
      setCurrentScreenContext(screenshot);

      // Automatically ask about the screen
      const question = 'What do you see on my screen?';
      handleSendMessage(question);
    } catch (error) {
      console.error('Failed to capture screen:', error);
      alert('Failed to capture screen. Please try again.');
    }
  };

  const handleQuickActions = () => {
    // Quick actions menu (to be implemented)
    alert('Quick actions menu coming soon! 🍌');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 relative">
      {/* Control Bar (top) */}
      <ControlBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Chat Bubble (above banana) */}
        {latestMessage && latestMessage.role === 'assistant' && (
          <div className="mb-4">
            <ChatBubble message={latestMessage} />
          </div>
        )}

        {/* Banana Avatar */}
        <Banana state={animationState} />

        {/* Status indicators */}
        {aiError && (
          <div className="mt-2 text-red-400 text-xs max-w-xs text-center">
            {aiError}
          </div>
        )}
        {currentScreenContext && (
          <div className="mt-2 text-green-400 text-xs">
            📷 Screen captured
          </div>
        )}
      </div>

      {/* Action Bar (bottom) */}
      <ActionBar
        onVoiceInput={handleVoiceInput}
        onTextInput={handleTextInput}
        onScreenCapture={handleScreenCapture}
        onQuickActions={handleQuickActions}
        isListening={isListening}
      />

      {/* Stats Bar */}
      <div className="mt-2 flex items-center gap-4 text-xs text-white">
        <span className="flex items-center gap-1">
          ⚡ <span className="font-semibold">0</span> pts
        </span>
        <span className="flex items-center gap-1">
          🔥 <span className="font-semibold">0</span> day streak
        </span>
      </div>
    </div>
  );
};

export default App;
