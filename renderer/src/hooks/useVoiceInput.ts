import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../../shared/constants";

interface UseVoiceInputResult {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  error: string | null;
  isSupported: boolean;
}

export const useVoiceInput = (): UseVoiceInputResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(
    typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("MediaRecorder not supported");
      alert(
        "Audio recording not supported. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY as string) || "";
    if (!apiKey) {
      setError("Gemini API key not configured");
      alert("Gemini API key missing");
      return;
    }

    try {
      setTranscript("");
      setError(null);
      audioChunksRef.current = [];

      console.log("🎤 Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      let mimeType = "audio/webm";
      if (
        !MediaRecorder.isTypeSupported("audio/webm") &&
        MediaRecorder.isTypeSupported("audio/mp4")
      ) {
        mimeType = "audio/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        if (audioBlob.size > 0) await transcribeWithGemini(audioBlob, apiKey);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      console.log("🎤 Local recording started");
    } catch (err: any) {
      const message =
        err.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Failed to access microphone";
      setError(message);
      alert(message);
    }
  }, [isSupported]);

  const stopListening = useCallback(async () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const transcribeWithGemini = async (audioBlob: Blob, apiKey: string) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const base64Data = base64Audio.split(",")[1];

      console.log("🎤 Gemini transcribing...");

      const response = await axios.post(
        `${API_ENDPOINTS.GEMINI}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: "Transcribe this audio. Return only the spoken words.",
                },
                {
                  inline_data: { mime_type: audioBlob.type, data: base64Data },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );

      if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.data.candidates[0].content.parts[0].text.trim();
        console.log("✅ Transcribed:", text);
        setTranscript(text);
      }
    } catch (err: any) {
      console.error("❌ Transcription error:", err);
      setError("Transcription failed");
      setTranscript("[Failed]");
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const clearTranscript = useCallback(() => setTranscript(""), []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
    error,
    isSupported,
  };
};
