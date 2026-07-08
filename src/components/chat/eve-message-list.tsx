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
import type { AgentsStatusSlice } from "@/lib/status-types";
import type { UIMessage } from "ai";
import type { EveMessage, UseEveAgentStatus } from "eve/react";
import { MessageSquareIcon } from "lucide-react";

interface EveMessageListProps {
  messages: readonly EveMessage[];
  status: UseEveAgentStatus;
  events: readonly import("eve/client").HandleMessageStreamEvent[];
  agents?: AgentsStatusSlice;
}

export function EveMessageList({
  messages,
  status,
  events,
  agents,
}: EveMessageListProps) {
  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);

  return (
    <Conversation className="flex-1">
      <ConversationContent className={`${CHAT_CONTENT_CLASS} py-6`}>
        {messages.length === 0 ? (
          <div className="space-y-6">
            <AgentRoster agents={agents} />
            <ConversationEmptyState
              description="Try: “Summarize this article…” · “What subagents exist?” · “Draft 3 X posts for our bot” · “What's the weather in Tokyo?”"
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
