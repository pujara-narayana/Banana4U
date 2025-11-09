import { useState, useCallback, useEffect, useRef } from "react";

interface UseTextToSpeechResult {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
}

export const useTextToSpeech = (): UseTextToSpeechResult => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true); // ElevenLabs is always supported
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0); // 0.5 to 2.0
  const [pitch, setPitch] = useState(1.0); // 0 to 2
  const [volume, setVolume] = useState(1.0); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const savedVolumeRef = useRef<number>(1.0);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!isSupported) {
        console.warn("Text-to-speech not available");
        return;
      }

      // Don't speak if muted
      if (isMuted) {
        console.log("🔇 TTS is muted, skipping speech");
        return;
      }

      // Stop any ongoing speech (renderer audio element not used for playback now)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      try {
        console.log("🗣️ [Renderer] Generating speech with ElevenLabs...");
        console.log(
          "📝 [Renderer] Text to speak:",
          text.substring(0, 100) + (text.length > 100 ? "..." : "")
        );

        // Force-stop any previous TTS playback in case it was overlapping
        try {
          await window.electron.stopTTSPlayback();
        } catch (e) {
          /* ignore */
        }

        // Set speaking state immediately for animation
        setIsSpeaking(true);

        // Generate MP3 file in main process and play it (will block until finished)
        const filePath = await window.electron.generateTTSFile(text);
        console.log("💾 [Renderer] TTS file generated at", filePath);
        await window.electron.playTTSFile(filePath);
        console.log("🛑 [Renderer] File playback completed");
        setIsSpeaking(false);
      } catch (error) {
        console.error("❌ [Renderer] ElevenLabs TTS error:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          console.error("Error stack:", error.stack);
        }
        setIsSpeaking(false);
      }
    },
    [isSupported, volume, isMuted]
  );

  const stop = useCallback(() => {
    // Stop renderer element (legacy) and main-process playback
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.electron.stopTTSPlayback().catch(() => {});
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const mute = useCallback(() => {
    console.log("🔇 Muting TTS output");
    savedVolumeRef.current = volume;
    setVolume(0);
    setIsMuted(true);
    // Also stop any current speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [volume]);

  const unmute = useCallback(() => {
    console.log("🔊 Unmuting TTS output");
    setVolume(savedVolumeRef.current);
    setIsMuted(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    setVoice: setSelectedVoice,
    setRate,
    setPitch,
    setVolume,
    mute,
    unmute,
    isMuted,
  };
};
