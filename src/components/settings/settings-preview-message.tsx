"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

interface SettingsPreviewMessageProps {
  userMessage?: string;
  assistantMessage: string;
  className?: string;
}

export function SettingsPreviewMessage({
  userMessage = "Hello — can you help me with a quick question?",
  assistantMessage,
  className,
}: SettingsPreviewMessageProps) {
  return (
    <div
      aria-live="polite"
      className={cn("space-y-4 rounded-xl border bg-muted/20 p-4", className)}
    >
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Live preview
      </p>
      <Message from="user">
        <MessageContent>{userMessage}</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>{assistantMessage}</MessageContent>
      </Message>
      <p className="text-muted-foreground text-xs">
        Preview only — not sent to eve runtime.
      </p>
    </div>
  );
}
