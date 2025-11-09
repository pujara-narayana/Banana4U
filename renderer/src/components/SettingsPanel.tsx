import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Zap, Eye, Palette, Key } from 'lucide-react';
import { UserSettings, PersonalityType } from '../../../shared/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'voice' | 'api'>('general');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const currentSettings = await window.electron.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    
    try {
      await window.electron.setSetting(key, value);
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  if (!settings) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
            <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X size={18} color="white" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700">
                {[
                  { id: 'general', label: 'General', icon: Zap },
                  { id: 'appearance', label: 'Appearance', icon: Palette },
                  { id: 'voice', label: 'Voice', icon: Volume2 },
                  { id: 'api', label: 'API Keys', icon: Key },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-3 py-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-800 text-white border-b-2 border-yellow-400'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain" style={{minHeight:0, touchAction:'pan-y'}}>
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Personality</label>
                    <select
                      value={settings.defaultPersonality}
                      onChange={(e) => updateSetting('defaultPersonality', e.target.value as PersonalityType)}
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-yellow-400"
                    >
                      <option value="default">Default</option>
                      <option value="study">Study</option>
                      <option value="hype">Hype</option>
                      <option value="chill">Chill</option>
                      <option value="meme">Meme</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Window Opacity: {Math.round(settings.windowOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={settings.windowOpacity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateSetting('windowOpacity', value);
                        window.electron.setOpacity(value);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Animation Speed: {settings.animationSpeed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.animationSpeed}
                      onChange={(e) => updateSetting('animationSpeed', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Reduce Motion</label>
                    <button
                      onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.reducedMotion ? 'bg-yellow-400' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Tab */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Voice Enabled</label>
                    <button
                      onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.voiceEnabled ? 'bg-yellow-400' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.voiceEnabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.voiceEnabled && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Voice Speed: {settings.voiceSpeed}x
                      </label>
                      <input
                        type="range"
                        min="0.75"
                        max="1.5"
                        step="0.05"
                        value={settings.voiceSpeed}
                        onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Gemini API Key</label>
                    <input
                      type="password"
                      value={settings.geminiApiKey || ''}
                      onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                      placeholder="Enter your Gemini API key"
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">OpenAI API Key (Optional)</label>
                    <input
                      type="password"
                      value={settings.openaiApiKey || ''}
                      onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                      placeholder="Enter your OpenAI API key"
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">ElevenLabs API Key (Optional)</label>
                    <input
                      type="password"
                      value={settings.elevenLabsApiKey || ''}
                      onChange={(e) => updateSetting('elevenLabsApiKey', e.target.value)}
                      placeholder="Enter your ElevenLabs API key"
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;

