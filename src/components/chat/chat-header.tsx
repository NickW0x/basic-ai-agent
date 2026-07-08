"use client";

import { ThemeToggle } from "@/components/chat/theme-toggle";
import { HealthBadge } from "@/components/settings/status-badge";
import { SystemHealthBadge } from "@/components/chat/system-health-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPECIALIST_SUBTITLE } from "@/lib/agent-meta";
import type { AggregateHealth } from "@/lib/status-types";
import type { UseEveAgentStatus } from "eve/react";
import { NetworkIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  status?: UseEveAgentStatus;
  systemHealth?: AggregateHealth;
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

export function ChatHeader({ status, systemHealth }: ChatHeaderProps) {
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
          {systemHealth ? (
            <HealthBadge health={systemHealth} />
          ) : (
            <SystemHealthBadge />
          )}
          {status ? (
            <Badge variant={status === "error" ? "destructive" : "outline"}>
              Session: {sessionStatusLabel(status)}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Orchestrator · {SPECIALIST_SUBTITLE}
        </p>
      </div>
      <div className="flex items-center gap-2">
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
