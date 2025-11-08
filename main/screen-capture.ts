import { desktopCapturer, screen, BrowserWindow } from 'electron';
import sharp from 'sharp';
import { ScreenContext } from '../shared/types';

export async function captureScreen(mode: 'full' | 'active' | 'region', excludeBanana4U = false): Promise<ScreenContext> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize,
    });

    let source;
    let buffer: Buffer;

    if (mode === 'full') {
      if (excludeBanana4U) {
        // Capture screen without Banana4U window
        buffer = await captureScreenExcludingBanana4U(sources);
      } else {
        // Capture entire screen including everything
        source = sources.find(
          (s) => s.name === 'Entire Screen' || s.name === 'Screen 1' || s.id.startsWith('screen')
        );
        if (!source) {
          throw new Error('No screen source found');
        }
        buffer = source.thumbnail.toPNG();
      }
    } else if (mode === 'active') {
      // Capture active window (first window that's not Banana4U)
      source = sources.find((s) => s.name !== 'Banana4U' && !s.id.startsWith('screen'));
      if (!source) {
        throw new Error('No active window found');
      }
      buffer = source.thumbnail.toPNG();
    } else {
      throw new Error('Region capture not yet implemented');
    }

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

async function captureScreenExcludingBanana4U(sources: Electron.DesktopCapturerSource[]): Promise<Buffer> {
  // Hide Banana4U window temporarily
  const allWindows = BrowserWindow.getAllWindows();
  const banana4UWindow = allWindows.find(win => win.getTitle() === 'Banana4U' || !win.isDestroyed());
  
  let wasVisible = false;
  if (banana4UWindow && !banana4UWindow.isDestroyed()) {
    wasVisible = banana4UWindow.isVisible();
    if (wasVisible) {
      banana4UWindow.hide();
      // Give OS time to update the screen
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  try {
    // Capture the screen now that Banana4U is hidden
    const screenSource = sources.find(
      (s) => s.name === 'Entire Screen' || s.name === 'Screen 1' || s.id.startsWith('screen')
    );

    if (!screenSource) {
      throw new Error('No screen source found');
    }

    // Re-fetch sources after hiding the window to get updated screenshot
    const updatedSources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize,
    });

    const updatedScreenSource = updatedSources.find(
      (s) => s.name === 'Entire Screen' || s.name === 'Screen 1' || s.id.startsWith('screen')
    );

    const buffer = updatedScreenSource ? updatedScreenSource.thumbnail.toPNG() : screenSource.thumbnail.toPNG();

    return buffer;
  } finally {
    // Restore Banana4U window visibility
    if (banana4UWindow && !banana4UWindow.isDestroyed() && wasVisible) {
      // Small delay before showing to ensure screenshot is captured
      await new Promise(resolve => setTimeout(resolve, 50));
      banana4UWindow.show();
    }
  }
}
