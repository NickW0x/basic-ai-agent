import { buildVoiceModelToolOutput } from "./sanitize";
import {
  CONNECTION_TIMEOUT_MS,
  type GrokVoiceClientConfig,
  type GrokVoiceClientState,
  MAX_RECONNECT_ATTEMPTS,
  MAX_RECORDING_DURATION_MS,
  SESSION_IDLE_TIMEOUT_MS,
  VOICE_SAMPLE_RATE,
  type VoiceAudioPlayer,
} from "./types";

type StateListener = (state: GrokVoiceClientState) => void;

/** Core xAI Realtime voice protocol — platform-agnostic WebSocket client. */
export class GrokVoiceClient {
  private config: GrokVoiceClientConfig;
  private ws: WebSocket | null = null;
  private audioPlayer: VoiceAudioPlayer | null = null;
  private state: GrokVoiceClientState = {
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isRecording: false,
    isProcessing: false,
  };
  private stateListeners = new Set<StateListener>();
  private isRecordingRef = false;
  private isSpeakingRef = false;
  private transcriptBuffer = "";
  private reconnectAttempts = 0;
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private toolContinuationTimer: ReturnType<typeof setTimeout> | null = null;
  private speakingFinishInterval: ReturnType<typeof setInterval> | null = null;
  private speakingFinishTimeout: ReturnType<typeof setTimeout> | null = null;
  private disconnectFn: (() => void) | null = null;

  constructor(config: GrokVoiceClientConfig) {
    this.config = config;
    this.disconnectFn = () => this.disconnect();
  }

  getState(): GrokVoiceClientState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  setAudioPlayer(player: VoiceAudioPlayer): void {
    this.audioPlayer = player;
  }

  getWebSocket(): WebSocket | null {
    return this.ws;
  }

  getIsRecordingRef(): boolean {
    return this.isRecordingRef;
  }

  private patchState(patch: Partial<GrokVoiceClientState>): void {
    this.state = { ...this.state, ...patch };
    const snapshot = this.getState();
    for (const listener of this.stateListeners) {
      listener(snapshot);
    }
  }

  private proxyWsUrl(xaiToken: string, gateToken: string): string {
    const wsUrl = this.config.proxyUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");
    return `${wsUrl}/voice-proxy?token=${encodeURIComponent(xaiToken)}&gate=${encodeURIComponent(gateToken)}`;
  }

  private cancelSpeakingFinishPoll(): void {
    if (this.speakingFinishInterval) {
      clearInterval(this.speakingFinishInterval);
      this.speakingFinishInterval = null;
    }
    if (this.speakingFinishTimeout) {
      clearTimeout(this.speakingFinishTimeout);
      this.speakingFinishTimeout = null;
    }
  }

  private finishSpeakingWhenPlaybackDone(): void {
    this.cancelSpeakingFinishPoll();
    const startedAt = Date.now();
    const maxWaitMs = 120_000;

    this.speakingFinishInterval = setInterval(() => {
      const stillPlaying = this.audioPlayer?.getIsPlaying() ?? false;
      if (stillPlaying && Date.now() - startedAt < maxWaitMs) {
        return;
      }

      this.cancelSpeakingFinishPoll();
      this.speakingFinishTimeout = setTimeout(() => {
        this.speakingFinishTimeout = null;
        if (this.audioPlayer?.getIsPlaying()) {
          return;
        }
        this.isSpeakingRef = false;
        this.patchState({ isSpeaking: false });
      }, 80);
    }, 50);
  }

  private scheduleToolContinuation(websocket: WebSocket): void {
    if (this.toolContinuationTimer) {
      clearTimeout(this.toolContinuationTimer);
    }
    this.toolContinuationTimer = setTimeout(() => {
      this.toolContinuationTimer = null;
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "response.create" }));
      }
    }, 150);
  }

  private async handleFunctionCall(
    websocket: WebSocket,
    event: { name: string; call_id: string; arguments: string },
  ): Promise<void> {
    try {
      const args = JSON.parse(event.arguments) as unknown;
      const result = await this.config.onToolCall(event.name, event.call_id, args);
      const modelResult = buildVoiceModelToolOutput(event.name, result);

      websocket.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify(modelResult),
          },
        }),
      );
      this.scheduleToolContinuation(websocket);
    } catch {
      websocket.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify({
              success: false,
              message: "Sorry, I encountered an error processing that request.",
            }),
          },
        }),
      );
      this.scheduleToolContinuation(websocket);
    }
  }

  private resetSessionIdleTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    this.sessionTimeout = setTimeout(() => {
      this.config.onIdleDisconnect?.();
      this.disconnectFn?.();
    }, SESSION_IDLE_TIMEOUT_MS);
  }

  private clearAllTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    if (this.toolContinuationTimer) {
      clearTimeout(this.toolContinuationTimer);
      this.toolContinuationTimer = null;
    }
    this.cancelSpeakingFinishPoll();
  }

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      void (async () => {
        try {
          const tokens = await this.config.fetchSessionTokens();
          if (!tokens.xai_token) {
            reject(new Error("No xAI token received"));
            return;
          }

          const websocket = new WebSocket(
            this.proxyWsUrl(tokens.xai_token, tokens.gate_token),
          );
          websocket.binaryType = "blob";

          let hasResolved = false;
          let isSessionConfigSent = false;

          const connectionTimeout = setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              websocket.close();
              reject(new Error("Connection timeout - session not configured in time"));
            }
          }, CONNECTION_TIMEOUT_MS);

          websocket.onopen = () => {
            this.reconnectAttempts = 0;
            this.patchState({ isConnected: true });
            this.resetSessionIdleTimeout();
          };

          websocket.onmessage = async (event) => {
            let messageText: string;
            if (typeof event.data === "string") {
              messageText = event.data;
            } else if (event.data instanceof Blob) {
              messageText = await event.data.text();
            } else {
              return;
            }

            let data: { type: string; [key: string]: unknown };
            try {
              data = JSON.parse(messageText) as { type: string; [key: string]: unknown };
            } catch {
              return;
            }

            switch (data.type) {
              case "conversation.created":
                if (!isSessionConfigSent) {
                  isSessionConfigSent = true;
                  websocket.send(
                    JSON.stringify({
                      type: "session.update",
                      session: {
                        voice: this.config.agentVoice ?? "ara",
                        instructions: this.config.systemPrompt,
                        tools: this.config.tools,
                        turn_detection: { type: null },
                        audio: {
                          input: {
                            format: { type: "audio/pcm", rate: VOICE_SAMPLE_RATE },
                          },
                          output: {
                            format: { type: "audio/pcm", rate: VOICE_SAMPLE_RATE },
                            speed: this.config.outputSpeed ?? 1,
                          },
                        },
                      },
                    }),
                  );

                  const history = this.config.conversationHistory;
                  if (history?.length) {
                    for (const msg of history.slice(-10)) {
                      websocket.send(
                        JSON.stringify({
                          type: "conversation.item.create",
                          item: {
                            type: "message",
                            role: msg.role,
                            content: [
                              {
                                type: msg.role === "user" ? "input_text" : "text",
                                text: msg.content,
                              },
                            ],
                          },
                        }),
                      );
                    }
                  }
                }
                break;

              case "session.updated":
                if (!hasResolved) {
                  hasResolved = true;
                  clearTimeout(connectionTimeout);
                  resolve();
                }
                break;

              case "error": {
                const err = data.error as { message?: string } | undefined;
                this.patchState({ isProcessing: false });
                if (!err?.message?.includes("no active response found")) {
                  this.config.onError?.(err?.message || "Voice API error");
                }
                break;
              }

              case "input_audio_buffer.speech_started":
                this.patchState({ isListening: true });
                break;

              case "input_audio_buffer.speech_stopped":
                this.patchState({ isListening: false });
                break;

              case "response.output_audio.delta":
                if (this.audioPlayer && data.delta) {
                  this.cancelSpeakingFinishPoll();
                  await this.audioPlayer.playChunk(data.delta as string);
                  this.isSpeakingRef = true;
                  this.patchState({ isProcessing: false, isSpeaking: true });
                }
                break;

              case "response.output_audio.done":
                this.finishSpeakingWhenPlaybackDone();
                break;

              case "response.output_audio_transcript.delta":
                this.transcriptBuffer += data.delta as string;
                this.config.onTranscript(this.transcriptBuffer, false, "assistant");
                break;

              case "response.output_audio_transcript.done": {
                const aiMessage = this.transcriptBuffer;
                this.config.onTranscript(aiMessage, true, "assistant");
                this.transcriptBuffer = "";
                break;
              }

              case "conversation.item.input_audio_transcription.completed": {
                const transcript = data.transcript as string;
                this.config.onTranscript(transcript, true, "user");
                break;
              }

              case "response.function_call_arguments.done":
                await this.handleFunctionCall(websocket, {
                  name: data.name as string,
                  call_id: data.call_id as string,
                  arguments: data.arguments as string,
                });
                break;

              default:
                break;
            }
          };

          websocket.onerror = () => {
            this.patchState({ isConnected: false });
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(connectionTimeout);
              reject(new Error("WebSocket connection error"));
            }
            this.config.onError?.("Voice connection error");
          };

          websocket.onclose = (event) => {
            this.patchState({
              isConnected: false,
              isListening: false,
              isSpeaking: false,
              isProcessing: false,
            });
            this.isSpeakingRef = false;
            this.audioPlayer?.stop();

            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(connectionTimeout);
              reject(
                new Error(`WebSocket closed before session configured: ${event.code}`),
              );
            }

            if (
              event.code !== 1000 &&
              this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
            ) {
              const delay = 2000 * (this.reconnectAttempts + 1);
              this.reconnectTimeout = setTimeout(() => {
                this.reconnectAttempts += 1;
                this.connect().catch(() => undefined);
              }, delay);
            } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
              this.config.onError?.("Unable to maintain voice connection");
            }
          };

          this.ws = websocket;
        } catch (error) {
          this.patchState({ isConnected: false });
          reject(error);
        }
      })();
    });
  }

  startRecording(): void {
    const currentWs = this.ws;
    if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
      return;
    }

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
    }
    this.audioPlayer?.stop();

    if (this.state.isSpeaking || this.state.isProcessing) {
      currentWs.send(JSON.stringify({ type: "response.cancel" }));
    }
    currentWs.send(JSON.stringify({ type: "input_audio_buffer.clear" }));

    this.isSpeakingRef = false;
    this.cancelSpeakingFinishPoll();
    this.isRecordingRef = true;
    this.patchState({
      isSpeaking: false,
      isProcessing: false,
      isRecording: true,
      isListening: true,
    });

    this.recordingTimeout = setTimeout(() => {
      this.stopRecording();
      this.config.onError?.("Maximum recording duration reached");
    }, MAX_RECORDING_DURATION_MS);

    this.resetSessionIdleTimeout();
  }

  stopRecording(): void {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    const currentWs = this.ws;
    if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
      this.isRecordingRef = false;
      this.patchState({ isRecording: false, isListening: false });
      return;
    }

    if (!this.isRecordingRef) {
      return;
    }

    this.isRecordingRef = false;
    this.patchState({ isRecording: false, isListening: false, isProcessing: true });

    currentWs.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    currentWs.send(JSON.stringify({ type: "response.create" }));
  }

  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      }),
    );
    this.ws.send(JSON.stringify({ type: "response.create" }));
  }

  disconnect(): void {
    this.clearAllTimers();
    this.isRecordingRef = false;
    this.isSpeakingRef = false;
    this.patchState({
      isRecording: false,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
    });

    const currentWs = this.ws;
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.close(1000, "Client disconnect");
    }
    this.ws = null;
    this.patchState({ isConnected: false });
    this.audioPlayer?.stop();
  }

  async destroy(): Promise<void> {
    this.disconnect();
    if (this.audioPlayer) {
      await this.audioPlayer.close();
      this.audioPlayer = null;
    }
  }
}
