"use client";

import { useState, useEffect, useRef } from 'react';

interface VoiceConversationProps {
  topic: string;
  onEnd: (transcript: string) => void;
  onClose: () => void;
}

export default function VoiceConversation({ topic, onEnd, onClose }: VoiceConversationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const initVoiceSession = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Get session token from backend
      const tokenResponse = await fetch("http://localhost:5001/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get session token: ${tokenResponse.statusText}`);
      }
      
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up to play remote audio from the model
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      pc.addTrack(ms.getTracks()[0]);
      setIsRecording(true);

      // Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      
      dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('Realtime event:', event);
          
          // Handle conversation events for transcript
          if (event.type === 'response.audio_transcript.delta' && event.delta) {
            setTranscript(prev => prev + event.delta);
          }
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      });

      dc.addEventListener("open", () => {
        console.log("Data channel opened");
      });

      // Start the session using SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect to OpenAI: ${sdpResponse.statusText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      
    } catch (err) {
      console.error('Voice session error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice session');
      setConnectionStatus('error');
    }
  };

  const endConversation = () => {
    // Clean up connections
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.remove();
    }
    
    setConnectionStatus('ended');
    setIsRecording(false);
    setIsConnected(false);
    
    // Send transcript to parent
    onEnd(transcript);
  };

  useEffect(() => {
    initVoiceSession();
    
    return () => {
      // Cleanup on unmount
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Voice Conversation
          </h2>
          <p className="text-gray-600 mb-4">Learning about: {topic}</p>
          
          {connectionStatus === 'connecting' && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Connecting...</p>
            </div>
          )}
          
          {connectionStatus === 'connected' && (
            <div className="mb-4">
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-green-100'}`}>
                <span className="text-2xl">{isRecording ? '🎙️' : '🔇'}</span>
              </div>
              <p className="text-sm text-green-600">Connected! Start speaking...</p>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-red-100 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {transcript.length > 0 && (
            <div className="mb-4 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-left text-sm">
              {transcript}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          {connectionStatus === 'connected' && (
            <button
              onClick={endConversation}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Conversation
            </button>
          )}
          
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {connectionStatus === 'connected' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}