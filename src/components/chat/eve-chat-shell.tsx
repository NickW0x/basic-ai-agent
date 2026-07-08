"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChatHeader } from "@/components/chat/chat-header";
import { ComposerDock } from "@/components/chat/composer-dock";
import { EveMessageList } from "@/components/chat/eve-message-list";
import { useStatusPoll } from "@/components/settings/use-status-poll";
import type { UserContent } from "ai";
import { useEveAgent } from "eve/react";
import { AlertCircleIcon } from "lucide-react";
import { useCallback } from "react";

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

export function EveChatShell({ eveHost = "" }: EveChatShellProps) {
  const statusPoll = useStatusPoll({
    sections: ["system", "agents"],
    intervalMs: 30_000,
  });

  const agent = useEveAgent({
    host: eveHost,
    onError: (error) => {
      console.error("[eve]", error);
    },
  });

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

  return (
    <main className="flex h-dvh flex-col bg-background">
      <ChatHeader
        status={agent.status}
        systemHealth={statusPoll.data?.system?.health}
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
        agents={statusPoll.data?.agents}
        events={agent.events}
        messages={agent.data.messages}
        status={agent.status}
      />
      <ComposerDock
        onStop={agent.stop}
        onSubmit={handleSubmit}
        status={agent.status}
      />
    </main>
  );
}
