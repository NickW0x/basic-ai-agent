"use client";

import { RedisStatusCard } from "@/components/settings/redis-status-card";
import { StatusBadge } from "@/components/settings/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RedisStatus, SystemStatusSlice } from "@/lib/status-types";
import { BotIcon, GlobeIcon, ServerIcon } from "lucide-react";

interface InfrastructurePanelProps {
  botUsername: string;
  redis: RedisStatus;
  system: SystemStatusSlice;
  environment: "development" | "production";
  enabledCount: number;
  totalCount: number;
  lastCheckedAt?: string | null;
}

export function InfrastructurePanel({
  botUsername,
  redis,
  system,
  environment,
  enabledCount,
  totalCount,
  lastCheckedAt,
}: InfrastructurePanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>Configured connectors</CardDescription>
            <ServerIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl tabular-nums">
            {enabledCount}
            <span className="text-muted-foreground text-base font-normal">
              {" "}
              / {totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-muted-foreground text-xs">
          Platform adapters with credentials detected in env vars.
        </CardContent>
      </Card>

      <RedisStatusCard
        environment={environment}
        lastCheckedAt={lastCheckedAt}
        redis={redis}
      />

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>Web channel</CardDescription>
            <GlobeIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            eve HTTP
            <StatusBadge status={system.eve.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <code className="block truncate rounded-md bg-muted px-2 py-1 font-mono text-[11px]">
            /eve/v1/session
          </code>
          <p className="mt-2 text-muted-foreground text-xs">
            Browser chat via useEveAgent.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>Bot identity</CardDescription>
            <BotIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="truncate font-mono text-lg">{botUsername}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-muted-foreground text-xs">
          From BOT_USERNAME — used for mentions and display name.
        </CardContent>
      </Card>
    </div>
  );
}
