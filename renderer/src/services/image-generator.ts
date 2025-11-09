/**
 * Simple image generation utility using Pollinations.ai
 * No API key required - completely free!
 */

export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('🎨 [IMG-GEN] Generating image for prompt:', prompt);

    // Use Pollinations.ai - completely free, no auth required
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`;

    console.log('📡 [IMG-GEN] Fetching from Pollinations.ai...');
    const response = await fetch(pollinationsUrl);

    if (!response.ok) {
      throw new Error(`Pollinations.ai returned status ${response.status}`);
    }

    // Get the image as a blob
    const blob = await response.blob();

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

    console.log('✅ [IMG-GEN] Image generated successfully!');
    return base64;
  } catch (error) {
    console.error('❌ [IMG-GEN] Image generation failed:', error);
    throw error;
  }
}