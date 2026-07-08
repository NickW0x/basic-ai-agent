"use client";

import { buildVoiceSessionConfig } from "@/lib/voice/settings-resolver";
import {
  WebVoiceAudioCapture,
  WebVoiceAudioPlayer,
} from "@/lib/audio/voice-client-web";
import {
  GrokVoiceClient,
  type GrokVoiceClientState,
  VOICE_SAMPLE_RATE,
} from "@/lib/voice-client";
import { getVoiceProxyUrl } from "@/lib/voice/runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseGrokVoiceOptions {
  enabled?: boolean;
  agentId?: string;
  sessionId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  onTranscript?: (
    text: string,
    isFinal: boolean,
    speaker?: "user" | "assistant",
  ) => void;
  onToolCall?: (
    toolName: string,
    callId: string,
    args: unknown,
  ) => Promise<unknown>;
}

const initialState: GrokVoiceClientState = {
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  isRecording: false,
  isProcessing: false,
};

/** React hook for Grok Voice realtime sessions via Railway proxy. */
export function useGrokVoice(options: UseGrokVoiceOptions = {}) {
  const {
    enabled = true,
    agentId = "orchestrator",
    sessionId,
    conversationHistory,
    onTranscript,
    onToolCall,
  } = options;

  const [state, setState] = useState<GrokVoiceClientState>(initialState);
  const clientRef = useRef<GrokVoiceClient | null>(null);
  const captureRef = useRef<WebVoiceAudioCapture | null>(null);
  const playerRef = useRef<WebVoiceAudioPlayer | null>(null);
  const sessionConfig = buildVoiceSessionConfig();
  const proxyUrl = getVoiceProxyUrl();

  const ensureClient = useCallback(() => {
    if (clientRef.current) {
      return clientRef.current;
    }

    const player = new WebVoiceAudioPlayer(VOICE_SAMPLE_RATE);
    playerRef.current = player;

    const client = new GrokVoiceClient({
      agentId,
      sessionId,
      systemPrompt: sessionConfig.systemPrompt,
      tools: sessionConfig.tools,
      agentVoice: sessionConfig.agentVoice,
      outputSpeed: sessionConfig.speed,
      proxyUrl: proxyUrl || "http://localhost:8080",
      conversationHistory,
      persistTranscripts: false,
      fetchSessionTokens: async () => {
        const res = await fetch("/api/voice/session", {
          body: JSON.stringify({ agentId, sessionId }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          const errorData = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errorData.error || "Failed to create voice session");
        }
        return res.json();
      },
      onToolCall:
        onToolCall ??
        (async () => ({
          success: false,
          message: "Tool execution is not configured for voice mode yet.",
        })),
      onTranscript: (text, isFinal, speaker) => {
        onTranscript?.(text, isFinal, speaker);
      },
      onError: (message) => {
        if (!message.includes("no active response")) {
          toast.error(message);
        }
      },
      onIdleDisconnect: () => {
        toast.info("Voice session ended due to inactivity");
      },
    });

    client.setAudioPlayer(player);
    client.subscribe(setState);
    clientRef.current = client;
    return client;
  }, [
    agentId,
    conversationHistory,
    onToolCall,
    onTranscript,
    proxyUrl,
    sessionConfig.agentVoice,
    sessionConfig.speed,
    sessionConfig.systemPrompt,
    sessionConfig.tools,
    sessionId,
  ]);

  const beginMicCapture = useCallback(async (client: GrokVoiceClient) => {
    captureRef.current?.stop();
    const capture = new WebVoiceAudioCapture();
    captureRef.current = capture;

    await capture.start((pcm16Base64) => {
      const ws = client.getWebSocket();
      if (!client.getIsRecordingRef() || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      ws.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: pcm16Base64,
        }),
      );
    });

    client.startRecording();
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || !proxyUrl) {
      throw new Error("Voice proxy is not configured");
    }
    const client = ensureClient();
    await client.connect();
    await beginMicCapture(client);
  }, [beginMicCapture, enabled, ensureClient, proxyUrl]);

  const disconnect = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    clientRef.current?.disconnect();
    setState((current) => ({
      ...current,
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      isRecording: false,
    }));
  }, []);

  const startListening = useCallback(async () => {
    const client = ensureClient();
    await beginMicCapture(client);
  }, [beginMicCapture, ensureClient]);

  const stopListening = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    clientRef.current?.stopRecording();
  }, []);

  useEffect(() => {
    return () => {
      captureRef.current?.stop();
      void clientRef.current?.destroy();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handlePageExit = () => {
      const ws = clientRef.current?.getWebSocket();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Page exit");
      }
    };
    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);
    return () => {
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("pagehide", handlePageExit);
    };
  }, []);

  return {
    connect,
    disconnect,
    isConnected: state.isConnected,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    startListening,
    stopListening,
    isConfigured: Boolean(proxyUrl),
  };
}
