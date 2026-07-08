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
import type { UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { MessageSquareIcon } from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
}

export function MessageList({ messages, status }: MessageListProps) {
  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);

  return (
    <Conversation className="flex-1">
      <ConversationContent className={`${CHAT_CONTENT_CLASS} py-6`}>
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Ask about the weather, math, or search the web."
            icon={<MessageSquareIcon className="size-10" />}
            title="Start a conversation"
          />
        ) : (
          messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <MessageParts
                  isStreaming={
                    isStreaming &&
                    message.id === lastMessage?.id &&
                    message.role === "assistant"
                  }
                  message={message}
                />
              </MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
