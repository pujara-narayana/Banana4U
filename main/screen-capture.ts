import { desktopCapturer, screen } from 'electron';
import sharp from 'sharp';
import { ScreenContext } from '../shared/types';

export async function captureScreen(mode: 'full' | 'active' | 'region'): Promise<ScreenContext> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize,
    });

    let source;
    if (mode === 'full') {
      // Capture entire screen
      source = sources.find(
        (s) => s.name === 'Entire Screen' || s.name === 'Screen 1' || s.id.startsWith('screen')
      );
    } else if (mode === 'active') {
      // Capture active window (first window that's not Banana4U)
      source = sources.find((s) => s.name !== 'Banana4U' && !s.id.startsWith('screen'));
    }

    if (!source) {
      throw new Error('No screen source found');
    }

    // Get screenshot as native image
    const thumbnail = source.thumbnail;
    const buffer = thumbnail.toPNG();

    // Optimize image size using Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1920, 1080, { fit: 'inside' })
      .png({ quality: 80 })
      .toBuffer();

    // Convert to base64
    const base64 = optimizedBuffer.toString('base64');

    return {
      image: base64,
      timestamp: new Date(),
      source: mode,
    };
  } catch (error) {
    console.error('Screen capture failed:', error);
    throw error;
  }
}
