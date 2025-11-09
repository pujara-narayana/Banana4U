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
  const lastDurationMsRef = useRef<number | null>(null);

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

      // Respect mute ONLY while actively recording; if we're not recording anymore,
      // proceed even if the muted flag hasn't been flipped yet (race safety)
      const isRecording =
        typeof document !== "undefined" &&
        (document.body.dataset as any).recording === "true";
      if (isMuted && isRecording) {
        console.log("🔇 TTS is muted during recording, skipping speech");
        return;
      }
      if (isMuted && !isRecording) {
        console.log(
          "⚠️ TTS muted flag set but not recording; proceeding with speech to avoid race"
        );
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
        console.log("🔍 [Renderer] TTS State before generation:", {
          isMuted,
          isRecording,
          existingSpeaking: isSpeaking,
        });

        // Force-stop any previous TTS playback in case it was overlapping
        try {
          await window.electron.stopTTSPlayback();
        } catch (e) {
          /* ignore */
        }

        // Mark as pending so listener can anticipate upcoming TTS
        if (typeof document !== "undefined") {
          document.body.dataset.ttsPending = "true";
        }

        // Generate MP3 file in main process and get duration
        const { filePath, durationSec } = await window.electron.generateTTSFile(text);
        const exists = filePath ? true : false;
        console.log("💾 [Renderer] TTS file generated at", filePath);
        if (!exists) {
          console.warn("⚠️ [Renderer] TTS file path missing; aborting playback");
          setIsSpeaking(false);
          return;
        }

        // Publish duration so conversational loop can wait appropriately
        lastDurationMsRef.current = durationSec
          ? Math.ceil(durationSec * 1000)
          : null;
        if (typeof document !== "undefined") {
          if (lastDurationMsRef.current != null) {
            document.body.dataset.ttsDurationMs = String(
              lastDurationMsRef.current
            );
          } else {
            delete (document.body.dataset as any).ttsDurationMs;
          }
        }

        // Play file in main process while tracking actual completion (more accurate than estimate)
        const startedAt = Date.now();
        setIsSpeaking(true);
        if (typeof document !== "undefined") {
          document.body.dataset.ttsStartedAt = String(startedAt);
          delete (document.body.dataset as any).ttsPending;
          // Keep estimated waitUntil for early-cycle waits but we'll update with actual end when done
          if (lastDurationMsRef.current != null) {
            document.body.dataset.ttsWaitUntil = String(
              startedAt + lastDurationMsRef.current + 1000
            );
          }
        }

        // Confirm file exists before playback
        try {
          // We can't access fs directly in renderer without nodeIntegration; rely on main success.
          console.log("▶️ [Renderer] Starting playback via main...");
          await window.electron.playTTSFile(filePath); // blocks until finished
        } catch (playErr) {
          console.error("❌ [Renderer] Playback error:", playErr);
          // Attempt graceful fallback: mark speaking false
          setIsSpeaking(false);
          return;
        }
        const finishedAt = Date.now();
        if (typeof document !== "undefined") {
          // Overwrite with precise completion-based wait marker (0 extra so loop uses speaking flag buffer)
          document.body.dataset.ttsWaitUntil = String(finishedAt); // immediate pass
        }
        console.log("🛑 [Renderer] File playback completed");
        setIsSpeaking(false);
        if (typeof document !== "undefined") {
          // Keep ttsWaitUntil for the listening loop to honor; clean others optionally
          // We'll leave ttsWaitUntil in place to ensure next cycle waits even if playback already ended
          delete (document.body.dataset as any).ttsPending;
        }
      } catch (error) {
        console.error("❌ [Renderer] ElevenLabs TTS error:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          console.error("Error stack:", error.stack);
        }
        setIsSpeaking(false);
        if (typeof document !== "undefined") {
          delete (document.body.dataset as any).ttsStartedAt;
          delete (document.body.dataset as any).ttsDurationMs;
          delete (document.body.dataset as any).ttsPending;
          delete (document.body.dataset as any).ttsWaitUntil;
        }
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
