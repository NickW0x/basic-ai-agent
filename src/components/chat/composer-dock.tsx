"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { CHAT_CONTENT_CLASS } from "@/components/chat/chat-layout";
import { PromptArea } from "@/components/chat/prompt-area";
import type { ChatStatus } from "ai";

interface ComposerDockProps {
  status: ChatStatus;
  onSubmit: (
    message: PromptInputMessage,
    options: { model: string; webSearch: boolean },
  ) => void;
  onStop: () => void;
}

export function ComposerDock({ status, onSubmit, onStop }: ComposerDockProps) {
  return (
    <footer className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className={`${CHAT_CONTENT_CLASS} py-4`}>
        <PromptArea onStop={onStop} onSubmit={onSubmit} status={status} />
      </div>
    </footer>
  );
}
