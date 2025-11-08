import { useState, useCallback, useEffect, useRef } from 'react';

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
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0); // 0.5 to 2.0
  const [pitch, setPitch] = useState(1.0); // 0 to 2
  const [volume, setVolume] = useState(1.0); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const savedVolumeRef = useRef<number>(1.0);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;

      // Load voices
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);

        // Try to set a good default voice
        const preferredVoice =
          availableVoices.find((v) => v.name.includes('Google')) ||
          availableVoices.find((v) => v.lang === 'en-US') ||
          availableVoices[0];

        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      };

      // Voices might load asynchronously
      loadVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      setIsSupported(false);
      console.warn('Text-to-speech not supported in this browser');
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !isSupported) {
        console.warn('Text-to-speech not available');
        return;
      }

      // Don't speak if muted
      if (isMuted) {
        console.log('🔇 TTS is muted, skipping speech');
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('🗣️ Started speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('🗣️ Finished speaking');
      };

      utterance.onerror = (event) => {
        console.error('🗣️ Speech error:', event.error);
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    },
    [isSupported, selectedVoice, rate, pitch, volume, isMuted]
  );

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const mute = useCallback(() => {
    console.log('🔇 Muting TTS output');
    savedVolumeRef.current = volume;
    setVolume(0);
    setIsMuted(true);
    // Also stop any current speech
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [volume]);

  const unmute = useCallback(() => {
    console.log('🔊 Unmuting TTS output');
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
