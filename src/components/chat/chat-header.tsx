"use client";

import { ThemeToggle } from "@/components/chat/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { UseEveAgentStatus } from "eve/react";
import { KeyboardIcon, MicIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  status?: UseEveAgentStatus;
  voiceMode?: boolean;
  onVoiceModeChange?: (enabled: boolean) => void;
}

function sessionStatusLabel(status: UseEveAgentStatus | undefined): string {
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

function SessionIndicator({ status }: { status?: UseEveAgentStatus }) {
  const label = sessionStatusLabel(status);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className={cn(
            "inline-block size-2 shrink-0 rounded-full",
            status === "error" && "bg-destructive",
            status === "streaming" && "animate-pulse bg-primary",
            status === "submitted" && "animate-pulse bg-amber-500",
            (!status || status === "ready") && "bg-muted-foreground/40",
          )}
          role="status"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ChatHeader({
  status,
  voiceMode = false,
  onVoiceModeChange,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
      <div className="flex items-center gap-2.5">
        <h1 className="font-semibold text-lg tracking-tight">
          Multi-Agent Assistant
        </h1>
        <SessionIndicator status={status} />
        {voiceMode ? (
          <Badge className="text-xs" variant="secondary">
            Voice
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={voiceMode ? "Switch to text mode" : "Switch to voice mode"}
              onClick={() => onVoiceModeChange?.(!voiceMode)}
              size="icon-sm"
              variant={voiceMode ? "default" : "ghost"}
            >
              {voiceMode ? (
                <KeyboardIcon className="size-4" />
              ) : (
                <MicIcon className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {voiceMode ? "Text mode" : "Voice mode"}
          </TooltipContent>
        </Tooltip>
        <Button asChild size="icon-sm" variant="ghost">
          <Link aria-label="Settings" href="/settings">
            <SettingsIcon className="size-4" />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
