"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { AgentRoster } from "@/components/chat/agent-roster";
import { CHAT_CONTENT_CLASS } from "@/components/chat/chat-layout";
import { MessageParts } from "@/components/chat/message-parts";
import { SubagentActivity } from "@/components/chat/subagent-activity";
import type { UIMessage } from "ai";
import type { EveMessage, UseEveAgentStatus } from "eve/react";
import { MessageSquareIcon } from "lucide-react";

interface EveMessageListProps {
  messages: readonly EveMessage[];
  status: UseEveAgentStatus;
  events: readonly import("eve/client").HandleMessageStreamEvent[];
}

export function EveMessageList({
  messages,
  status,
  events,
}: EveMessageListProps) {
  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);

  return (
    <Conversation className="flex-1">
      <ConversationContent className={`${CHAT_CONTENT_CLASS} py-6`}>
        {messages.length === 0 ? (
          <div className="space-y-6">
            <AgentRoster />
            <ConversationEmptyState
              description="Try: “What's the weather in Tokyo?” or “Calculate (18 + 6) * 3”. Watch the orchestrator delegate to researcher or analyst."
              icon={<MessageSquareIcon className="size-10" />}
              title="Multi-agent chat"
            />
          </div>
        ) : (
          <>
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
