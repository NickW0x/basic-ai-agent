"use client";

import {
  readinessLabel,
  readinessStatus,
  StatusBadge,
} from "@/components/settings/status-badge";
import { AGENT_META } from "@/lib/agent-meta";
import type { AgentsStatusSlice } from "@/lib/status-types";
import { Badge } from "@/components/ui/badge";
import { BotIcon } from "lucide-react";

interface AgentRosterProps {
  agents?: AgentsStatusSlice;
}

export function AgentRoster({ agents }: AgentRosterProps) {
  const statusById = new Map(
    agents?.specialists.map((agent) => [agent.id, agent.readiness]) ?? [],
  );

  const orchestratorReadiness = agents?.orchestrator.readiness ?? "ready";

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BotIcon className="size-4 text-primary" />
        <h2 className="font-medium text-sm">Multi-agent system</h2>
        <Badge className="ml-auto" variant="outline">
          eve + Chat SDK
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_META.map((agent) => {
          const Icon = agent.icon;
          const readiness =
            agent.id === "orchestrator"
              ? orchestratorReadiness
              : (statusById.get(agent.id) ?? "ready");

          return (
            <div
              className="rounded-lg border bg-background/80 px-3 py-2.5"
              key={agent.id}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">{agent.label}</span>
                <StatusBadge
                  label={readinessLabel(readiness)}
                  status={readinessStatus(readiness)}
                />
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {agents?.specialists.find((entry) => entry.id === agent.id)
                  ?.description ?? agent.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
