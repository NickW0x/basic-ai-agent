"use client";

import { useChat } from "@chat-adapter/web/react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatHeader } from "@/components/chat/chat-header";
import { ComposerDock } from "@/components/chat/composer-dock";
import { MessageList } from "@/components/chat/message-list";

export function ChatShell() {
  const { messages, sendMessage, status, stop } = useChat({
    threadId: "basic-ai-agent-web",
  });

  const handleSubmit = (
    message: PromptInputMessage,
    options: { model: string; webSearch: boolean },
  ) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!hasText && !hasAttachments) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: options.model,
          webSearch: options.webSearch,
        },
      },
    );
  };

  return (
    <main className="flex h-dvh flex-col bg-background">
      <ChatHeader />
      <MessageList messages={messages} status={status} />
      <ComposerDock
        onStop={stop}
        onSubmit={handleSubmit}
        status={status}
      />
    </main>
  );
}
