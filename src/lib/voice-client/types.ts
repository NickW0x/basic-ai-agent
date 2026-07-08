/** xAI Realtime tool definition (Grok voice format). */
export interface GrokVoiceTool {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GrokVoiceSessionTokens {
  xai_token: string;
  gate_token: string;
  expires_at?: string;
  session_id?: string;
}

export interface ConversationHistoryMessage {
  role: string;
  content: string;
}

export interface GrokVoiceClientConfig {
  agentId: string;
  sessionId?: string;
  systemPrompt: string;
  tools: GrokVoiceTool[];
  agentVoice?: string;
  outputSpeed?: number;
  proxyUrl: string;
  conversationHistory?: ConversationHistoryMessage[];
  persistTranscripts?: boolean;
  fetchSessionTokens: () => Promise<GrokVoiceSessionTokens>;
  onToolCall: (toolName: string, callId: string, args: unknown) => Promise<unknown>;
  onTranscript: (text: string, isFinal: boolean, speaker?: "user" | "assistant") => void;
  onError?: (message: string) => void;
  onIdleDisconnect?: () => void;
  log?: (message: string, data?: unknown) => void;
}

export interface GrokVoiceClientState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  isProcessing: boolean;
}

export interface VoiceAudioPlayer {
  playChunk(base64Audio: string): Promise<void>;
  stop(): void;
  close(): Promise<void>;
  getIsPlaying(): boolean;
}

export interface VoiceAudioCapture {
  start(onData: (pcm16Base64: string, audioLevel: number) => void): Promise<number>;
  stop(): void;
}

export const VOICE_SAMPLE_RATE = 24000;
export const MAX_RECORDING_DURATION_MS = 60_000;
export const SESSION_IDLE_TIMEOUT_MS = 300_000;
export const MAX_RECONNECT_ATTEMPTS = 3;
export const CONNECTION_TIMEOUT_MS = 15_000;
