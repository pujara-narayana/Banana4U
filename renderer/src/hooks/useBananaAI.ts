import { useState, useCallback, useEffect } from 'react';
import GeminiClient, { ConversationMessage } from '../services/gemini-client';
import { PersonalityType, ScreenContext } from '../../../shared/types';

interface UseBananaAIResult {
  sendMessage: (message: string, screenContext?: ScreenContext) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  conversationHistory: ConversationMessage[];
  clearHistory: () => void;
  personality: PersonalityType;
  setPersonality: (personality: PersonalityType) => void;
}

export const useBananaAI = (): UseBananaAIResult => {
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [personality, setPersonality] = useState<PersonalityType>('default');

  // Initialize Gemini client
  useEffect(() => {
    const initClient = async () => {
      try {
        const settings = await window.electron.getSettings();
        if (settings.geminiApiKey) {
          const client = new GeminiClient(settings.geminiApiKey);
          setGeminiClient(client);
        } else {
          setError('No Gemini API key found. Please add your API key in settings.');
        }
      } catch (err) {
        console.error('Failed to initialize Gemini client:', err);
        setError('Failed to initialize AI client');
      }
    };

    initClient();
  }, []);

  const sendMessage = useCallback(
    async (message: string, screenContext?: ScreenContext): Promise<string> => {
      if (!geminiClient) {
        const errorMsg = 'Gemini client not initialized';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      try {
        // Add user message to history
        const userMessage: ConversationMessage = {
          role: 'user',
          content: message,
        };

        const newHistory = [...conversationHistory, userMessage];

        // Get response from Gemini
        const response = await geminiClient.generateResponse(
          message,
          screenContext,
          conversationHistory,
          personality
        );

        // Add assistant response to history
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: response,
        };

        setConversationHistory([...newHistory, assistantMessage]);
        setIsLoading(false);

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [geminiClient, conversationHistory, personality]
  );

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    conversationHistory,
    clearHistory,
    personality,
    setPersonality,
  };
};
