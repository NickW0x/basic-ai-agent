"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { CHAT_CONTENT_CLASS } from "@/components/chat/chat-layout";
import { MessageParts } from "@/components/chat/message-parts";
import { SubagentActivity } from "@/components/chat/subagent-activity";
import {
  VoiceModePanel,
  type VoiceTranscriptLine,
} from "@/components/chat/voice-mode-panel";
import type { PersonaState } from "@/components/ai-elements/persona";
import type { UIMessage } from "ai";
import type { EveMessage, UseEveAgentStatus } from "eve/react";
import { MessageSquareIcon } from "lucide-react";

interface EveMessageListProps {
  messages: readonly EveMessage[];
  status: UseEveAgentStatus;
  events: readonly import("eve/client").HandleMessageStreamEvent[];
  voiceMode?: boolean;
  personaState?: PersonaState;
  voiceEnabled?: boolean;
  voiceConnected?: boolean;
  isVoiceConnecting?: boolean;
  onVoiceConnect?: () => void;
  onVoiceDisconnect?: () => void;
  transcripts?: VoiceTranscriptLine[];
  selectedMicId?: string;
  onMicChange?: (deviceId: string | undefined) => void;
}

export function EveMessageList({
  messages,
  status,
  events,
  voiceMode = false,
  personaState = "idle",
  voiceEnabled = false,
  voiceConnected = false,
  isVoiceConnecting = false,
  onVoiceConnect,
  onVoiceDisconnect,
  transcripts = [],
  selectedMicId,
  onMicChange,
}: EveMessageListProps) {
  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);

  return (
    <Conversation className="flex-1">
      <ConversationContent className={`${CHAT_CONTENT_CLASS} py-6`}>
        {messages.length === 0 ? (
          voiceMode ? (
            <VoiceModePanel
              isConnecting={isVoiceConnecting}
              onConnect={onVoiceConnect}
              onDisconnect={onVoiceDisconnect}
              onMicChange={onMicChange}
              personaState={personaState}
              selectedMicId={selectedMicId}
              transcripts={transcripts}
              voiceConnected={voiceConnected}
              voiceEnabled={voiceEnabled}
            />
          ) : (
            <ConversationEmptyState
              icon={<MessageSquareIcon className="size-10" />}
              title="Multi-agent chat"
            />
          )
        ) : (
          <>
            {voiceMode ? (
              <VoiceModePanel
                compact
                isConnecting={isVoiceConnecting}
                onConnect={onVoiceConnect}
                onDisconnect={onVoiceDisconnect}
                onMicChange={onMicChange}
                personaState={personaState}
                selectedMicId={selectedMicId}
                transcripts={transcripts}
                voiceConnected={voiceConnected}
                voiceEnabled={voiceEnabled}
              />
            ) : null}
            <SubagentActivity events={events} />
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  <MessageParts
                    isStreaming={
                      isStreaming &&
                      message.id === lastMessage?.id &&
                      message.role === "assistant"
                    }
                    message={message as UIMessage}
                  />
                </MessageContent>
              </Message>
            ))}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
