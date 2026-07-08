"use client";

import { HealthBadge, StatusBadge } from "@/components/settings/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SystemStatusSlice } from "@/lib/status-types";
import { BotIcon, CpuIcon, GlobeIcon, KeyIcon } from "lucide-react";

interface AgentRuntimePanelProps {
  system: SystemStatusSlice;
  environment: "development" | "production";
}

export function AgentRuntimePanel({
  system,
  environment,
}: AgentRuntimePanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>System health</CardDescription>
            <BotIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">
            <HealthBadge health={system.health} />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-muted-foreground text-xs">
          {environment === "development"
            ? "Dev mode: in-memory Redis does not affect health."
            : "Production requires eve, gateway, and Redis live."}
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>Eve runtime</CardDescription>
            <CpuIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StatusBadge status={system.eve.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-muted-foreground text-xs">
          {system.eve.runtimeStatus
            ? `Status: ${system.eve.runtimeStatus}`
            : system.eve.error ?? "Agent workflow runtime"}
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>AI Gateway</CardDescription>
            <KeyIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StatusBadge status={system.capabilities.aiGateway} />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-muted-foreground text-xs">
          Model:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {system.capabilities.model}
          </code>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center justify-between">
            <CardDescription>Web channel</CardDescription>
            <GlobeIcon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">eve HTTP</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <code className="block truncate rounded-md bg-muted px-2 py-1 font-mono text-[11px]">
            /eve/v1/session
          </code>
          <p className="mt-2 text-muted-foreground text-xs">
            {system.eve.status === "live"
              ? "Browser chat channel is responding."
              : "Channel depends on eve runtime health."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
