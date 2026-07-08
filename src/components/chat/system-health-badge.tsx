"use client";

import { HealthBadge } from "@/components/settings/status-badge";
import { useStatusPoll } from "@/components/settings/use-status-poll";

export function SystemHealthBadge() {
  const { data } = useStatusPoll({
    sections: ["system"],
    intervalMs: 30_000,
  });

  const health = data?.system?.health;

  if (!health) {
    return null;
  }

  return <HealthBadge health={health} />;
}
