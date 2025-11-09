/**
 * Ultra-simple meme generator using Pollinations.ai
 * Takes user prompt directly and generates image - no complexity!
 */

export interface MemeData {
  imageUrl: string;
  caption: string;
}

/**
 * Generate a meme image from user's prompt
 * @param userPrompt - What the user typed
 * @returns Image as base64 data URL + caption
 */
export async function generateMeme(userPrompt: string): Promise<MemeData> {
  try {
    console.log('🎨 [MEME-GEN] Generating image for user prompt:', userPrompt);

    // Use user's prompt directly for image generation
    const imagePrompt = userPrompt;

    // Generate image with Pollinations.ai (free, no API key needed!)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&model=flux&nologo=true`;

    console.log('📡 [MEME-GEN] Fetching from Pollinations.ai...');
    const response = await fetch(pollinationsUrl);

    if (!response.ok) {
      throw new Error(`Pollinations.ai returned status ${response.status}`);
    }

    // Get the image as a blob
    const blob = await response.blob();
    console.log('📦 [MEME-GEN] Received blob, size:', blob.size);

    // Convert blob to base64 data URL
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    console.log('✅ [MEME-GEN] Image generated successfully! Base64 length:', base64.length);

    return {
      imageUrl: base64,
      caption: `Here's your image: "${userPrompt}" 🍌`,
    };
  } catch (error) {
    console.error('❌ [MEME-GEN] Image generation failed:', error);
    throw error;
  }
}