"use client";

import { Badge } from "@/components/ui/badge";
import type { AggregateHealth, StatusLevel } from "@/lib/status-types";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  WifiOffIcon,
} from "lucide-react";

const STATUS_LABELS: Record<StatusLevel, string> = {
  live: "Live",
  configured: "Configured",
  degraded: "Degraded",
  offline: "Offline",
  unconfigured: "Unconfigured",
};

const HEALTH_LABELS: Record<AggregateHealth, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
};

function statusVariant(
  status: StatusLevel,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "live":
      return "default";
    case "configured":
      return "outline";
    case "degraded":
      return "secondary";
    case "offline":
      return "destructive";
    case "unconfigured":
      return "secondary";
    default:
      return "outline";
  }
}

function healthVariant(
  health: AggregateHealth,
): "default" | "secondary" | "destructive" | "outline" {
  switch (health) {
    case "healthy":
      return "default";
    case "degraded":
      return "secondary";
    case "offline":
      return "destructive";
    default:
      return "outline";
  }
}

function StatusIcon({ status }: { status: StatusLevel }) {
  switch (status) {
    case "live":
      return <CheckCircle2Icon className="size-3" />;
    case "degraded":
      return <AlertTriangleIcon className="size-3" />;
    case "offline":
      return <WifiOffIcon className="size-3" />;
    default:
      return <CircleDashedIcon className="size-3" />;
  }
}

interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge className="gap-1" variant={statusVariant(status)}>
      <StatusIcon status={status} />
      {label ?? STATUS_LABELS[status]}
    </Badge>
  );
}

interface HealthBadgeProps {
  health: AggregateHealth;
}

export function HealthBadge({ health }: HealthBadgeProps) {
  const statusMap: Record<AggregateHealth, StatusLevel> = {
    healthy: "live",
    degraded: "degraded",
    offline: "offline",
  };

  return (
    <Badge className="gap-1" variant={healthVariant(health)}>
      <StatusIcon status={statusMap[health]} />
      {HEALTH_LABELS[health]}
    </Badge>
  );
}

export function readinessLabel(readiness: "ready" | "limited"): string {
  return readiness === "ready" ? "Ready" : "Limited";
}

export function readinessStatus(
  readiness: "ready" | "limited",
): StatusLevel {
  return readiness === "ready" ? "live" : "degraded";
}
