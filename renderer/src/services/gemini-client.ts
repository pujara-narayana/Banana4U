import axios from "axios";
import { API_ENDPOINTS, PERSONALITIES } from "../../../shared/constants";
import {
  GeminiResponse,
  PersonalityType,
  ScreenContext,
} from "../../../shared/types";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

class GeminiClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    // Prefer explicit provided key (e.g., from settings store); fall back to env-injected key.
    this.apiKey = apiKey || (process.env.GEMINI_API_KEY as string) || "";
  }

  /**
   * Generate a response from Gemini API
   */
  async generateResponse(
    userQuery: string,
    screenContext?: ScreenContext,
    conversationHistory: ConversationMessage[] = [],
    personality: PersonalityType = "default"
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(personality);

    // Build the parts array for the request
    const parts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [];

    // Add system prompt
    parts.push({ text: systemPrompt });

    // Add conversation history (last 5 messages)
    const recentHistory = conversationHistory.slice(-5);
    if (recentHistory.length > 0) {
      const historyText = recentHistory
        .map(
          (msg) => `${msg.role === "user" ? "User" : "Banana"}: ${msg.content}`
        )
        .join("\n");
      parts.push({ text: `Previous conversation:\n${historyText}\n` });
    }

    // Add screen context if available
    if (screenContext) {
      if (screenContext.text) {
        parts.push({ text: `Screen content (text):\n${screenContext.text}\n` });
      }
      if (screenContext.image) {
        parts.push({
          inline_data: {
            mime_type: "image/png",
            data: screenContext.image,
          },
        });
      }
    }

    // Add current user query
    parts.push({ text: `User: ${userQuery}` });

    try {
      if (!this.apiKey) {
        throw new Error(
          "Gemini API key missing. Set GEMINI_API_KEY in .env or in app settings."
        );
      }

      console.log("🍌 Sending request to Gemini API...", {
        endpoint: API_ENDPOINTS.GEMINI,
        hasKey: !!this.apiKey,
        keyPrefix: this.apiKey.substring(0, 8) + "...",
      });

      const response = await axios.post<GeminiResponse>(
        `${API_ENDPOINTS.GEMINI}?key=${this.apiKey}`,
        {
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.95,
            topK: 40,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log(
          "✅ Gemini response received:",
          text.substring(0, 100) + "..."
        );
        return text;
      } else {
        console.error("❌ No candidates in response:", response.data);
        throw new Error("No response from Gemini API");
      }
    } catch (error) {
      console.error("❌ Gemini API error:", error);
      if (axios.isAxiosError(error)) {
        const detail =
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message;
        console.error("Error details:", {
          status: error.response?.status,
          detail,
          fullData: error.response?.data,
        });
        if (error.response?.status === 429) {
          throw new Error(
            detail || "Rate limit exceeded. Please try again in a moment."
          );
        } else if (error.response?.status === 401) {
          throw new Error(
            detail || "Invalid API key. Please check your Gemini API key."
          );
        } else if (error.code === "ECONNABORTED") {
          throw new Error("Request timeout. Please try again.");
        } else {
          throw new Error(
            detail
              ? `Gemini API error: ${detail}`
              : `Gemini API error: ${error.message}`
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get system prompt based on personality
   */
  private getSystemPrompt(personality: PersonalityType): string {
    const prompts: Record<PersonalityType, string> = {
      default:
        "You are Banana4U, a helpful AI assistant in the form of a friendly banana. You're cheerful, concise, and helpful. Keep responses brief (2-3 sentences) unless more detail is needed. Use a warm, encouraging tone.",

      study:
        "You are Study Banana, a patient and professorial AI tutor. You break down complex topics into digestible parts, use examples, and encourage learning. Keep explanations clear and structured. Be encouraging but rigorous.",

      hype: "You are Hype Banana, an energetic motivator! You're SUPER enthusiastic and use CAPS for emphasis! You celebrate wins with emojis and keep the energy HIGH! LET'S GO! Keep it short and punchy! 🔥",

      chill:
        "You are Chill Banana, a calm and soothing presence. You speak slowly, peacefully, and encourage taking breaks. Use calming language and gentle suggestions. Everything's gonna be okay, friend. 😌",

      code: "You are Code Banana, a technical expert focused on programming. You give precise, actionable coding advice with examples. You understand best practices, debugging, and optimization. Keep it technical but clear.",

      meme: "You are Meme Banana, a playful joker who loves banana puns and internet humor. Every response should include at least one banana pun or joke. You're here to keep things fun and light! 😂🍌",
    };

    return prompts[personality] || prompts.default;
  }

  /**
   * Check if a screenshot is needed for the given query
   * Returns true if Gemini thinks a screenshot would be helpful
   */
  async checkIfScreenshotNeeded(userQuery: string): Promise<boolean> {
    const checkPrompt = `You are an AI assistant that determines if a screenshot is needed to answer a user's question.
    
The user has asked: "${userQuery}"

Analyze this query and respond with ONLY the word "screenshot" if the query:
- Asks to explain something visible on screen (e.g., "explain this", "what is this", "what does this mean")
- Asks about something that would benefit from visual context
- Uses words like "this", "that", "here" without clear context
- Asks to analyze, debug, or review code/content that's likely visible

Otherwise, respond with "no" if the query:
- Is a general question that doesn't need visual context
- Asks about concepts, definitions, or explanations that don't require seeing the screen
- Is self-contained and doesn't reference something visible

Respond with ONLY one word: either "screenshot" or "no". Nothing else.`;

    try {
      const response = await axios.post<GeminiResponse>(
        `${API_ENDPOINTS.GEMINI}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: checkPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10,
            topP: 0.95,
            topK: 40,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text
          .toLowerCase()
          .trim();
        console.log("🔍 Screenshot check result:", text);
        return text.includes("screenshot");
      }
      return false;
    } catch (error) {
      console.error("Screenshot check failed:", error);
      // Default to false if check fails
      return false;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse(
        "Hello! Just testing the connection."
      );
      return !!response;
    } catch (error) {
      console.error("Gemini API connection test failed:", error);
      return false;
    }
  }

  /**
   * Stream response from Gemini API (experimental)
   * Returns an async generator yielding partial text chunks as they arrive.
   */
  async *streamResponse(
    userQuery: string,
    screenContext?: ScreenContext,
    conversationHistory: ConversationMessage[] = [],
    personality: PersonalityType = "default"
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = this.getSystemPrompt(personality);
    const parts: Array<{
      text?: string;
      inline_data?: { mime_type: string; data: string };
    }> = [];
    parts.push({ text: systemPrompt });
    const recentHistory = conversationHistory.slice(-5);
    if (recentHistory.length > 0) {
      const historyText = recentHistory
        .map(
          (msg) => `${msg.role === "user" ? "User" : "Banana"}: ${msg.content}`
        )
        .join("\n");
      parts.push({ text: `Previous conversation:\n${historyText}\n` });
    }
    if (screenContext) {
      if (screenContext.text)
        parts.push({ text: `Screen content (text):\n${screenContext.text}\n` });
      if (screenContext.image) {
        parts.push({
          inline_data: { mime_type: "image/png", data: screenContext.image },
        });
      }
    }
    parts.push({ text: `User: ${userQuery}` });

    if (!this.apiKey) {
      throw new Error(
        "Gemini API key missing. Set GEMINI_API_KEY in .env or in app settings."
      );
    }

    // Use fetch for streaming since axios doesn't support incremental JSON streaming well for this API.
    const url = `${API_ENDPOINTS.GEMINI_STREAM}?key=${this.apiKey}`;
    const controller = new AbortController();
    const body = JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.95,
        topK: 40,
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    if (!response.body) {
      throw new Error("Streaming not supported: no response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Gemini experimental streaming may send JSON objects separated by newlines
        let boundaryIndex;
        while ((boundaryIndex = buffer.indexOf("\n")) !== -1) {
          const chunk = buffer.slice(0, boundaryIndex).trim();
          buffer = buffer.slice(boundaryIndex + 1);
          if (!chunk) continue;
          try {
            const parsed = JSON.parse(chunk);
            const partText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (partText) {
              yield partText;
            }
          } catch {
            // ignore malformed partial chunk
          }
        }
      }
      // Flush remaining buffer
      const final = buffer.trim();
      if (final) {
        try {
          const parsed = JSON.parse(final);
          const partText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (partText) yield partText;
        } catch {
          /* ignore */
        }
      }
    } finally {
      controller.abort();
    }
  }
}

export default GeminiClient;
