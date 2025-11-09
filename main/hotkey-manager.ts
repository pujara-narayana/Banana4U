import { BrowserWindow, globalShortcut } from 'electron';

const registeredHotkeys: Map<string, () => void> = new Map();

export function registerGlobalHotkeys(mainWindow: BrowserWindow): void {
  // Register default hotkeys

  // Focus input field (Ctrl/Cmd + Space)
  registerHotkey('CommandOrControl+Space', () => {
    console.log('Focus hotkey pressed');
    // Bring the window to the front and focus it
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.webContents.send('hotkey:focus-input');
  });

  // Quick capture screen (Ctrl/Cmd + Shift + C)
  registerHotkey('CommandOrControl+Shift+C', () => {
    mainWindow.webContents.send('hotkey:capture-screen');
  });

  console.log('✅ Global hotkeys registered');
}

export function registerHotkey(accelerator: string, callback: () => void): boolean {
  try {
    const success = globalShortcut.register(accelerator, callback);
    if (success) {
      registeredHotkeys.set(accelerator, callback);
      console.log(`✅ Registered hotkey: ${accelerator}`);
    } else {
      console.warn(`⚠️ Failed to register hotkey: ${accelerator}`);
    }
    return success;
  } catch (error) {
    console.error(`❌ Error registering hotkey ${accelerator}:`, error);
    return false;
  }
}

export function unregisterHotkey(accelerator: string): void {
  globalShortcut.unregister(accelerator);
  registeredHotkeys.delete(accelerator);
  console.log(`🗑️ Unregistered hotkey: ${accelerator}`);
}

export function unregisterAllHotkeys(): void {
  globalShortcut.unregisterAll();
  registeredHotkeys.clear();
  console.log('🗑️ All hotkeys unregistered');
}
