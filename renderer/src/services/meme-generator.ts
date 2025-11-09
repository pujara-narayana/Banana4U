import { GoogleGenAI } from '@google/genai';

export interface MemeData {
  imageUrl: string;
  caption: string;
  topText?: string;
  bottomText?: string;
}

/**
 * MemeGenerator service - generates memes using Gemini's native image generation
 */
class MemeGenerator {
  private geminiApiKey: string;
  private ai: GoogleGenAI;

  constructor(geminiApiKey?: string) {
    this.geminiApiKey = geminiApiKey || (process.env.GEMINI_API_KEY as string) || '';
    this.ai = new GoogleGenAI({ apiKey: this.geminiApiKey });
  }

  /**
   * Generate a meme based on user's message using Gemini's image generation
   */
  async generateMeme(userMessage: string, screenContext?: string): Promise<MemeData> {
    try {
      console.log('🎨 Generating meme with Gemini image generation for:', userMessage);

      // Step 1: Analyze the message and create a meme image prompt
      const memePromptData = await this.analyzeMemeContext(userMessage, screenContext);

      // Step 2: Generate the meme image using Gemini's image generation
      const imageDataUrl = await this.generateMemeImage(memePromptData.imagePrompt);

      return {
        imageUrl: imageDataUrl,
        caption: memePromptData.caption,
        topText: memePromptData.imagePrompt.substring(0, 50) + '...',
        bottomText: undefined,
      };
    } catch (error) {
      console.error('❌ Meme generation failed:', error);
      throw new Error('Failed to generate meme. Please try again!');
    }
  }

  /**
   * Use Gemini to analyze the user's message and create a meme image prompt
   */
  private async analyzeMemeContext(
    userMessage: string,
    screenContext?: string
  ): Promise<{
    imagePrompt: string;
    caption: string;
  }> {
    const analysisPrompt = `You are a hilarious meme expert and you're also a banana named CooBee! 🍌

User's message: "${userMessage}"
${screenContext ? `Screen context: ${screenContext}` : ''}

Your task is to create TWO things:

1. IMAGE_PROMPT: A detailed prompt for generating a funny meme image that relates to the user's message. The prompt should:
   - Describe a funny, relatable scenario or visual joke
   - Include specific visual elements (characters, situations, expressions)
   - Be suitable for meme format (funny, punchy, internet culture)
   - Optionally include banana or fruit themes when it makes sense
   - Include any text that should appear on the meme (like speech bubbles or captions)

2. CAPTION: A short, funny comment from CooBee about this meme (max 1-2 sentences, banana-themed)

Respond in EXACTLY this JSON format (no additional text):
{
  "imagePrompt": "Detailed description of the meme image to generate...",
  "caption": "CooBee's funny comment about the meme"
}

Make it funny, relatable, and true to internet meme culture! 😄`;

    try {
      console.log('🎯 Analyzing meme context with Gemini...');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: analysisPrompt,
      });

      const text = response.text || '';
      console.log('📝 Gemini analysis response:', text);

      // Extract JSON from the response
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const memeData = JSON.parse(jsonText);

      return {
        imagePrompt: memeData.imagePrompt || `A funny meme about: ${userMessage}`,
        caption: memeData.caption || 'This meme is absolutely bananas! 🍌😄',
      };
    } catch (error) {
      console.error('❌ Meme analysis failed:', error);
      // Fallback prompt
      return {
        imagePrompt: `Create a funny internet meme image about: ${userMessage}. Include humorous text overlays and relatable visual elements in classic meme style.`,
        caption: 'When life gives you questions, make banana memes! 🍌',
      };
    }
  }

  /**
   * Generate a meme image using Gemini's image generation model
   */
  private async generateMemeImage(imagePrompt: string): Promise<string> {
    try {
      console.log('🎨 Generating meme image with prompt:', imagePrompt);

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-image',
        contents: imagePrompt,
      });

      console.log('✅ Gemini image generation response received');

      // Extract the image data from the response
      // The response structure has candidates[0].content.parts
      if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;

        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';

              // Convert base64 to data URL for browser display
              const dataUrl = `data:${mimeType};base64,${imageData}`;

              console.log('🖼️ Meme image generated successfully (base64 length:', imageData.length, ')');
              return dataUrl;
            }
          }
        }
      }

      throw new Error('No image data in Gemini response');
    } catch (error) {
      console.error('❌ Gemini image generation failed:', error);
      throw error;
    }
  }
}

export default MemeGenerator;