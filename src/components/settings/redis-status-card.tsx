"use client";

import { StatusBadge } from "@/components/settings/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RedisStatus } from "@/lib/status-types";
import { DatabaseIcon } from "lucide-react";

interface RedisStatusCardProps {
  redis: RedisStatus;
  environment: "development" | "production";
  lastCheckedAt?: string | null;
}

function formatCheckedAt(value?: string | null): string | null {
  if (!value) return null;

  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return null;
  }
}

export function RedisStatusCard({
  redis,
  environment,
  lastCheckedAt,
}: RedisStatusCardProps) {
  const checkedLabel = formatCheckedAt(lastCheckedAt);

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-center justify-between">
          <CardDescription>Upstash Redis</CardDescription>
          <DatabaseIcon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          {redis.mode === "redis" ? "Redis" : "In-memory"}
          <StatusBadge status={redis.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 text-muted-foreground text-xs">
        {redis.connected && redis.latencyMs != null ? (
          <p>PING succeeded in {redis.latencyMs}ms.</p>
        ) : null}

        {redis.mode === "memory" && environment === "development" ? (
          <p>In-memory fallback is expected in local development.</p>
        ) : null}

        {redis.mode === "memory" && environment === "production" ? (
          <p className="text-amber-600 dark:text-amber-400">
            Production should use a live Upstash Redis connection.
          </p>
        ) : null}

        {redis.configured && !redis.connected && redis.error ? (
          <p className="text-destructive">{redis.error}</p>
        ) : null}

        {!redis.configured ? (
          <p>Set REDIS_URL for production thread subscriptions.</p>
        ) : null}

        {checkedLabel ? (
          <p>
            Last checked: {checkedLabel}
            {redis.provider === "upstash" ? (
              <>
                {" "}
                · <Badge variant="outline">Upstash</Badge>
              </>
            ) : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
