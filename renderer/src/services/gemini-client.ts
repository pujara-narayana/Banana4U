import axios from 'axios';
import { API_ENDPOINTS, PERSONALITIES } from '../../../shared/constants';
import { GeminiResponse, PersonalityType, ScreenContext } from '../../../shared/types';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

class GeminiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate a response from Gemini API
   */
  async generateResponse(
    userQuery: string,
    screenContext?: ScreenContext,
    conversationHistory: ConversationMessage[] = [],
    personality: PersonalityType = 'default'
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(personality);

    // Build the parts array for the request
    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

    // Add system prompt
    parts.push({ text: systemPrompt });

    // Add conversation history (last 5 messages)
    const recentHistory = conversationHistory.slice(-5);
    if (recentHistory.length > 0) {
      const historyText = recentHistory
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Banana'}: ${msg.content}`)
        .join('\n');
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
            mime_type: 'image/png',
            data: screenContext.image,
          },
        });
      }
    }

    // Add current user query
    parts.push({ text: `User: ${userQuery}` });

    try {
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
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        const text = response.data.candidates[0].content.parts[0].text;
        return text;
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        } else {
          throw new Error(`Gemini API error: ${error.message}`);
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

      hype:
        "You are Hype Banana, an energetic motivator! You're SUPER enthusiastic and use CAPS for emphasis! You celebrate wins with emojis and keep the energy HIGH! LET'S GO! Keep it short and punchy! 🔥",

      chill:
        "You are Chill Banana, a calm and soothing presence. You speak slowly, peacefully, and encourage taking breaks. Use calming language and gentle suggestions. Everything's gonna be okay, friend. 😌",

      code:
        "You are Code Banana, a technical expert focused on programming. You give precise, actionable coding advice with examples. You understand best practices, debugging, and optimization. Keep it technical but clear.",

      meme:
        "You are Meme Banana, a playful joker who loves banana puns and internet humor. Every response should include at least one banana pun or joke. You're here to keep things fun and light! 😂🍌",
    };

    return prompts[personality] || prompts.default;
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse('Hello! Just testing the connection.');
      return !!response;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }
}

export default GeminiClient;
