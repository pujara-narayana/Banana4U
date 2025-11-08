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
  isConversationalMode: boolean;
  startConversationalMode: () => void;
  stopConversationalMode: () => void;
  setSpeakingCallback: (callback: () => boolean) => void;
  setStopSpeakingCallback: (callback: () => void) => void;
  setMuteSpeakingCallback: (callback: () => void) => void;
  setUnmuteSpeakingCallback: (callback: () => void) => void;
  setLastAIResponse: (response: string) => void;
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
  const [isConversationalMode, setIsConversationalMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationalModeRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isSpeakingCallbackRef = useRef<(() => boolean) | null>(null);
  const stopSpeakingCallbackRef = useRef<(() => void) | null>(null);
  const muteSpeakingCallbackRef = useRef<(() => void) | null>(null);
  const unmuteSpeakingCallbackRef = useRef<(() => void) | null>(null);
  const lastAIResponseRef = useRef<string>("");
  const userSpeechStartTimeRef = useRef<number>(0);

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
      // MUTE TTS while listening to prevent feedback
      console.log("🔇 Muting TTS during voice input...");
      if (muteSpeakingCallbackRef.current) {
        muteSpeakingCallbackRef.current();
      }
      if (stopSpeakingCallbackRef.current) {
        stopSpeakingCallbackRef.current();
      }
      
      setTranscript("");
      setError(null);
      audioChunksRef.current = [];

      console.log("🎤 Requesting microphone (NOT system audio)...");
      
      // Get list of devices and find actual microphone (not system audio)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log("🎤 Available audio inputs:", audioInputs.map(d => d.label));
      
      // Request ONLY microphone input, explicitly NOT system audio
      const constraints = await getMicrophoneConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Verify we got a microphone track, not system audio
      if (!verifyMicrophoneTrack(stream)) {
        stream.getTracks().forEach(t => t.stop());
        setError("System audio device detected - please select a microphone");
        alert("❌ System audio detected! Please select a physical microphone, not system audio/loopback device.");
        return;
      }

      // Try to find the best supported audio format
      let mimeType = "audio/webm;codecs=opus";
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/mpeg",
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log("✅ Using audio format:", type);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for better quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        if (audioBlob.size > 0) await transcribeWithGemini(audioBlob, apiKey);
        
        // UNMUTE TTS after recording
        console.log("🔊 Unmuting TTS after voice input...");
        if (unmuteSpeakingCallbackRef.current) {
          unmuteSpeakingCallbackRef.current();
        }
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
      
      // UNMUTE TTS if error occurs
      if (unmuteSpeakingCallbackRef.current) {
        unmuteSpeakingCallbackRef.current();
      }
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
      // Check audio blob size
      if (audioBlob.size < 100) {
        console.warn("⚠️ Audio too short, skipping transcription");
        setError("Audio too short - please speak longer");
        return;
      }

      if (audioBlob.size > 20 * 1024 * 1024) {
        console.warn("⚠️ Audio too large:", audioBlob.size);
        setError("Audio too large");
        setTranscript("Oops! The audio recording is too large. Please speak more concisely! 🍌");
        return;
      }

      const base64Audio = await blobToBase64(audioBlob);
      const base64Data = base64Audio.split(",")[1];

      console.log("🎤 Gemini transcribing...");
      console.log("📊 Audio details:", {
        size: audioBlob.size,
        type: audioBlob.type,
        base64Length: base64Data.length,
      });

      const response = await axios.post(
        `${API_ENDPOINTS.GEMINI}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: "Listen to this audio carefully. This recording may contain TWO voices: (1) An AI assistant speaking, and (2) A human user speaking. Your task is to transcribe ONLY what the HUMAN USER said. IGNORE and DO NOT transcribe the AI assistant's voice. If you only hear the AI assistant and no human speech, return an empty response. Return ONLY the human user's spoken words, nothing else.",
                },
                {
                  inline_data: { 
                    mime_type: audioBlob.type, 
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 1000,
            topP: 0.95,
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );

      console.log("📦 Gemini response status:", response.status);
      console.log("📦 Gemini response:", JSON.stringify(response.data, null, 2));

      if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawText = response.data.candidates[0].content.parts[0].text.trim();
        console.log("✅ Raw transcribed:", rawText);
        
        // FILTER OUT AI's voice from the transcript
        const filteredText = filterAIVoiceFromTranscript(rawText);
        
        if (!filteredText || filteredText.length < 3) {
          console.warn("⚠️ Filtered transcript is empty or too short - user might not have spoken");
          setError("Only AI voice detected - please speak after AI finishes");
          setTranscript("⚠️ Only heard the AI's voice. Please wait for AI to finish speaking, then try again! 🍌");
        } else {
          console.log("✅ Final transcript (after filtering):", filteredText);
          setTranscript(filteredText);
          setError(null);
        }
      } else if (response.data.candidates?.[0]?.finishReason === "SAFETY") {
        console.error("❌ Blocked by safety filters");
        setError("Content blocked by safety filters");
        setTranscript("Oops! The content was blocked by safety filters. Please try again! 🍌");
      } else {
        console.error("❌ No text in response:", response.data);
        setError("No transcription returned");
        setTranscript("Oops! Looks like we're having trouble understanding the audio. Please speak clearly and try again! 🍌");
      }
    } catch (err: any) {
      console.error("❌ Transcription error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      
      let errorMessage = "Transcription failed";
      let userMessage = "Oops! Looks like we're having troubles with transcription.";
      
      if (err.response?.status === 400) {
        errorMessage = "Audio format not supported by Gemini";
        userMessage = "Oops! Your browser's audio format isn't supported. Try using Chrome or Edge! 🍌";
      } else if (err.response?.status === 429) {
        errorMessage = "API rate limit reached";
        userMessage = "Oops! Too many requests. Please wait a moment and try again! 🍌";
      } else if (err.response?.status === 403) {
        errorMessage = "API key invalid or expired";
        userMessage = "Oops! There's an issue with the API key. Please check the configuration! 🍌";
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timeout";
        userMessage = "Oops! The transcription is taking too long. Please try with shorter audio! 🍌";
      } else if (err.message.includes("Network")) {
        errorMessage = "Network error";
        userMessage = "Oops! Network connection issue. Please check your internet! 🍌";
      }
      
      setError(errorMessage);
      setTranscript(userMessage + " Error: " + errorMessage);
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

  // Function to store last AI response for filtering
  const setLastAIResponse = (response: string) => {
    lastAIResponseRef.current = response;
    console.log("💾 Stored AI response for filtering:", response.substring(0, 50) + "...");
  };

  // Function to filter out AI's voice from transcription
  const filterAIVoiceFromTranscript = (rawTranscript: string): string => {
    if (!rawTranscript || !lastAIResponseRef.current) {
      return rawTranscript;
    }

    console.log("🔍 Filtering transcript...");
    console.log("📝 Raw transcript:", rawTranscript);
    console.log("🤖 Last AI response:", lastAIResponseRef.current.substring(0, 100));

    // Clean and normalize text for comparison
    const normalize = (text: string) => 
      text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();

    const normalizedTranscript = normalize(rawTranscript);
    const normalizedAI = normalize(lastAIResponseRef.current);

    // Split into sentences/phrases
    const transcriptParts = rawTranscript.split(/[.!?]\s+/);
    const aiParts = lastAIResponseRef.current.split(/[.!?]\s+/);

    // Filter out parts that match AI response
    const filteredParts = transcriptParts.filter(part => {
      const normalizedPart = normalize(part);
      
      // Skip empty parts
      if (!normalizedPart) return false;

      // Check if this part appears in AI response
      const isAISpeech = aiParts.some(aiPart => {
        const normalizedAIPart = normalize(aiPart);
        
        // Check for exact match or substring match
        if (normalizedPart === normalizedAIPart) return true;
        if (normalizedAIPart.includes(normalizedPart) && normalizedPart.length > 10) return true;
        if (normalizedPart.includes(normalizedAIPart) && normalizedAIPart.length > 10) return true;
        
        // Check similarity (Levenshtein-like)
        const similarity = calculateSimilarity(normalizedPart, normalizedAIPart);
        return similarity > 0.8; // 80% similar = likely AI voice
      });

      return !isAISpeech;
    });

    const filteredTranscript = filteredParts.join('. ').trim();

    if (filteredTranscript !== rawTranscript) {
      console.log("✂️ FILTERED OUT AI speech");
      console.log("📝 Original:", rawTranscript);
      console.log("✅ Filtered:", filteredTranscript);
    } else {
      console.log("✅ No AI speech detected in transcript");
    }

    return filteredTranscript || rawTranscript; // Return original if nothing left
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance (edit distance between strings)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Helper function to get microphone constraints that exclude system audio
  const getMicrophoneConstraints = async (): Promise<MediaStreamConstraints> => {
    // Enumerate devices to find real microphones only
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    console.log('🎤 All audio input devices:', audioInputs.map(d => ({
      id: d.deviceId,
      label: d.label,
      groupId: d.groupId,
    })));
    
    // Filter out system audio devices
    const systemAudioKeywords = [
      'loopback',
      'stereo mix',
      'system audio',
      'what u hear',
      'wave out',
      'speakers',
      'output',
      'soundflower',
      'blackhole',
      'virtual audio',
      'voicemeeter',
      'vb-audio',
      'system sound',
    ];
    
    const realMicrophones = audioInputs.filter(device => {
      const label = device.label.toLowerCase();
      const isSystemAudio = systemAudioKeywords.some(keyword => label.includes(keyword));
      return !isSystemAudio;
    });
    
    console.log('✅ Real microphones only:', realMicrophones.map(d => d.label));
    
    // If we found real microphones, prefer the first one
    let deviceId: string | undefined;
    if (realMicrophones.length > 0) {
      deviceId = realMicrophones[0].deviceId;
      console.log('🎤 Using device:', realMicrophones[0].label);
    } else {
      console.warn('⚠️ No real microphones found, using default');
    }
    
    return {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
        // Explicitly exclude system audio with vendor-specific constraints
        // @ts-ignore - These are browser-specific but important for preventing system audio capture
        googEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppression: true,
        googHighpassFilter: true,
        // Only allow microphone devices
        // @ts-ignore
        mediaSource: 'microphone',
      },
      video: false,
    };
  };

  // Helper function to verify audio track is from microphone, not system audio
  const verifyMicrophoneTrack = (stream: MediaStream): boolean => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error("❌ No audio tracks found!");
      return false;
    }

    const track = audioTracks[0];
    console.log("🎤 Audio track details:", {
      label: track.label,
      kind: track.kind,
      enabled: track.enabled,
      muted: track.muted,
      settings: track.getSettings(),
    });

    // Extended list of system audio indicators
    const systemAudioKeywords = [
      'loopback',
      'stereo mix',
      'system audio',
      'what u hear',
      'wave out',
      'speakers',
      'output',
      'soundflower',
      'blackhole',
      'virtual audio',
      'voicemeeter',
      'vb-audio',
      'system sound',
      'desktop audio',
      'monitor of',
      'virtual device',
      'audio router',
      'vac', // Virtual Audio Cable
    ];

    const label = track.label.toLowerCase();
    for (const keyword of systemAudioKeywords) {
      if (label.includes(keyword)) {
        console.error(`❌ Detected system audio device: "${track.label}"`);
        return false;
      }
    }

    console.log("✅ Verified microphone input (not system audio)");
    return true;
  };

  // Conversational Mode Functions
  const detectVoiceActivity = useCallback(async (stream: MediaStream): Promise<boolean> => {
    return new Promise((resolve) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      microphone.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      const SILENCE_THRESHOLD = 30; // Adjust sensitivity
      const SILENCE_DURATION = 1500; // 1.5 seconds of silence
      const VOICE_THRESHOLD = 50; // Threshold for detecting voice
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > VOICE_THRESHOLD) {
          // Voice detected, reset silence timer
          silenceStart = Date.now();
        } else if (average < SILENCE_THRESHOLD) {
          // Check if silence duration exceeded
          if (Date.now() - silenceStart > SILENCE_DURATION) {
            audioContext.close();
            resolve(false); // Silence detected, stop recording
            return;
          }
        }
        
        requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
    });
  }, []);

  const startConversationalMode = useCallback(async () => {
    if (!isSupported) {
      setError("MediaRecorder not supported");
      alert("Audio recording not supported. Please use Chrome, Edge, or Safari.");
      return;
    }

    const apiKey = (process.env.GEMINI_API_KEY as string) || "";
    if (!apiKey) {
      setError("Gemini API key not configured");
      alert("Gemini API key missing");
      return;
    }

    setIsConversationalMode(true);
    conversationalModeRef.current = true;
    console.log("🎙️ Conversational mode started");
    
    // Start the continuous listening loop
    listenContinuously(apiKey);
  }, [isSupported]);

  const listenContinuously = async (apiKey: string) => {
    while (conversationalModeRef.current) {
      try {
        // MUTE ALL TTS OUTPUT - completely silence system audio
        console.log("🔇 MUTING all TTS output to prevent microphone pickup...");
        if (muteSpeakingCallbackRef.current) {
          muteSpeakingCallbackRef.current();
        }
        
        // FORCE STOP any TTS audio that's playing
        console.log("🔇 Force stopping any active TTS...");
        if (stopSpeakingCallbackRef.current) {
          stopSpeakingCallbackRef.current();
        }
        
        // Wait for TTS to finish stopping
        console.log("⏳ Ensuring TTS is completely stopped...");
        let waitCount = 0;
        while (isSpeakingCallbackRef.current?.() === true && waitCount < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        // Extra delay to ensure all audio is silent
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("🎤 Ready to listen (TTS is MUTED and STOPPED)");
        setTranscript("");
        setError(null);
        audioChunksRef.current = [];

        // Get list of devices and ensure we're using microphone only
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log("🎤 Available audio inputs:", audioInputs.map(d => d.label));

        // Get microphone stream - ONLY microphone, NOT system audio
        const constraints = await getMicrophoneConstraints();
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = stream;

        // Verify we got a microphone track, not system audio
        if (!verifyMicrophoneTrack(stream)) {
          stream.getTracks().forEach(t => t.stop());
          conversationalModeRef.current = false;
          setIsConversationalMode(false);
          setError("System audio device detected - please select a microphone");
          alert("❌ System audio detected! Please select a physical microphone, not system audio/loopback device.");
          break;
        }

        // Try to find the best supported audio format
        let mimeType = "audio/webm;codecs=opus";
        const supportedTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
          "audio/mpeg",
        ];

        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }

        console.log("🎤 Using audio format:", mimeType);

        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType,
          audioBitsPerSecond: 128000,
        });
        mediaRecorderRef.current = mediaRecorder;

        // Set up voice activity detection
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 512;
        microphone.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let voiceDetected = false;
        let silenceStart = 0;
        const SILENCE_THRESHOLD = 30;
        const SILENCE_DURATION = 1500; // 1.5 seconds
        const VOICE_THRESHOLD = 50;

        // Wait for voice to start
        await new Promise<void>((resolve) => {
          const detectVoice = () => {
            if (!conversationalModeRef.current) {
              resolve();
              return;
            }

            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            if (average > VOICE_THRESHOLD) {
              voiceDetected = true;
              silenceStart = Date.now();
              resolve();
            } else {
              requestAnimationFrame(detectVoice);
            }
          };
          detectVoice();
        });

        if (!conversationalModeRef.current) break;

        // Start recording
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.start(100);
        setIsListening(true);
        console.log("🎤 Recording started (voice detected)");

        // Monitor for silence to stop recording
        await new Promise<void>((resolve) => {
          const checkSilence = () => {
            if (!conversationalModeRef.current) {
              resolve();
              return;
            }

            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            if (average > VOICE_THRESHOLD) {
              silenceStart = Date.now();
            } else if (average < SILENCE_THRESHOLD) {
              if (Date.now() - silenceStart > SILENCE_DURATION) {
                resolve();
                return;
              }
            }
            
            requestAnimationFrame(checkSilence);
          };
          checkSilence();
        });

        // Stop recording
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
        setIsListening(false);
        
        // Wait for recording to finish processing
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            stream.getTracks().forEach((track) => track.stop());
            
            if (audioContext) {
              audioContext.close();
            }
            
            if (audioBlob.size > 0 && conversationalModeRef.current) {
              await transcribeWithGemini(audioBlob, apiKey);
            }
            
            // UNMUTE TTS so AI can respond
            console.log("🔊 Unmuting TTS for AI response...");
            if (unmuteSpeakingCallbackRef.current) {
              unmuteSpeakingCallbackRef.current();
            }
            
            resolve();
          };
        });

        // No need to wait here - we'll mute again at the start of the next loop

      } catch (err: any) {
        console.error("❌ Conversational mode error:", err);
        if (conversationalModeRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log("🎙️ Conversational mode stopped");
  };

  const stopConversationalMode = useCallback(() => {
    conversationalModeRef.current = false;
    setIsConversationalMode(false);
    
    // Clean up any active recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    console.log("🎙️ Conversational mode stopped by user");
  }, []);

  const setSpeakingCallback = useCallback((callback: () => boolean) => {
    isSpeakingCallbackRef.current = callback;
  }, []);

  const setStopSpeakingCallback = useCallback((callback: () => void) => {
    stopSpeakingCallbackRef.current = callback;
  }, []);

  const setMuteSpeakingCallback = useCallback((callback: () => void) => {
    muteSpeakingCallbackRef.current = callback;
  }, []);

  const setUnmuteSpeakingCallback = useCallback((callback: () => void) => {
    unmuteSpeakingCallbackRef.current = callback;
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
    error,
    isSupported,
    isConversationalMode,
    startConversationalMode,
    stopConversationalMode,
    setSpeakingCallback,
    setStopSpeakingCallback,
    setMuteSpeakingCallback,
    setUnmuteSpeakingCallback,
    setLastAIResponse,
  };
};
