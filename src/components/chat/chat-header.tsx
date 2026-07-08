"use client";

import { ThemeToggle } from "@/components/chat/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { UseEveAgentStatus } from "eve/react";
import { NetworkIcon } from "lucide-react";

interface ChatHeaderProps {
  status?: UseEveAgentStatus;
}

function statusLabel(status: UseEveAgentStatus | undefined): string {
  switch (status) {
    case "streaming":
      return "Streaming";
    case "submitted":
      return "Thinking";
    case "error":
      return "Error";
    default:
      return "Ready";
  }
}

export function ChatHeader({ status }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-lg tracking-tight">
            Multi-Agent Assistant
          </h1>
          <Badge className="gap-1" variant="secondary">
            <NetworkIcon className="size-3" />
            eve
          </Badge>
          {status ? (
            <Badge variant={status === "error" ? "destructive" : "outline"}>
              {statusLabel(status)}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Orchestrator · Researcher · Analyst
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
