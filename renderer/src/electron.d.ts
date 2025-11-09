import { ElectronAPI } from '../../shared/types';

/**
 * Extends the Window interface to include the 'electron' API
 * exposed from the preload script.
 */
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}