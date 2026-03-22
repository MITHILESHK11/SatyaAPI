import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Loader2, Activity, Volume2, ShieldCheck } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function VoiceAssistant() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [systemResponse, setSystemResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const isRecordingRef = useRef(false);

  // Refs for saving history
  const currentTranscriptRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    currentTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    currentResponseRef.current = systemResponse;
  }, [systemResponse]);

  const saveHistory = async (claim: string, responseText: string) => {
    if (!user || !claim.trim() || !responseText.trim()) return;
    
    // Extract a basic verdict from the response text
    let verdict = 'UNVERIFIABLE';
    const upperResponse = responseText.toUpperCase();
    if (upperResponse.includes('TRUE')) verdict = 'TRUE';
    else if (upperResponse.includes('FALSE')) verdict = 'FALSE';
    else if (upperResponse.includes('MISLEADING')) verdict = 'MISLEADING';

    try {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        claim: claim,
        verdict: verdict,
        confidence: 0.8, // Default for voice
        reason: responseText,
        post_id: `voice-${Date.now()}`,
        model_used: 'gemini-2.5-flash-native-audio-preview-12-2025',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to save voice history:', err);
    }
  };

  const connectToLiveAPI = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript('');
    setSystemResponse('');
    currentTranscriptRef.current = '';
    currentResponseRef.current = '';

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }

      const ai = new GoogleGenAI({ apiKey });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are SatyaAPI, an automated fact-checker for Indian vernacular news. 
          Users will speak claims to you in English, Hindi, or Marathi. 
          You must respond concisely, stating whether the claim is likely TRUE, FALSE, MISLEADING, or UNVERIFIABLE, 
          and provide a brief reason. Be professional, objective, and clear.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startAudioCapture(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              queueAudioPlayback(base64Audio);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              isPlayingRef.current = false;
            }

            // Handle transcriptions
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
               setSystemResponse(prev => prev + message.serverContent!.modelTurn!.parts[0].text);
            }
            
            // Handle user input transcription
            // (clientContent is not available in the current SDK version)
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            setError('Connection error occurred.');
            disconnect();
          },
          onclose: () => {
            disconnect();
          },
        },
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Live API');
      setIsConnecting(false);
    }
  };

  const startAudioCapture = async (sessionPromise: Promise<any>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      } });
      
      mediaStreamRef.current = stream;
      const audioContext = new window.AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        pcm16.forEach((val, i) => view.setInt16(i * 2, val, true));
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsRecording(true);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access is required for voice interactions.');
      disconnect();
    }
  };

  const queueAudioPlayback = (base64Audio: string) => {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // PCM 16-bit 24kHz to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    playbackQueueRef.current.push(float32);
    if (!isPlayingRef.current) {
      playNextAudioChunk();
    }
  };

  const playNextAudioChunk = () => {
    if (playbackQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioContext = audioContextRef.current;
    
    // The model returns 24kHz audio
    const chunk = playbackQueueRef.current.shift()!;
    const buffer = audioContext.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const currentTime = audioContext.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextAudioChunk();
    };
  };

  const disconnect = () => {
    // Save history before disconnecting if we have a response
    if (currentResponseRef.current) {
      saveHistory(currentTranscriptRef.current || 'Voice Input', currentResponseRef.current);
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsRecording(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close()).catch(console.error);
      sessionRef.current = null;
    }
    
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">Voice Assistant</h1>
        <p className="text-zinc-400 text-lg">
          Speak your claim naturally. SatyaAPI will listen and respond with a verified fact-check in real-time.
        </p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        
        {/* Atmospheric background for active state */}
        {isConnected && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] animate-pulse" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center space-y-8 w-full">
          
          <div className="relative">
            <button
              onClick={isConnected ? disconnect : connectToLiveAPI}
              disabled={isConnecting}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                isConnected 
                  ? 'bg-red-500/10 text-red-500 border-2 border-red-500/50 hover:bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]' 
                  : 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/50 hover:bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
              }`}
            >
              {isConnecting ? (
                <Loader2 className="w-12 h-12 animate-spin" />
              ) : isConnected ? (
                <MicOff className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
            
            {isConnected && isRecording && (
              <div className="absolute -inset-4 border border-red-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              {isConnecting ? 'Connecting to SatyaAPI...' : 
               isConnected ? 'Listening...' : 
               'Tap to Start'}
            </h2>
            <p className="text-zinc-400">
              {isConnected ? 'Speak your claim clearly into the microphone.' : 'Requires microphone access.'}
            </p>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isConnected && (
            <div className="w-full max-w-lg space-y-4 mt-8">
              {transcript && (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Mic className="w-3 h-3" /> You said
                  </div>
                  <p className="text-zinc-200">{transcript}</p>
                </div>
              )}
              
              {systemResponse && (
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="text-xs text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> SatyaAPI
                  </div>
                  <p className="text-emerald-100">{systemResponse}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
