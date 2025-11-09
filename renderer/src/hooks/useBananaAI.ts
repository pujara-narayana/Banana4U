import { useState, useCallback, useEffect } from "react";
import GeminiClient, { ConversationMessage, GenerateResponseResult } from "../services/gemini-client";
import { PersonalityType, ScreenContext } from "../../../shared/types";

export interface AIResponse {
  text: string;
  memeData?: {
    imageUrl: string;
    // caption: string;
    topText?: string;
    bottomText?: string;
  };
}

interface UseBananaAIResult {
  sendMessage: (
    message: string,
    screenContext?: ScreenContext
  ) => Promise<AIResponse>;
  sendMessageWithAutoScreenshot: (message: string) => Promise<AIResponse>;
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
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [personality, setPersonality] = useState<PersonalityType>("default");

  // Debug: Log when personality changes
  useEffect(() => {
    console.log('🎭 useBananaAI personality changed to:', personality);
  }, [personality]);

  // Initialize Gemini client
  useEffect(() => {
    const initClient = async () => {
      try {
        const settings = await window.electron.getSettings();
        // Always create a client: it will fall back to env-injected key if none provided in settings
        const client = new GeminiClient(settings.geminiApiKey || undefined);
        setGeminiClient(client);

        // If neither settings nor env provides a key, surface a helpful message once
        const hasEnvKey =
          (process.env.GEMINI_API_KEY as string) &&
          (process.env.GEMINI_API_KEY as string) !== "";
        if (!settings.geminiApiKey && !hasEnvKey) {
          setError(
            "No Gemini API key found. Add it in settings or .env (GEMINI_API_KEY)."
          );
        }
      } catch (err) {
        console.error("Failed to initialize Gemini client:", err);
        setError("Failed to initialize AI client");
      }
    };

    initClient();
  }, []);

  const sendMessage = useCallback(
    async (message: string, screenContext?: ScreenContext): Promise<AIResponse> => {
      if (!geminiClient) {
        const errorMsg = "Gemini client not initialized";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      try {
        // Add user message to history
        const userMessage: ConversationMessage = {
          role: "user",
          content: message,
        };

        const newHistory = [...conversationHistory, userMessage];

        // Get response from Gemini (can be string or GenerateResponseResult)
        const response = await geminiClient.generateResponse(
          message,
          screenContext,
          conversationHistory,
          personality
        );

        // Handle both string responses and meme responses
        let aiResponse: AIResponse;
        if (typeof response === 'string') {
          console.log('📝 [HOOK] Response is string type');
          aiResponse = { text: response };
        } else {
          console.log('📝 [HOOK] Response is object type with memeData:', !!response.memeData);
          aiResponse = {
            text: response.text,
            memeData: response.memeData,
          };
        }

        console.log('✅ [HOOK] Returning AIResponse:', {
          hasText: !!aiResponse.text,
          hasMemeData: !!aiResponse.memeData,
          memeDataHasImageUrl: aiResponse.memeData?.imageUrl ? true : false,
        });

        // Add assistant response to history (only text for conversation history)
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: aiResponse.text,
        };

        setConversationHistory([...newHistory, assistantMessage]);
        setIsLoading(false);

        return aiResponse;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [geminiClient, conversationHistory, personality]
  );

  const sendMessageWithAutoScreenshot = useCallback(
    async (message: string): Promise<AIResponse> => {
      if (!geminiClient) {
        const errorMsg = "Gemini client not initialized";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Checking if screenshot is needed for:", message);

        // First, check if a screenshot is needed
        const needsScreenshot = await geminiClient.checkIfScreenshotNeeded(message);

        let screenContext: ScreenContext | undefined = undefined;

        if (needsScreenshot) {
          console.log("📸 Screenshot needed! Capturing screen...");

          // Capture the screen automatically, excluding Banana4U window
          try {
            screenContext = await window.electron.captureScreen("full", true);
            console.log("✅ Screen captured successfully (without Banana4U)");
          } catch (captureError) {
            console.warn("⚠️ Screen capture error:", captureError);
            // Continue without screenshot if capture fails
          }
        } else {
          console.log("ℹ️ No screenshot needed, proceeding without screen context");
        }

        // Now send the message with or without screen context
        return await sendMessage(message, screenContext);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [geminiClient, sendMessage]
  );

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    sendMessage,
    sendMessageWithAutoScreenshot,
    isLoading,
    error,
    conversationHistory,
    clearHistory,
    personality,
    setPersonality,
  };
};
