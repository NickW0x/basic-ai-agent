"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChatHeader } from "@/components/chat/chat-header";
import { ComposerDock } from "@/components/chat/composer-dock";
import { EveMessageList } from "@/components/chat/eve-message-list";
import type { VoiceTranscriptLine } from "@/components/chat/voice-mode-panel";
import { useGrokVoice } from "@/hooks/use-grok-voice";
import { derivePersonaState } from "@/lib/voice/persona-state";
import { isVoiceRuntimeEnabled } from "@/lib/voice/runtime";
import type { UserContent } from "ai";
import type { EveMessage } from "eve/react";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const VOICE_MODE_STORAGE_KEY = "eve-voice-mode";

interface EveChatShellProps {
  eveHost?: string;
}

function buildUserContent(message: PromptInputMessage): string | UserContent {
  const text = message.text?.trim();
  const files = message.files ?? [];

  if (files.length === 0) {
    return text || "Sent with attachments";
  }

  const parts: UserContent = [];

  if (text) {
    parts.push({ type: "text", text });
  }

  for (const file of files) {
    parts.push({
      type: "file",
      data: file.url,
      mediaType: file.mediaType ?? "application/octet-stream",
      filename: file.filename,
    });
  }

  return parts;
}

function readVoiceModePreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return sessionStorage.getItem(VOICE_MODE_STORAGE_KEY) === "true";
}

function getMessageText(message: EveMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join(" ");
}

export function EveChatShell({ eveHost = "" }: EveChatShellProps) {
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<VoiceTranscriptLine[]>(
    [],
  );
  const [selectedMicId, setSelectedMicId] = useState<string | undefined>();

  const voiceRuntimeEnabled = isVoiceRuntimeEnabled();

  const agent = useEveAgent({
    host: eveHost,
    onError: (error) => {
      console.error("[eve]", error);
    },
  });

  const conversationHistory = useMemo(
    () =>
      agent.data.messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: getMessageText(message),
        }))
        .filter((message) => message.content.length > 0),
    [agent.data.messages],
  );

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean, speaker?: "user" | "assistant") => {
      if (!isFinal || !text.trim()) {
        return;
      }
      setVoiceTranscripts((current) => [
        ...current.slice(-19),
        {
          id: `${Date.now()}-${speaker ?? "assistant"}`,
          speaker: speaker ?? "assistant",
          text: text.trim(),
        },
      ]);
    },
    [],
  );

  const grokVoice = useGrokVoice({
    conversationHistory,
    enabled: voiceMode && voiceRuntimeEnabled,
    onTranscript: handleVoiceTranscript,
  });

  useEffect(() => {
    setVoiceMode(readVoiceModePreference());
  }, []);

  const handleVoiceModeChange = useCallback(
    (enabled: boolean) => {
      setVoiceMode(enabled);
      sessionStorage.setItem(VOICE_MODE_STORAGE_KEY, String(enabled));
      if (!enabled) {
        setIsSpeechListening(false);
        grokVoice.disconnect();
        setVoiceTranscripts([]);
      }
    },
    [grokVoice],
  );

  const personaState = useMemo(
    () =>
      derivePersonaState({
        agentStatus: agent.status,
        isAssistantSpeaking: grokVoice.isSpeaking,
        isListening: grokVoice.isConnected
          ? grokVoice.isListening || grokVoice.isRecording
          : isSpeechListening,
        isUserSpeaking: grokVoice.isListening || grokVoice.isRecording,
        isVoiceProcessing: grokVoice.isProcessing,
        voiceConnected: grokVoice.isConnected,
        voiceMode,
      }),
    [
      agent.status,
      grokVoice.isConnected,
      grokVoice.isListening,
      grokVoice.isProcessing,
      grokVoice.isRecording,
      grokVoice.isSpeaking,
      isSpeechListening,
      voiceMode,
    ],
  );

  const handleSubmit = useCallback(
    (
      message: PromptInputMessage,
      options: { model: string; webSearch: boolean },
    ) => {
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);

      if (!hasText && !hasAttachments) {
        return;
      }

      void agent.send({
        message: buildUserContent(message),
        clientContext: {
          model: options.model,
          webSearch: options.webSearch,
        },
      });
    },
    [agent],
  );

  const handleVoiceConnect = useCallback(async () => {
    if (!voiceRuntimeEnabled) {
      toast.error("Voice proxy is not configured");
      return;
    }

    setIsVoiceConnecting(true);
    try {
      await grokVoice.connect();
      toast.success("Voice session connected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect voice session",
      );
    } finally {
      setIsVoiceConnecting(false);
    }
  }, [grokVoice, voiceRuntimeEnabled]);

  const handleVoiceDisconnect = useCallback(() => {
    grokVoice.disconnect();
    setVoiceTranscripts([]);
  }, [grokVoice]);

  return (
    <main className="flex h-dvh flex-col bg-background">
      <ChatHeader
        onVoiceModeChange={handleVoiceModeChange}
        status={agent.status}
        voiceMode={voiceMode}
      />
      {agent.error ? (
        <div className="shrink-0 px-4 pt-3 md:px-6">
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Agent request failed</AlertTitle>
            <AlertDescription>{agent.error.message}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <EveMessageList
        events={agent.events}
        isVoiceConnecting={isVoiceConnecting}
        messages={agent.data.messages}
        onMicChange={setSelectedMicId}
        onVoiceConnect={() => void handleVoiceConnect()}
        onVoiceDisconnect={handleVoiceDisconnect}
        personaState={personaState}
        selectedMicId={selectedMicId}
        status={agent.status}
        transcripts={voiceTranscripts}
        voiceConnected={grokVoice.isConnected}
        voiceEnabled={voiceRuntimeEnabled}
        voiceMode={voiceMode}
      />
      <ComposerDock
        onListeningChange={setIsSpeechListening}
        onStop={agent.stop}
        onSubmit={handleSubmit}
        status={agent.status}
        voiceMode={voiceMode}
      />
    </main>
  );
}
